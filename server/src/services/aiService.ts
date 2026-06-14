import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';

/* ========================================
   AI 服务封装 — OpenAI SDK
   ======================================== */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!openaiClient) {
    // 如果是 Anthropic API key，使用兼容端点
    const baseURL = process.env.OPENAI_BASE_URL || undefined;
    openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return openaiClient;
}

/**
 * 检查 AI 服务是否可用
 */
export function isAiAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 非流式 AI 对话（用于攻略生成和调整）
 */
export async function callAi(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json_object';
  }
): Promise<string> {
  const client = getClient();

  if (!client) {
    logger.warn('AI 服务未配置 API Key，使用 Mock 回复');
    return mockAiResponse(systemPrompt, userMessage);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        response_format: options?.responseFormat === 'json_object'
          ? { type: 'json_object' }
          : undefined,
      });

      const content = response.choices[0]?.message?.content ?? '';
      // Token 统计
      if (response.usage) {
        logger.info(`AI 调用完成 — 输入: ${response.usage.prompt_tokens} tokens, 输出: ${response.usage.completion_tokens} tokens`);
      }
      return content;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`AI 调用失败 (尝试 ${attempt}/${MAX_RETRIES}): ${(err as Error).message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError || new Error('AI 调用失败');
}

/**
 * 流式 AI 对话（用于对话页实时展示）
 */
export async function* callAiStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string> {
  const client = getClient();

  if (!client) {
    logger.warn('AI 服务未配置 API Key，使用 Mock 流式回复');
    const mockText = mockAiResponse(systemPrompt, messages[messages.length - 1]?.content || '');
    // 模拟流式输出
    for (let i = 0; i < mockText.length; i += 5) {
      yield mockText.slice(i, i + 5);
      await sleep(30);
    }
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      // DeepSeek 推理模型：先用 reasoning_content 输出思考过程，再输出 content
      // 我们只取实际的 content，跳过推理过程
      if (delta?.content) {
        yield delta.content;
      }
    }
  } catch (err) {
    logger.error(`流式 AI 调用失败: ${(err as Error).message}`);
    throw err;
  }
}

/* ========================================
   Mock AI 回复（API Key 未配置时的降级）
   ======================================== */

function mockAiResponse(systemPrompt: string, userMessage: string): string {
  const input = userMessage.toLowerCase();

  // 攻略生成
  if (input.includes('生成攻略') || input.includes('generate')) {
    return mockGenerateItinerary();
  }

  // 攻略调整
  if (input.includes('调整') || input.includes('修改') || input.includes('添加') || input.includes('删除')) {
    return `根据你的需求，我已经调整了攻略内容。${mockAdjustItinerary(input)}`;
  }

  // 如果用户说"还没想好"、"不知道"、"没想法"、"你推荐一下"
  if (input.includes('没想好') || input.includes('不知道') || input.includes('没想法') || input.includes('推荐一下') || input.includes('推荐') || input.includes('没想去哪') || input.includes('不晓得')) {
    return '那我给你几个灵感吧：① 云南大理 – 苍山洱海，适合放松；② 重庆 – 美食+魔幻城市；③ 厦门 – 海滨文艺。你觉得这几个里有感兴趣的吗？😊';
  }

  // 对话回复 — 按需求采集流程
  // 目的地
  const destinations = ['北京','上海','成都','重庆','西安','大理','丽江','厦门','三亚','广州','深圳','杭州','青岛'];
  const mentionedDest = destinations.find(d => input.includes(d));
  if (mentionedDest) {
    return `${mentionedDest}好呀！一个很棒的目的地 🎯 你是从哪里出发呢？`;
  }

  // 出发地相关
  if ((input.includes('出发') || input.includes('从哪') || input.includes('从哪里')) && (input.includes('上海') || input.includes('北京') || input.includes('成都') || input.includes('广州') || input.includes('深圳') || input.includes('杭州') || input.includes('西安') || input.includes('重庆'))) {
    const depCities = ['上海','北京','成都','广州','深圳','杭州','西安','重庆'];
    const dep = depCities.find(d => input.includes(d));
    if (dep) return `好的，从${dep}出发已记下！你大概什么时间去呢？比如几月份？📅`;
    return '好的！你大概什么时间去呢？比如几月份？📅';
  }

  // 天数
  if ((input.includes('天') && input.match(/\d+/)) || input.includes('几天') || input.includes('多久')) {
    return '好的！那这次旅行大概预算是多少呢？（比如：人均3000-5000、8000-10000等）💰';
  }

  // 预算
  if (input.includes('预算') || input.includes('钱') || input.includes('¥') || input.includes('元')) {
    return '明白了～是独自旅行、情侣出游、朋友结伴还是带家人一起去呢？👥';
  }

  // 同行人员
  const companionKeywords = ['情侣','独自','朋友','家人','一个人','两个人','闺蜜','兄弟','同事','亲子','带娃'];
  if (companionKeywords.some(k => input.includes(k))) {
    return '太棒了！你更喜欢什么类型的玩法？比如自然风光、美食探店、人文历史、购物休闲？🎯';
  }

  // 游玩偏好
  const prefKeywords = ['自然','美食','人文','购物','风景','拍照','休闲','徒步','海边','度假','历史','文化'];
  if (prefKeywords.some(k => input.includes(k))) {
    return '住宿方面有什么偏好吗？比如民宿、酒店、青旅，或者对位置有什么要求？🏨';
  }

  // 住宿偏好
  const accomKeywords = ['民宿','酒店','青旅','客栈','地铁','市中心','安静','干净'];
  if (accomKeywords.some(k => input.includes(k))) {
    return '好的！这次出行你偏向什么交通方式呢？飞机、高铁还是自驾？🚄';
  }

  // 交通偏好
  const transportKeywords = ['飞机','高铁','火车','自驾','开车','大巴','动车'];
  if (transportKeywords.some(k => input.includes(k))) {
    return '太好了，你的需求我都记下啦 ✅\n\n你之前有查过什么相关的攻略或者帖子吗？如果有发给我参考一下，我能做出更精准的推荐哦～😊';
  }

  // 通用回复（尽可能继续推进）
  if (input.includes('是') || input.includes('没错') || input.includes('好的') || input.includes('可以') ||
      input.includes('嗯') || input.includes('对')) {
    return '了解啦！能再多说说你的计划吗？比如想去哪里、玩几天之类的～😊';
  }

  return '收到！还有其他想和我分享的吗？比如想去哪里、大概玩几天？😊';
}

function mockGenerateItinerary(): string {
  return JSON.stringify({
    title: '5天4夜 成都自由行攻略',
    days: [
      {
        dayNumber: 1,
        title: '经典市区游',
        date: '第 1 天',
        slots: [
          {
            label: '上午',
            spots: [
              {
                name: '成都大熊猫繁育研究基地',
                description: '近距离观看可爱的大熊猫，建议早上前往。',
                duration: '3小时',
                transport: { mode: '地铁', duration: '40分钟' },
                tags: ['景点'],
                recommendReason: '全球最大的大熊猫繁育基地，清晨熊猫最活跃，可以近距离观察国宝的日常生活，适合亲子游。',
                ticketInfo: { type: '收费', price: '55元/人' },
              },
            ],
          },
          {
            label: '下午',
            spots: [
              {
                name: '宽窄巷子',
                description: '成都最具代表性的历史文化街区。',
                duration: '2小时',
                transport: { mode: '地铁', duration: '30分钟' },
                tags: ['美食', '文化'],
              },
            ],
          },
          {
            label: '晚上',
            spots: [
              {
                name: '锦里古街',
                description: '夜晚的锦里灯火璀璨，品尝各种成都小吃。',
                duration: '2小时',
                transport: { mode: '打车', duration: '15分钟' },
                tags: ['美食', '夜景'],
              },
            ],
          },
        ],
        tips: ['建议早点出发去熊猫基地'],
      },
    ],
    practicalInfo: {
      transport: '成都地铁网络发达，覆盖主要景点。',
      accommodation: '建议住在春熙路/太古里附近。',
      budget: { transport: 2000, hotel: 1500, food: 800, tickets: 500, other: 400 },
    },
    notices: ['成都气候湿润，建议携带雨具', '部分景点需提前预约'],
  });
}

function mockAdjustItinerary(input: string): string {
  if (input.includes('添加') || input.includes('增加')) {
    return '已为你添加了新的景点到对应行程中。';
  }
  if (input.includes('删除') || input.includes('去掉')) {
    return '已根据你的要求移除了相应景点。';
  }
  if (input.includes('时间') || input.includes('延长')) {
    return '已调整了游玩时长。';
  }
  return '攻略已根据你的反馈进行了优化。';
}