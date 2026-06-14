import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../context/ConversationContext';
import { streamChat } from '../services/chatService';
import { generateItinerary } from '../services/generateService';
import { createItinerary as saveItinerary } from '../services/itineraryService';
import { useItinerary } from '../context/ItineraryContext';
import { enrichItinerary } from '../utils/enrichItinerary';
import type { Message, RequirementKey, Requirements } from '../types/conversation';

/* ========================================
   useChat Hook — 纯 AI 驱动对话
   AI 完全掌控对话流程
   ======================================== */

let messageCounter = 0;
function generateId() {
  messageCounter += 1;
  return `msg_${Date.now()}_${messageCounter}`;
}

/**
 * 模块级初始化标记 — 跨越 StrictMode 的生命周期
 * React 19 StrictMode 在开发环境会双触发 useReducer 导致状态重置，
 * 用模块级变量可以确保 initConversation 只执行一次
 */
let _dialogInitialized = false;

export function useChat() {
  const { state, dispatch } = useConversation();
  const { dispatch: itineraryDispatch } = useItinerary();
  const navigate = useNavigate();
  const isSendingRef = useRef(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [quickReplyMode, setQuickReplyMode] = useState<'material' | 'generate'>('material');

  /**
   * 初始化对话 — 只在未初始化时执行一次
   * 用模块级变量 _dialogInitialized 而非 state.initialized，
   * 因为 StrictMode 双挂载会导致 useReducer 状态重置
   */
  const initConversation = useCallback(() => {
    if (_dialogInitialized) return;
    _dialogInitialized = true;

    dispatch({ type: 'SET_INITIALIZED', payload: true });

    // 直接显示欢迎语，不依赖 AI 生成
    // 与系统提示词（DEMAND_COLLECTION_SYSTEM_PROMPT）中第1条消息规则保持一致
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: generateId(),
        role: 'ai',
        text: 'Hello，欢迎来到 Travel Planner ✨ 我是你的私人旅行助手，最近有什么想去的地方嘛~',
        timestamp: Date.now(),
      },
    });
  }, [dispatch]);

  // 素材生成逻辑由 DialogPage 组件内的 useEffect 处理
  // 见 DialogPage.tsx 中 searchParams.fromUpload 的处理

  /**
   * 发送消息并获取 AI 流式回复
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSendingRef.current) return;
      isSendingRef.current = true;

      // 1. 添加用户消息
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

      // 2. 识别需求（用于左侧面板，不影响对话）— 全对话历史 + 两阶段策略
      detectAndUpdateRequirement(
        [...state.messages, userMsg],
        dispatch,
        { destination: state.requirements.destination, departure: state.requirements.departure, companions: state.requirements.companions }
      );

      // 3. 自动计算人均预算×人数
      const budgetBefore = state.requirements.budget || '';
      autoCalculateBudget(text.trim(), budgetBefore, state.requirements.companions || '', dispatch);

      // 4. 创建空的 AI 消息占位
      const aiMsgId = generateId();
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { id: aiMsgId, role: 'ai', text: '', timestamp: Date.now() },
      });

      // 5. 调用 AI API
      let aiResponse = '';
      try {
        const allMessages = [
          ...state.messages,
          userMsg,
        ].map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text || '...',
        }));

        for await (const chunk of streamChat(allMessages as { role: 'user' | 'assistant'; content: string }[])) {
          aiResponse += chunk;
          dispatch({ type: 'UPDATE_MESSAGE', payload: { id: aiMsgId, text: aiResponse } });
        }
      } catch (err) {
        console.error('【AI 对话错误】', err);
        aiResponse = getFallbackReply(text);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { id: aiMsgId, text: aiResponse },
        });
      }

      // 6. 从AI回复中提取行程信息（多目的地+天数等）
      if (aiResponse) {
        detectAiItineraryHints(aiResponse, dispatch, state.requirements);
      }

      // 7. 判断是否到了素材询问阶段（AI在问素材 + 至少6项填写完成）
      if (aiResponse) {
        // 用当前消息+已有requirements构建临时完整需求，解决闭包过期
        const projectedReqs = projectRequirements(state.requirements, text);
        const filledCount = allFields.filter(f => projectedReqs[f]).length;
        if (filledCount >= 6 && checkMaterialPhase(aiResponse)) {
          setShowQuickReply(true);
          setConfirmGenerate(false);
          setQuickReplyMode('material');
        }
      }

      isSendingRef.current = false;
    },
    [dispatch, navigate, state.messages, state.requirements, itineraryDispatch]
  );

  /**
   * 处理快捷回复
   */
  const handleQuickReply = useCallback(
    (answer: 'yes' | 'no') => {
      // === 第二层确认：是否生成攻略 ===
      if (confirmGenerate) {
        const replyText = answer === 'yes' ? '好的，帮我生成攻略吧！' : '先不用了';
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: generateId(), role: 'user', text: replyText, timestamp: Date.now() },
        });
        setConfirmGenerate(false);
        setShowQuickReply(false);

        if (answer === 'yes') {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: generateId(), role: 'ai',
              text: '好的！正在根据你的需求生成旅行攻略，请稍等... 🗺️✨',
              timestamp: Date.now(),
            },
          });
          itineraryDispatch({ type: 'SET_LOADING', payload: true });
          // 从全局 Context 读取素材，一起传给后端
          const materials = state.materials.length > 0
            ? state.materials.map(m => ({ type: m.type as 'text' | 'image', content: m.content }))
            : undefined;
          // 将全部对话历史传给后端，AI 据此理解用户上下文细节
          const conversationHistory = state.messages.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text,
          }));
          setTimeout(async () => {
            try {
              const result = await generateItinerary(state.requirements, materials, conversationHistory);
              if (result.itinerary) {
                const enriched = enrichItinerary(result.itinerary, state.requirements);
                // 自动保存到 SQLite（不阻断主流程）
                saveItinerary({ title: enriched.title, data: enriched, summary: '' })
                  .then(saved => { if (saved?.id) enriched.id = saved.id; })
                  .catch(() => {});
                itineraryDispatch({ type: 'SET_ITINERARY', payload: enriched });
                itineraryDispatch({ type: 'ADD_TO_LIST', payload: enriched });
              }
            } catch (e) { console.error('【攻略生成失败】', e); }
            itineraryDispatch({ type: 'SET_LOADING', payload: false });
            navigate('/itinerary');
          }, 1500);
        }
        return;
      }

      // === 第一层：素材询问 ===
      const replyText = answer === 'yes'
        ? '有的，我上传一些素材 📎'
        : '没有找到特别的参考';
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { id: generateId(), role: 'user', text: replyText, timestamp: Date.now() },
      });

      if (answer === 'yes') {
        // 有素材 → 跳转到素材页，标记待生成状态
        dispatch({ type: 'SET_PENDING_GENERATION', payload: true });
        setShowQuickReply(false);
        setTimeout(() => navigate('/upload'), 300);
      } else {
        // 无素材 → 确认是否生成攻略（不直接生成）
        setShowQuickReply(false);
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: generateId(), role: 'ai',
            text: '好的！那我先为你生成一份攻略？',
            timestamp: Date.now(),
          },
        });
        // 短暂延迟后显示确认按钮
        setTimeout(() => {
          setConfirmGenerate(true);
          setQuickReplyMode('generate');
          setShowQuickReply(true);
        }, 500);
      }
    },
    [dispatch, navigate, state.requirements, state.materials, state.messages, itineraryDispatch, confirmGenerate]
  );

  /**
   * 外部触发确认生成攻略（素材上传返回后调用）
   * 显示"是否需要为你生成攻略？"确认按钮
   */
  const requestConfirmGenerate = useCallback(() => {
    setShowQuickReply(false);
    setConfirmGenerate(true);
    setQuickReplyMode('generate');
    // 短暂延迟让状态生效
    setTimeout(() => setShowQuickReply(true), 100);
  }, []);

  // 计算需求进度（仅用于面板展示）
  const filledCount = Object.values(state.requirements).filter(v => v !== '').length;
  const progress = Math.min(100, Math.round((filledCount / 9) * 100));

  // 手动生成攻略按钮: 需要前6项必填字段全部填满
  const requiredFields: RequirementKey[] = ['destination', 'departure', 'travelDate', 'days', 'budget', 'companions'];
  const canGenerate = requiredFields.every(f => state.requirements[f]);

  return {
    messages: state.messages,
    requirements: state.requirements,
    completedRequirements: Object.entries(state.requirements)
      .filter(([, v]) => v !== '')
      .map(([k]) => k) as any[],
    progress,
    canGenerate,
    showQuickReply,
    quickReplyMode: quickReplyMode as 'material' | 'generate',
    initConversation,
    sendMessage,
    handleQuickReply,
    requestConfirmGenerate,
  };
}

/**
 * 全部需求字段列表（模块级，供多处引用）
 */
const allFields: RequirementKey[] = ['destination', 'departure', 'travelDate', 'days', 'budget', 'companions', 'preferences', 'accommodation', 'transport'];

/**
 * 检测 AI 回复是否在询问素材（需全部9项需求都采集完毕）
 */
function checkMaterialPhase(text: string): boolean {
  const hasKeyword = text.includes('素材') || text.includes('上传') || text.includes('帖子')
    || text.includes('截图') || text.includes('参考') || text.includes('发给')
    || text.includes('发给我') || text.includes('查过什么') || text.includes('看过什么')
    || (text.includes('攻略') && (text.includes('看过') || text.includes('查看') || text.includes('感兴趣')));
  return hasKeyword;
}

/**
 * 将当前消息文本与已有需求合并，模拟用户消息发送后的需求状态
 * 解决 React 闭包中 state.requirements 还未更新 dispatch 的问题
 */
function projectRequirements(existing: Record<string, string> | Requirements, currentText: string): Record<string, string> {
  const projected = { ...existing };
  // 预算
  const budgetMatch = currentText.match(/人均[约大概]?\s*(\d+)/) || currentText.match(/每人[约大概]?\s*(\d+)/) || currentText.match(/每个人[约大概]?\s*(\d+)/) || currentText.match(/一个人[约大概预算]?\s*(\d+)/);
  if (budgetMatch && !projected.budget) projected.budget = `人均${budgetMatch[1]}元`;
  // 天数
  const dayMatch = currentText.match(/(\d+)\s*天/);
  if (dayMatch && !projected.days) projected.days = `${dayMatch[1]}天`;
  // 时间
  const dateMatch = currentText.match(/(\d+)\s*月|(五月|六月|七月|八月|九月|十月)/);
  if (dateMatch && !projected.travelDate) projected.travelDate = dateMatch[0];

  // 如果当前文本提到其他已知城市，追加到目的地
  const knownCities = ['北京','上海','成都','重庆','西安','五台山','大同','杭州','广州','深圳','大理','丽江','厦门','青岛','三亚'];
  for (const city of knownCities) {
    if (currentText.includes(city) && !projected.destination?.includes(city)) {
      projected.destination = projected.destination ? `${projected.destination}、${city}` : city;
    }
  }

  // 出发地
  if (!projected.departure) {
    const depMatch = currentText.match(/从\s*([^\s]{2,6})(?:出发|走|来)/);
    if (depMatch) projected.departure = depMatch[1];
  }

  // 同行人员
  if (!projected.companions) {
    const companionHints: [string, string][] = [
      ['情侣','情侣'], ['一个人','独自'], ['独自','独自'],
      ['朋友','朋友'], ['闺蜜','朋友'], ['同学','朋友'], ['同事','朋友'],
      ['家人','家人'], ['父母','家人'], ['爸妈','家人'], ['亲子','亲子'], ['带娃','亲子'],
    ];
    for (const [kw, val] of companionHints) {
      if (currentText.includes(kw)) { projected.companions = val; break; }
    }
  }

  // 游玩偏好
  if (!projected.preferences) {
    const prefHints = ['美食','自然','人文','历史','文化','拍照','购物','休闲','徒步','海边','爬山','夜景','文艺'];
    const found = prefHints.filter(w => currentText.includes(w));
    if (found.length > 0) projected.preferences = found.join('、');
  }

  // 住宿偏好
  if (!projected.accommodation) {
    const accomHints = ['民宿','酒店','青旅','客栈','市中心','地铁','干净','安静','实惠'];
    for (const kw of accomHints) {
      if (currentText.includes(kw)) { projected.accommodation = kw; break; }
    }
  }

  // 交通偏好
  if (!projected.transport) {
    const transportHints = ['飞机','高铁','火车','自驾','大巴','动车'];
    for (const kw of transportHints) {
      if (currentText.includes(kw)) { projected.transport = kw; break; }
    }
  }

  return projected;
}

/**
 * 从AI回复中提取行程线索（多目的地+天数分配）
 */
function detectAiItineraryHints(text: string, dispatch: any, currentRequirements: Record<string, string> | Requirements = {}) {
  // 匹配 "X可以玩Y天"、"X逛Y天" 等模式
  const playPattern = /([一-鿿]{2,6})[可以]?[玩逛待]\s*(\d+)\s*[-~至到]?\s*(\d*)\s*天/g;
  const totalDaysPattern = /(?:总共|一共|合计)\s*(\d+)\s*天/;

  // 尝试匹配总天数
  const totalMatch = text.match(totalDaysPattern);
  if (totalMatch) {
    const totalDays = parseInt(totalMatch[1], 10);
    if (totalDays > 0 && !currentRequirements.days) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'days', value: `${totalDays}天` } });
    }
  }

  // 提取"华山玩1-2天，西安2-3天"等信息
  while (playPattern.exec(text) !== null) {
    // extract day ranges
  }

  // 简单模式: "X玩Y天" ("华山玩1-2天")
  const simplePattern = /[一-鿿]{2,6}[玩逛呆待]\s*(\d+)\s*[-~至到]?\s*(\d*)\s*天/;
  const simpleMatch = text.match(simplePattern);
  if (simpleMatch && !currentRequirements.days) {
    const days = simpleMatch[2] || simpleMatch[1];
    dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'days', value: `${days}天` } });
  }
}

/**
 * 识别需求并更新到 Context — 全对话历史 + 两阶段策略
 * 传入全部消息（AI + 用户）、dispatch、当前已存储的需求数据
 * 规则：AI没问出发地前收集所有游玩城市；AI一问出发地，只取最新用户消息最后一个城市作为出发地
 */
function detectAndUpdateRequirement(
  allMessages: Message[],
  dispatch: any,
  currentReq: { destination: string; departure: string; companions?: string }
) {
  // ============================
  // 0. 拆分所有历史消息：区分AI消息、用户消息
  // ============================
  const userTexts: string[] = [];
  const aiTexts: string[] = [];
  for (const msg of allMessages) {
    if (msg.role === 'user') userTexts.push(msg.text);
    else if (msg.role === 'ai') aiTexts.push(msg.text);
  }
  const lastUserText = userTexts.at(-1) || '';
  const lastAiText = aiTexts.at(-1) || '';
  const allUserJoined = userTexts.join(' ');

  // ============================
  // 1. 分词库：城市、省份分开存放
  // ============================
  const cityList = [
    '北京', '上海', '天津', '重庆',
    '香港', '澳门', '台北', '高雄', '台中', '台南', '花莲', '垦丁',
    '石家庄', '唐山', '秦皇岛', '邯郸', '保定', '承德', '张家口', '北戴河', '白洋淀',
    '太原', '大同', '平遥', '五台山', '晋中', '临汾', '壶口',
    '呼和浩特', '包头', '呼伦贝尔', '鄂尔多斯', '赤峰', '满洲里', '阿拉善', '额济纳',
    '沈阳', '大连', '鞍山', '丹东', '锦州', '本溪',
    '长春', '吉林', '延吉', '长白山', '延边',
    '哈尔滨', '齐齐哈尔', '大庆', '牡丹江', '漠河', '伊春', '黑河', '佳木斯',
    '南京', '苏州', '无锡', '常州', '镇江', '扬州', '南通', '徐州', '连云港',
    '盐城', '淮安', '泰州', '宿迁', '周庄', '同里',
    '杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '台州', '舟山',
    '丽水', '衢州', '乌镇', '西塘', '千岛湖', '莫干山',
    '合肥', '芜湖', '蚌埠', '安庆', '黄山', '宏村', '西递', '九华山', '歙县',
    '福州', '厦门', '泉州', '漳州', '龙岩', '武夷山', '平潭', '霞浦', '湄洲岛',
    '南昌', '九江', '景德镇', '赣州', '庐山', '井冈山', '三清山', '龙虎山', '鄱阳湖',
    '济南', '青岛', '烟台', '威海', '日照', '潍坊', '临沂', '泰安', '济宁',
    '淄博', '枣庄', '曲阜', '蓬莱', '泰山',
    '郑州', '洛阳', '开封', '安阳', '南阳', '信阳', '焦作', '平顶山', '嵩山', '云台山',
    '武汉', '宜昌', '襄阳', '荆州', '十堰', '恩施', '神农架', '武当山', '三峡',
    '长沙', '株洲', '湘潭', '衡阳', '岳阳', '常德', '湘西', '凤凰', '韶山',
    '广州', '深圳', '东莞', '佛山', '珠海', '中山', '惠州', '汕头', '湛江',
    '韶关', '肇庆', '清远', '梅州', '潮州', '汕尾', '阳江', '江门',
    '南宁', '桂林', '柳州', '北海', '阳朔', '龙脊', '崇左', '德天', '黄姚',
    '海口', '三亚', '万宁', '文昌', '琼海', '陵水', '五指山', '儋州',
    '成都', '绵阳', '德阳', '宜宾', '南充', '乐山', '九寨沟', '黄龙', '峨眉山',
    '稻城', '色达', '康定', '理塘', '亚丁', '阆中',
    '贵阳', '遵义', '安顺', '黔东南', '千户苗寨', '镇远', '黄果树', '荔波', '梵净山', '肇兴',
    '昆明', '大理', '丽江', '香格里拉', '西双版纳', '腾冲', '泸沽湖', '玉龙雪山',
    '普者黑', '抚仙湖', '元阳', '梅里雪山', '雨崩', '瑞丽',
    '拉萨', '林芝', '日喀则', '昌都', '纳木错', '羊卓雍措', '珠峰', '阿里',
    '西安', '咸阳', '宝鸡', '延安', '汉中', '华山', '兵马俑',
    '兰州', '敦煌', '嘉峪关', '张掖', '天水', '甘南', '扎尕那', '七彩丹霞', '莫高窟', '郎木寺',
    '西宁', '青海湖', '茶卡盐湖', '祁连', '德令哈', '格尔木', '可可西里',
    '银川', '中卫', '沙坡头',
    '乌鲁木齐', '吐鲁番', '伊犁', '喀什', '阿勒泰', '哈密', '喀纳斯', '赛里木湖', '那拉提', '库尔勒',
  ];
  const provinceList = [
    '青海', '甘肃', '陕西', '四川', '云南', '贵州', '湖南', '湖北',
    '河南', '河北', '山东', '山西', '江西', '江苏', '浙江', '福建',
    '广东', '广西', '海南', '辽宁', '吉林', '黑龙江', '安徽',
    '新疆', '西藏', '内蒙古', '宁夏',
  ];

  // AI询问出发地的关键词
  const departureKeywords = [
    '从哪出发', '从哪里出发', '从哪儿出发', '出发地', '从哪里走',
    '从哪来', '你的出发地', '你的出发城市', '出发城市', '在哪个城市出发',
    '哪个城市出发', '从哪里过去', '从哪个城市出发', '从哪里过来',
    '从哪过来', '在哪个城市', '从哪开始', '从哪启程', '在哪里出发',
  ];
  const isAskingDeparture = departureKeywords.some(kw => lastAiText.includes(kw));

  // ============================
  // 2. 城市提取函数：按出现先后排序，去重
  // ============================
  function findAllCities(text: string): string[] {
    const cityPositionList: { name: string; index: number }[] = [];
    for (const city of cityList) {
      let matchIndex = text.indexOf(city);
      while (matchIndex !== -1) {
        cityPositionList.push({ name: city, index: matchIndex });
        matchIndex = text.indexOf(city, matchIndex + city.length);
      }
    }
    cityPositionList.sort((a, b) => a.index - b.index);
    const seenCity = new Set<string>();
    const result: string[] = [];
    for (const item of cityPositionList) {
      if (!seenCity.has(item.name)) {
        seenCity.add(item.name);
        result.push(item.name);
      }
    }
    return result;
  }

  // ============================
  // 3. 分两大阶段执行
  // ============================
  if (isAskingDeparture) {
    // ===== 阶段2：AI询问出发地，只处理出发地，不改目的地 =====
    const matchedCities = findAllCities(lastUserText);
    if (matchedCities.length > 0) {
      const finalDeparture = matchedCities.at(-1)!;
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'departure', value: finalDeparture } });
    }
    // 直接返回，不再跑目的地逻辑
    // 注意：仍需继续执行下方其他字段检测，不要 return
    // 防御：如果出发地城市意外出现在目的地中，将其移除（用户回答出发地时不应增加目的地）
    if (matchedCities.length > 0 && currentReq.destination) {
      const destCities = currentReq.destination.split('、');
      const filtered = destCities.filter(c => !matchedCities.includes(c));
      if (filtered.length !== destCities.length) {
        dispatch({
          type: 'UPDATE_REQUIREMENT',
          payload: { key: 'destination', value: filtered.join('、') || '' }
        });
      }
    }
  } else {
    // ===== 阶段1：AI还没问出发地，只收集目的地 =====
    const allMatchedCities = findAllCities(allUserJoined);
    const allMatchedProvinces = provinceList.filter(p => allUserJoined.includes(p));
    const hasRealCity = allMatchedCities.length > 0;

    if (!hasRealCity && allMatchedProvinces.length > 0) {
      // 用户只发了省份，不提取目的地（让AI追问城市）
    } else if (allMatchedCities.length > 0) {
      // 与仓库旧目的地合并、去重、增量追加
      // 但需要排除已明确的出发地城市（防止将出发地回答的城市也加入目的地）
      const oldDestList = currentReq.destination ? currentReq.destination.split('、') : [];
      const departureCity = currentReq.departure || '';
      const citiesToAdd = allMatchedCities.filter(c => c !== departureCity);
      const destSet = new Set([...oldDestList, ...citiesToAdd]);
      const finalDestList = Array.from(destSet);
      dispatch({
        type: 'UPDATE_REQUIREMENT',
        payload: { key: 'destination', value: finalDestList.join('、') }
      });
    }
  }

  // ============================
  // 4. 其他字段提取（不受阶段影响，从 lastUserText 提取）
  // ============================

  // 出行时间
  const travelDatePatterns = [
    lastUserText.match(/(\d+)\s*月[底末初份]?/),
    lastUserText.match(/([春夏秋冬])[季天]?/),
    lastUserText.match(/(暑假|寒假|国庆|五一|春节|元旦|清明|端午|中秋|春节前后|过年)/),
    lastUserText.match(/(一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)/),
    lastUserText.match(/(上旬|中旬|下旬)/),
    lastUserText.match(/(年初|年底|年尾|岁末)/),
  ];
  for (const m of travelDatePatterns) {
    if (m) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'travelDate', value: m[0] } });
      break;
    }
  }

  // 天数
  const dayPatterns: [RegExp, (m?: RegExpMatchArray) => string][] = [
    [/一日游|玩一天|1天/, () => '1天'],
    [/两日游|两天|玩两天|2天/, () => '2天'],
    [/三日游|三天|玩三天|3天/, () => '3天'],
    [/四天|玩四天|4天/, () => '4天'],
    [/五日游|五天|玩五天|5天/, () => '5天'],
    [/六天|玩六天|6天/, () => '6天'],
    [/一周|七天|玩一周|一个星期|7天/, () => '7天'],
    [/八天|玩八天|8天/, () => '8天'],
    [/九天|玩九天|9天/, () => '9天'],
    [/十天|玩十天|10天/, () => '10天'],
    [/两周|十四天|半个月|14天|15天/, () => '14天'],
    [/一个月|三十天|30天/, () => '30天'],
    [/(\d+)\s*天/, (m?: RegExpMatchArray) => `${m![1]}天`],
    [/玩\s*(\d+)\s*天/, (m?: RegExpMatchArray) => `${m![1]}天`],
  ];
  for (const [pattern, getValue] of dayPatterns) {
    const m = lastUserText.match(pattern);
    if (m) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'days', value: getValue(m) } });
      break;
    }
  }

  // 预算等级
  const budgetLevelMap: [string, string][] = [
    ['经济型', '经济型'], ['穷游', '经济型'], ['省着点', '经济型'],
    ['节约', '经济型'], ['怎么便宜怎么来', '经济型'],
    ['舒适型', '舒适型'], ['中等', '舒适型'], ['适中', '舒适型'], ['正常标准', '舒适型'],
    ['豪华型', '豪华型'], ['高端', '豪华型'], ['享受', '豪华型'],
    ['奢侈', '豪华型'], ['不差钱', '预算不限'], ['没有预算限制', '预算不限'],
    ['预算不限', '预算不限'], ['随便花', '预算不限'], ['无所谓', '预算不限'],
    ['不限', '预算不限'], ['够用就行', '舒适型'],
  ];
  for (const [keyword, value] of budgetLevelMap) {
    if (lastUserText.includes(keyword)) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'budget', value } });
      break;
    }
  }

  function chineseNumberToArabic(chinese: string): string {
    const map: Record<string, string> = {
      '一': '1', '二': '2', '两': '2', '三': '3', '四': '4',
      '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
    };
    let result = '';
    for (const char of chinese) {
      if (map[char]) result += map[char];
      else result += char;
    }
    return result;
  }

  // 预算数字
  const budgetChecks: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/(\d+)\s*[-~至到]\s*(\d+)\s*元?/, (m) => `${m[1]}-${m[2]}元`],
    [/人均[约大概]?\s*(\d+)/, (m) => `人均${m[1]}元`],
    [/每人[约大概]?\s*(\d+)/, (m) => `人均${m[1]}元`],
    [/每个人[约大概]?\s*(\d+)/, (m) => `人均${m[1]}元`],
    [/一个人[约大概预算]?\s*(\d+)/, (m) => `人均${m[1]}元`],
    [/(\d+)\s*元\s*\/\s*人/, (m) => `人均${m[1]}元`],
    [/预算[约大概]?\s*(\d+)/, (m) => `${m[1]}元`],
    [/(\d+)\s*块[钱]?/, (m) => `${m[1]}元`],
    [/(\d+)\s*万/, (m) => m[0]],
    [/[约大概]?\s*(\d+)\s*[多来]/, (m) => `${m[1]}元多`],
    [/[约大概]?\s*(\d+)\s*左右/, (m) => `${m[1]}元左右`],
    [/[约大概]?\s*(\d+)\s*上下/, (m) => `${m[1]}元上下`],
    [/[约大概]?\s*(\d+)\s*元/, (m) => `${m[1]}元`],
    [/(\d+)\s*[以之]?内/, (m) => `${m[1]}元以内`],
    [/(\d+)\s*[以之]?下/, (m) => `${m[1]}元以下`],
    [/(\d+)\s*[以之]?上/, (m) => `${m[1]}元以上`],
    [/(\d+)\s*余/, (m) => `${m[1]}元余`],
    [/不超[过]\s*(\d+)/, (m) => `${m[1]}元以内`],
    [/两[千万]/, (m) => `${chineseNumberToArabic(m[0])}元`],
    [/[一二三四五六七八九十][千万]/, (m) => `${chineseNumberToArabic(m[0])}元`],
    [/[一二三四五六七八九十]百/, (m) => `${chineseNumberToArabic(m[0])}元`],
  ];
  let budgetMatched = false;
  for (const [pattern, formatter] of budgetChecks) {
    const m = lastUserText.match(pattern);
    if (m) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'budget', value: formatter(m) } });
      budgetMatched = true;
      break;
    }
  }
  if (!budgetMatched) {
    const cleanNumber = lastUserText.replace(/[^\d]/g, '');
    if (cleanNumber.length >= 3 && cleanNumber.length <= 7 && cleanNumber === lastUserText.trim()) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'budget', value: `${cleanNumber}元` } });
    }
  }

  // 同行人员
  const companionMap: [string, string][] = [
    ['和男朋友', '情侣'], ['和女朋友', '情侣'], ['带男朋友', '情侣'],
    ['带女朋友', '情侣'], ['和对象', '情侣'], ['和老公', '情侣'],
    ['和老婆', '情侣'], ['男朋友', '情侣'], ['女朋友', '情侣'],
    ['对象', '情侣'], ['老公', '情侣'], ['老婆', '情侣'], ['恋人', '情侣'],
    ['情侣', '情侣'], ['小两口', '情侣'], ['夫妻', '情侣'], ['蜜月', '情侣'],
    ['和对象一起', '情侣'], ['和对象两个人', '情侣'],
    ['自己一个人', '独自'], ['一个人去', '独自'], ['独自', '独自'],
    ['一个人', '独自'], ['自己', '独自'], ['单人', '独自'], ['单独', '独自'],
    ['和闺蜜', '朋友'], ['和兄弟', '朋友'], ['和朋友', '朋友'],
    ['和同事', '朋友'], ['和同学', '朋友'], ['闺蜜', '朋友'],
    ['兄弟', '朋友'], ['朋友', '朋友'], ['同事', '朋友'], ['同学', '朋友'],
    ['带父母', '家人'], ['和父母', '家人'], ['带爸妈', '家人'],
    ['和爸妈', '家人'], ['带家人', '家人'], ['和家人', '家人'],
    ['父母', '家人'], ['爸妈', '家人'], ['家人', '家人'], ['全家', '家人'],
    ['家庭', '家人'], ['亲子', '亲子'], ['带娃', '亲子'], ['带孩子', '亲子'],
    ['带小孩', '亲子'], ['和小孩', '亲子'], ['小孩', '亲子'],
    ['和团建', '朋友'], ['团建', '朋友'],
    ['二人', '情侣'],
  ];
  const existingCompanions = currentReq?.companions || '';
  for (const [keyword, value] of companionMap) {
    if (lastUserText.includes(keyword)) {
      // 保护：已有明确值（朋友/家人/亲子等）时，"两个人"这种模糊词不覆盖
      const isUncertain = ['二人'].some(k => keyword === k);
      if (isUncertain && existingCompanions && existingCompanions !== '情侣') {
        break;
      }
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'companions', value } });
      break;
    }
  }

  // 游玩偏好
  const prefWords = [
    '美食', '小吃', '美食街', '夜市', '逛吃', '吃货', '探店', '当地菜',
    '海鲜', '烧烤', '火锅', '甜品',
    '自然风光', '自然风景', '山林', '田园', '草原', '森林',
    '雪山', '爬山', '登山', '徒步', '户外', '看海', '海滩', '海边',
    '人文古迹', '历史遗迹', '古建筑', '古镇', '古城', '文化遗产',
    '人文历史', '历史文化', '文化古迹',
    '博物馆', '美术馆', '寺庙',
    '逛街', '休闲', '放松', '度假', '慢节奏', '文艺', '拍照', '打卡', '城市漫步',
    '冒险', '刺激', '漂流', '蹦极', '攀岩', '露营', '潜水', '滑雪',
    '温泉', '养生', '演出', '音乐节', '酒吧', '夜生活',
    '游乐园', '动物园', '海洋馆', '看熊猫',
    '蜜月', '亲子', '团建', '毕业旅行',
  ];
  const foundPrefs = prefWords.filter(w => lastUserText.includes(w));
  if (foundPrefs.length > 0) {
    dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'preferences', value: foundPrefs.join('、') } });
  }

  // 交通偏好
  const transportMap: [string, string][] = [
    ['飞机', '飞机'], ['坐飞机', '飞机'], ['乘飞机', '飞机'], ['航空', '飞机'],
    ['高铁', '高铁'], ['火车', '火车'], ['坐火车', '火车'],
    ['动车', '高铁'], ['绿皮', '火车'], ['硬座', '火车'], ['硬卧', '火车'], ['软卧', '火车'],
    ['自驾', '自驾'], ['开车', '自驾'], ['自己开车', '自驾'], ['租车', '自驾'],
    ['大巴', '大巴'], ['长途汽车', '大巴'], ['客车', '大巴'],
    ['轮渡', '轮渡'], ['坐船', '轮渡'], ['邮轮', '邮轮'], ['游轮', '邮轮'],
    ['怎么省钱怎么来', '火车'], ['节省预算', '火车'],
    ['快一点', '飞机'], ['赶时间', '飞机'], ['方便', '飞机'],
  ];
  for (const [keyword, value] of transportMap) {
    if (lastUserText.includes(keyword)) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'transport', value } });
      break;
    }
  }

  // 住宿偏好
  const accomMap: [string, string][] = [
    ['民宿', '民宿'], ['酒店', '酒店'], ['青旅', '青年旅舍'],
    ['客栈', '客栈'], ['度假村', '度假村'], ['公寓', '公寓'],
    ['日租房', '短租公寓'], ['短租', '短租公寓'],
    ['地铁', '近地铁'], ['地铁站', '近地铁'],
    ['交通方便', '交通便利'], ['交通便利', '交通便利'],
    ['市中心', '市中心'], ['市区', '市中心'], ['繁华', '市中心'],
    ['商圈', '商圈附近'], ['步行街', '商圈附近'],
    ['安静', '安静'], ['干净', '干净整洁'], ['卫生', '干净整洁'],
    ['便宜', '经济实惠'], ['性价比', '经济实惠'], ['实惠', '经济实惠'],
    ['豪华', '豪华型'], ['高档', '豪华型'], ['五星', '豪华型'],
    ['四星', '舒适型'], ['三星', '经济型'],
    ['海景', '海景房'], ['海景房', '海景房'],
    ['江景', '江景房'], ['湖景', '湖景房'], ['山景', '山景房'],
    ['特色', '特色住宿'], ['有特色', '特色住宿'],
    ['设计', '设计酒店'], ['网红', '网红民宿'],
    ['亲子', '亲子房'], ['家庭房', '亲子房'],
    ['大床', '大床房'], ['双床', '双床房'], ['标准间', '标准间'],
    ['套间', '套房'], ['有窗', '有窗'],
    ['独卫', '独立卫生间'], ['独立卫生间', '独立卫生间'],
  ];
  for (const [keyword, value] of accomMap) {
    if (lastUserText.includes(keyword)) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { key: 'accommodation', value } });
      break;
    }
  }
}

/**
 * API 不可用时的降级回复
 */
function getFallbackReply(userText: string): string {
  const input = userText.toLowerCase();
  if (input.includes('成都')) return '成都好呀！除了成都，你还计划去其他地方吗？大概玩几天呢？😊';
  if (input.match(/\d+\s*天/)) return '好的！那这次旅行大概预算是多少呢？💰';
  if (input.includes('预算') || input.includes('元') || input.includes('¥')) return '了解了！你是独自旅行还是和朋友结伴呢？👥';
  if (input.includes('情侣') || input.includes('朋友') || input.includes('家人') || input.includes('一个人')) return '太棒了！你更喜欢什么类型的玩法？美食、自然风景还是人文历史？🎯';
  if (input.includes('美食') || input.includes('自然') || input.includes('风景') || input.includes('购物')) return '好的我记下了！还有其他想法都可以继续告诉我哦 😊';
  return '收到！还有其他想和我分享的吗？比如想去哪里、玩几天之类的～😊';
}

/**
 * 检测用户是否正向回复"生成行程"建议
 */
function checkIfUserWantsGenerate(text: string): boolean {
  const input = text.trim().toLowerCase();
  const exactMatch = ['好', '好的', '好啊', '好吧', '好呀', '可以', '可以的', '可以呀',
    '行', '行啊', '行吧', 'ok', 'okay', '嗯', '嗯嗯', '对', '对的', '是的',
    '要', '需要', '需要的', '生成', '生成吧', '安排', '来吧', '走起', '搞起',
    '来一个', '来看看', '看看'];
  if (exactMatch.includes(input.replace(/[，。！？,.!?\s]/g, ''))) return true;

  const containsPatterns = [
    /好[的啊]?\s*生[成]/, /可以\s*生[成]/, /帮我\s*生[成]/,
    /帮我\s*搞/, /帮我\s*做/, /帮我\s*推荐/,
    /来一[个份]/, /安排[上一下吧]/, /生[成吧]?/,
    /走起/, /搞起/, /好[的啊]?\s*推[荐]/,
    /展示[一下吧]?/, /看看[一下吧]?/, /可以[的啊]?\s*推[荐]/,
    /[好可]?\s*的[吧]?\s*生/, /生成[一下吧]?/,
  ];
  for (const p of containsPatterns) {
    if (p.test(input)) return true;
  }
  return false;
}

/**
 * 统计已填写的需求数量
 */
function countFilledRequirements(requirements: Record<string, string>, currentText: string): number {
  const fields = ['destination', 'departure', 'travelDate', 'days', 'budget', 'companions', 'preferences', 'accommodation', 'transport'];
  let count = 0;
  for (const key of fields) {
    if (requirements[key]) {
      count++;
    } else {
      if (key === 'destination' && /北京|上海|成都|广州|深圳|杭州|西安|重庆|大理|丽江|三亚|厦门|青岛|大连/.test(currentText)) count++;
      else if (key === 'departure' && /从\s*[^\s]{2,4}\s*(?:出发|走|来)/.test(currentText)) count++;
      else if (key === 'travelDate' && /\d月|月[底末初]|暑假|寒假|国庆|五一|春节|春季|夏季|秋季|冬季|春天|夏天|秋天|冬天/.test(currentText)) count++;
      else if (key === 'days' && /\d+\s*天|一周|一个月|半个月|三天|五天/.test(currentText)) count++;
      else if (key === 'budget' && /\d{3,}/.test(currentText)) count++;
      else if (key === 'companions' && /情侣|朋友|家人|独自|一个人|闺蜜|兄弟|同事|亲子|带娃/.test(currentText)) count++;
      else if (key === 'preferences' && /美食|自然|风景|人文|历史|购物|休闲|拍照|徒步|爬山|海边|慢节奏|度假/.test(currentText)) count++;
      else if (key === 'accommodation' && /民宿|酒店|青旅|客栈|地铁|市中心|安静|干净|便宜/.test(currentText)) count++;
      else if (key === 'transport' && /飞机|高铁|火车|自驾|开车|坐车|大巴|轮渡/.test(currentText)) count++;
    }
  }
  return count;
}

/**
 * 生成跳转前的过渡总结文案
 */
function generateSummaryText(requirements: Record<string, string>): string {
  const dest = requirements.destination || '目的地';
  const date = requirements.travelDate || '';
  const days = requirements.days || '';
  const pref = requirements.preferences || '';
  const dep = requirements.departure || '';
  let text = `太棒了！正在根据你的需求为你定制${dest}`;
  if (dep) text += `（从${dep}出发）`;
  if (date) text += `（${date}）`;
  if (days) text += days;
  if (pref) text += `（${pref}）`;
  text += '的旅行攻略 ✨\n\n';
  text += '即将为你生成专属攻略，请稍等... 🗺️';
  return text;
}

/**
 * 自动计算人均预算×人数 → 总预算
 */
function autoCalculateBudget(
  text: string,
  existingBudget: string,
  companions: string,
  dispatch: any
) {
  const perPersonMatch = text.match(/人均[约大概]?\s*(\d+)/) || text.match(/每人[约大概]?\s*(\d+)/) || text.match(/每个人[约大概]?\s*(\d+)/) || text.match(/一个人[约大概预算]?\s*(\d+)/);
  const existingPerPerson = existingBudget.match(/人均.*?(\d+)/);
  const hasPerPerson = perPersonMatch || (existingPerPerson && existingBudget.includes('人均'));
  if (!hasPerPerson) return;
  if (!companions) return;

  const perPerson = perPersonMatch
    ? parseInt(perPersonMatch[1])
    : (existingPerPerson ? parseInt(existingPerPerson[1]) : 0);
  if (!perPerson) return;

  let peopleCount = 0;
  if (companions.includes('独自') || companions.includes('一个人')) peopleCount = 1;
  else if (companions.includes('情侣') || companions.includes('两个人') || companions.includes('二人')) peopleCount = 2;
  else if (companions.match(/\d+/)) {
    const m = companions.match(/\d+/);
    if (m) peopleCount = parseInt(m[1]);
  }

  if (peopleCount > 0) {
    const total = perPerson * peopleCount;
    dispatch({
      type: 'UPDATE_REQUIREMENT',
      payload: { key: 'budget', value: `人均${perPerson}元×${peopleCount}人≈${total}元` },
    });
  }
}