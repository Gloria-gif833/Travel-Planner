/* ========================================
   useAiAdjust Hook — AI 调整逻辑
   只走意图提取 + 本地执行，不调用完整重生成
   ======================================== */

import { useCallback, useEffect } from 'react';
import { useAiAdjustContext, generateMsgId } from '../context/AiAdjustContext';
import { useItinerary } from '../context/ItineraryContext';
import { extractIntent, buildItinerarySummary } from '../services/intentService';
import { ItineraryMutator } from './ItineraryMutator';
import { useVersionHistory } from './useVersionHistory';
import type { Message } from '../types/conversation';
import type { ItineraryData } from '../types/itinerary';

/**
 * 校验攻略数据是否有效（有真实景点，不是"景点待定"空壳）
 */
function isValidItinerary(data: any): boolean {
  if (!data?.days?.length) return false;
  return data.days.some((d: any) =>
    d.slots?.some((s: any) =>
      s.spots?.some((sp: any) =>
        sp.name && sp.name !== '景点待定' && sp.name !== '未命名景点'
      )
    )
  );
}

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
   * 只走意图提取 + 本地执行，确保攻略不被 AI 返回的垃圾数据覆盖
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
        // 意图提取 + 本地执行（唯一路径，不调完整重生成 API）
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
          // 校验修改后的数据是否有效
          if (!isValidItinerary(mutationResult.itinerary)) {
            const errMsg: Message = {
              id: generateMsgId(),
              role: 'ai',
              text: '😅 调整过程中遇到了问题，攻略数据已自动恢复，请换个说法试试~',
              timestamp: Date.now(),
            };
            adjustDispatch({ type: 'ADD_MESSAGE', payload: errMsg });
            adjustDispatch({ type: 'SET_PROCESSING', payload: false });
            return;
          }

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