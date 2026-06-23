import { useCallback, useEffect } from 'react';
import { useAiAdjustContext, generateMsgId } from '../context/AiAdjustContext';
import { useItinerary } from '../context/ItineraryContext';
import { adjustItinerary } from '../services/adjustService';
import { extractIntent, buildItinerarySummary } from '../services/intentService';
import { ItineraryMutator } from './ItineraryMutator';
import { useVersionHistory } from './useVersionHistory';
import type { Message } from '../types/conversation';
import type { ItineraryData } from '../types/itinerary';

/* ========================================
   useAiAdjust Hook — AI 调整逻辑
   优先调后端 API，失败则走意图提取 + 本地执行
   ======================================== */

export function useAiAdjust() {
  const { state: adjustState, dispatch: adjustDispatch } = useAiAdjustContext();
  const { state: itineraryState, dispatch: itineraryDispatch } = useItinerary();
  const { createSnapshot } = useVersionHistory();

  const itinerary = itineraryState.current;

  /**
   * 初始化 AI 问候语
   */
  useEffect(() => {
    if (adjustState.messages.length === 0 && itinerary) {
      const greeting: Message = {
        id: generateMsgId(),
        role: 'ai',
        text: '你对这份攻略满意吗？有什么需要修改的地方可以发送给我哦~ 💬\n\n比如：\n• "第二天和第四天交换一下"\n• "把宽窄巷子挪到第三天"\n• "删除第一天的锦里"\n• "把第三天的游玩时长改成2小时"',
        timestamp: Date.now(),
      };
      adjustDispatch({ type: 'ADD_MESSAGE', payload: greeting });
    }
  }, []);

  /**
   * 发送调整消息
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !itinerary || adjustState.isProcessing) return;

      // 用户消息
      const userMsg: Message = {
        id: generateMsgId(),
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };
      adjustDispatch({ type: 'ADD_MESSAGE', payload: userMsg });
      adjustDispatch({ type: 'SET_PROCESSING', payload: true });

      try {
        // 策略1: 尝试调用后端完整调整 API
        const result = await adjustItinerary(itinerary, text.trim());

        if (result.itinerary) {
          const enriched = {
            ...(result.itinerary as ItineraryData),
            metadata: itinerary.metadata,
          };
          itineraryDispatch({ type: 'SET_ITINERARY', payload: enriched });
          createSnapshot('ai_adjust', `AI 整体调整: ${text.slice(0, 30)}`);

          const aiMsg: Message = {
            id: generateMsgId(),
            role: 'ai',
            text: '✅ 已根据你的反馈调整了攻略内容，请查看左侧更新 👀',
            timestamp: Date.now(),
          };
          adjustDispatch({ type: 'ADD_MESSAGE', payload: aiMsg });
          adjustDispatch({ type: 'SET_PROCESSING', payload: false });
          return;
        }
      } catch {
        // 后端 API 不可用，继续下一步
      }

      try {
        // 策略2: 意图提取 + 本地执行
        const summary = buildItinerarySummary(itinerary);
        const instruction = await extractIntent(text.trim(), summary);

        if (instruction.intent === 'unknown' || (instruction.confidence ?? 0) < 0.5) {
          const failMsg: Message = {
            id: generateMsgId(),
            role: 'ai',
            text: '😅 抱歉，我没能理解你的调整需求，可以换个说法试试吗？\n\n**支持的调整方式：**\n• 交换天数："第二天和第四天换一下"\n• 移动景点："把宽窄巷子挪到第三天"\n• 删除景点："删除第一天的锦里"\n• 修改信息："把宽窄巷子的时长改成2小时"\n\n**💡 提示：** 如果你需要调整多城市的**游玩顺序**，建议回到"⚡ 快速填写"页，在目的地标签上用 ▲▼ 调整顺序后重新生成攻略，AI 会按你指定的顺序规划行程~',
            timestamp: Date.now(),
          };
          adjustDispatch({ type: 'ADD_MESSAGE', payload: failMsg });
          adjustDispatch({ type: 'SET_PROCESSING', payload: false });
          return;
        }

        // 执行数据操作
        const mutationResult = ItineraryMutator.apply(instruction, itinerary);

        if (mutationResult.success) {
          itineraryDispatch({
            type: 'SET_ITINERARY',
            payload: mutationResult.itinerary,
          });
          createSnapshot('ai_adjust', instruction.summary || text.slice(0, 30));

          const successMsg: Message = {
            id: generateMsgId(),
            role: 'ai',
            text: `✅ ${mutationResult.message}，请查看左侧更新 👀`,
            timestamp: Date.now(),
          };
          adjustDispatch({ type: 'ADD_MESSAGE', payload: successMsg });
        } else {
          const failMsg: Message = {
            id: generateMsgId(),
            role: 'ai',
            text: `😅 ${mutationResult.message}，请换个说法试试~`,
            timestamp: Date.now(),
          };
          adjustDispatch({ type: 'ADD_MESSAGE', payload: failMsg });
        }
      } catch (err) {
        console.error('【AI 调整失败】', err);
        const errorMsg: Message = {
          id: generateMsgId(),
          role: 'ai',
          text: '😅 调整过程出现错误，请稍后重试~',
          timestamp: Date.now(),
        };
        adjustDispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
      } finally {
        adjustDispatch({ type: 'SET_PROCESSING', payload: false });
      }
    },
    [itinerary, adjustState.isProcessing, adjustDispatch, itineraryDispatch, createSnapshot]
  );

  return {
    messages: adjustState.messages,
    isProcessing: adjustState.isProcessing,
    sendMessage,
  };
}