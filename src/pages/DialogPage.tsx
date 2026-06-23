import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConversation } from '../context/ConversationContext';
import { useItinerary } from '../context/ItineraryContext';
import { useChat } from '../hooks/useChat';
import { generateItinerary } from '../services/generateService';
import { createItinerary as saveItinerary } from '../services/itineraryService';
import { enrichItinerary } from '../utils/enrichItinerary';
import ChatArea from '../components/ChatArea/ChatArea';
import QuickReply from '../components/QuickReply/QuickReply';
import RequirementPanel from '../components/RequirementPanel/RequirementPanel';
import MaterialPanel from '../components/MaterialPanel/MaterialPanel';
import styles from '../styles/dialog.module.css';

export default function DialogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch: convDispatch } = useConversation();
  const { dispatch: itineraryDispatch } = useItinerary();
  const {
    messages,
    requirements,
    completedRequirements,
    progress,
    canGenerate,
    showQuickReply,
    quickReplyMode,
    initConversation,
    sendMessage,
    handleQuickReply,
    requestConfirmGenerate,
    resetConversation,
  } = useChat();
  const [generating, setGenerating] = useState(false);
  const generationTriggered = useRef(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetTooltip, setShowResetTooltip] = useState(false);

  // 初始化对话
  useEffect(() => {
    initConversation();
  }, [initConversation]);

  /**
   * 导航到攻略页（提前设置加载状态，防止显示旧数据）
   */
  const navigateToItinerary = () => {
    itineraryDispatch({ type: 'SET_LOADING', payload: true });
    navigate('/itinerary');
  };

  /**
   * 从素材页返回后：AI总结素材，展示需求概要，然后确认是否生成
   * 不在此处自动生成攻略，统一走 handleQuickReply 的 confirmGenerate 流程
   */
  useEffect(() => {
    const fromUpload = searchParams.get('fromUpload') === 'true';
    if (
      fromUpload &&
      state.materials.length > 0 &&
      state.messages.length > 0 &&
      !generationTriggered.current &&
      !generating
    ) {
      generationTriggered.current = true;

      // 1. 构建素材描述
      const textMaterials = state.materials.filter(m => m.type === 'text');
      const imageMaterials = state.materials.filter(m => m.type === 'image');
      const parts: string[] = [];
      if (textMaterials.length > 0) parts.push(`${textMaterials.length}段文本`);
      if (imageMaterials.length > 0) parts.push(`${imageMaterials.length}张图片`);
      const materialDesc = parts.join(' + ') || '素材';

      // 2. 构建需求概要
      const reqItems: string[] = [];
      if (requirements.destination) reqItems.push(`📍 目的地：${requirements.destination}`);
      if (requirements.departure) reqItems.push(`🚗 出发地：${requirements.departure}`);
      if (requirements.travelDate) reqItems.push(`📅 时间：${requirements.travelDate}`);
      if (requirements.days) reqItems.push(`⏱ 天数：${requirements.days}`);
      if (requirements.budget) reqItems.push(`💰 预算：${requirements.budget}`);
      if (requirements.companions) reqItems.push(`👥 同行：${requirements.companions}`);
      if (requirements.preferences) reqItems.push(`🎯 偏好：${requirements.preferences}`);
      if (requirements.accommodation) reqItems.push(`🏨 住宿：${requirements.accommodation}`);
      if (requirements.transport) reqItems.push(`🚄 交通：${requirements.transport}`);

      const summaryText = `太好了，资料都收到了！我来为你梳理一下 🌟\n\n` +
        `**📋 已收集需求：**\n${reqItems.join('\n')}\n\n` +
        `**📎 你提供的参考素材：**${materialDesc}\n\n` +
        `是否为你生成专属攻略？`;

      // 3. 发送AI总结消息
      convDispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: `msg_${Date.now()}_summary`, role: 'ai',
          text: summaryText, timestamp: Date.now(),
        },
      });

      // 4. 触发确认按钮（【是，生成攻略】/【先不用了】）
      setTimeout(() => requestConfirmGenerate(), 600);
    }
  }, [searchParams, state.materials, state.messages, requirements, generating, convDispatch, requestConfirmGenerate]);

  // 素材/确认询问阶段显示快捷回复，禁用输入框
  const isAiThinking =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user' &&
    !showQuickReply;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    // 设置加载状态，侧边栏跳转时显示生成中
    itineraryDispatch({ type: 'SET_LOADING', payload: true });
    try {
      const mats = state.materials.length > 0
        ? state.materials.map(m => ({ type: m.type as 'text' | 'image', content: m.content }))
        : undefined;
      const convHistory = state.messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));
      const result = await generateItinerary(requirements, mats, convHistory);
      if (result?.itinerary) {
        const enriched = enrichItinerary(result.itinerary, requirements);
        saveItinerary({ title: enriched.title, data: enriched, summary: '' })
          .then(saved => { if (saved?.id) enriched.id = saved.id; })
          .catch(() => {});
        itineraryDispatch({ type: 'SET_ITINERARY', payload: enriched });
        itineraryDispatch({ type: 'ADD_TO_LIST', payload: enriched });
        setGenerating(false);
        navigateToItinerary();
        return;
      }
    } catch (e) {
      console.error('【生成攻略失败】', e);
    }
    setGenerating(false);
    navigateToItinerary();
  };

  /**
   * 重置对话 — 清空所有消息和需求，重新开始
   */
  const handleReset = () => {
    resetConversation();
    setShowResetConfirm(false);
    generationTriggered.current = false;
    // 重置后重新初始化
    setTimeout(() => {
      initConversation();
    }, 50);
  };

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/requirement-choice')}>
          ← 返回上一页
        </button>
        <h2 className={styles.pageTitle}>📋 需求搜集</h2>

        {/* 重置按钮 */}
        <div
          className={styles.resetWrap}
          onMouseEnter={() => setShowResetTooltip(true)}
          onMouseLeave={() => setShowResetTooltip(false)}
        >
          <button
            className={styles.resetButton}
            onClick={() => setShowResetConfirm(true)}
            title="重置对话，重新制定攻略"
          >
            ↺ 重置
          </button>
          {showResetTooltip && (
            <div className={styles.resetTooltip}>
              💡 点击可重新制定全新攻略哦~
            </div>
          )}
        </div>
      </div>

      {/* 主体布局 */}
      <div className={styles.body}>
        {/* 左侧：对话区 */}
        <div className={styles.chatSection}>
          <ChatArea
            messages={messages}
            onSend={sendMessage}
            disabled={isAiThinking || showQuickReply || generating}
            placeholder={
              generating
                ? '攻略生成中...'
                : showQuickReply
                ? '请使用下方快捷回复'
                : isAiThinking
                ? '等待AI回复...'
                : '输入你的回答...'
            }
          />
          {showQuickReply && (
            <QuickReply mode={quickReplyMode} onReply={handleQuickReply} />
          )}
        </div>

        {/* 右侧：面板区 */}
        <div className={styles.sidePanel}>
          <RequirementPanel
            requirements={requirements}
            completedKeys={completedRequirements}
            progress={progress}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
          />
          <MaterialPanel materials={state.materials} />
        </div>
      </div>

      {/* 重置确认弹窗 */}
      {showResetConfirm && (
        <div className={styles.resetOverlay} onClick={() => setShowResetConfirm(false)}>
          <div className={styles.resetModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.resetModalTitle}>🔄 重新制定攻略？</h3>
            <p className={styles.resetModalDesc}>
              当前对话内容将会被清除，你可以重新开始一轮全新的需求采集。
            </p>
            <div className={styles.resetModalActions}>
              <button
                className={styles.resetModalCancel}
                onClick={() => setShowResetConfirm(false)}
              >
                取消
              </button>
              <button
                className={styles.resetModalConfirm}
                onClick={handleReset}
              >
                ✓ 确定，重新开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}