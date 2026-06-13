import { useCallback, useEffect } from 'react';
import { useAiAdjustContext, generateMsgId } from '../context/AiAdjustContext';
import { useItinerary } from '../context/ItineraryContext';
import { adjustItinerary } from '../services/adjustService';
import type { Message } from '../types/conversation';
import type { ItineraryData } from '../types/itinerary';

/* ========================================
   useAiAdjust Hook — AI 调整逻辑（API + Mock 降级）
   ======================================== */

export function useAiAdjust() {
  const { state: adjustState, dispatch: adjustDispatch } = useAiAdjustContext();
  const { state: itineraryState, dispatch: itineraryDispatch } = useItinerary();

  const itinerary = itineraryState.current;

  /**
   * 初始化 AI 问候语
   */
  useEffect(() => {
    if (adjustState.messages.length === 0 && itinerary) {
      const greeting: Message = {
        id: generateMsgId(),
        role: 'ai',
        text: '你对这份攻略满意吗？有什么需要修改的地方可以发送给我哦~ 💬\n\n比如：\n• "第三天下午想去博物馆"\n• "把宽窄巷子的时间延长"\n• "删除第一天的锦里"',
        timestamp: Date.now(),
      };
      adjustDispatch({ type: 'ADD_MESSAGE', payload: greeting });
    }
  }, []);

  /**
   * 发送调整消息 — 先尝试 API，失败则 Mock
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
        // 尝试调用真实 API
        const result = await adjustItinerary(itinerary, text.trim());

        if (result.itinerary) {
          // 保留原有 metadata，AI 调整不会改变用户需求元数据
          const enriched = {
            ...(result.itinerary as ItineraryData),
            metadata: itinerary.metadata,
          };
          itineraryDispatch({
            type: 'SET_ITINERARY',
            payload: enriched,
          });
        }

        const aiMsg: Message = {
          id: generateMsgId(),
          role: 'ai',
          text: '已根据你的反馈调整了攻略内容，请查看左侧更新 👀',
          timestamp: Date.now(),
        };
        adjustDispatch({ type: 'ADD_MESSAGE', payload: aiMsg });
      } catch {
        // API 不可用，走 Mock 逻辑
        const mockResponse = mockAdjust(text, itinerary);
        const { reply, adjustments } = mockResponse;

        // 应用调整
        for (const adj of adjustments) {
          const { dayIndex, slotIndex, action, data, spotIndex } = adj;
          const day = itinerary.days[dayIndex];
          if (!day) continue;
          const slot = day.slots[slotIndex];
          if (!slot) continue;

          switch (action) {
            case 'add': {
              if (data) {
                itineraryDispatch({
                  type: 'ADD_SPOT',
                  payload: { dayIndex, slotIndex, spot: data as any, insertAfter: slot.spots.length - 1 },
                });
              }
              break;
            }
            case 'delete': {
              if (spotIndex !== undefined) {
                itineraryDispatch({
                  type: 'DELETE_SPOT',
                  payload: { dayIndex, slotIndex, spotIndex },
                });
              }
              break;
            }
            case 'modify': {
              if (data?.name) {
                const idx = slot.spots.findIndex((s) => s.name === data.name);
                if (idx >= 0) {
                  itineraryDispatch({
                    type: 'UPDATE_SPOT',
                    payload: { dayIndex, slotIndex, spotIndex: idx, spot: { ...slot.spots[idx], ...data } as any },
                  });
                }
              } else if (data && slot.spots.length > 0) {
                const lastIdx = slot.spots.length - 1;
                itineraryDispatch({
                  type: 'UPDATE_SPOT',
                  payload: { dayIndex, slotIndex, spotIndex: lastIdx, spot: { ...slot.spots[lastIdx], ...data } as any },
                });
              }
              break;
            }
          }
        }

        const aiMsg: Message = {
          id: generateMsgId(),
          role: 'ai',
          text: reply,
          timestamp: Date.now(),
        };
        adjustDispatch({ type: 'ADD_MESSAGE', payload: aiMsg });
      } finally {
        adjustDispatch({ type: 'SET_PROCESSING', payload: false });
      }
    },
    [itinerary, adjustState.isProcessing, adjustDispatch, itineraryDispatch]
  );

  return {
    messages: adjustState.messages,
    isProcessing: adjustState.isProcessing,
    sendMessage,
  };
}

/**
 * Mock 调整逻辑（API 不可用时降级）
 */
function mockAdjust(input: string, itinerary: any) {
  const inputLower = input.toLowerCase();

  let dayIndex = 0;
  const dayPatterns = [
    { keywords: ['第一天', 'day 1', 'day1'], idx: 0 },
    { keywords: ['第二天', 'day 2', 'day2'], idx: 1 },
    { keywords: ['第三天', 'day 3', 'day3'], idx: 2 },
    { keywords: ['第四天', 'day 4', 'day4'], idx: 3 },
    { keywords: ['第五天', 'day 5', 'day5'], idx: 4 },
  ];
  for (const p of dayPatterns) {
    if (p.keywords.some((k) => inputLower.includes(k))) {
      dayIndex = p.idx;
      break;
    }
  }

  let slotKeyword = '';
  if (inputLower.includes('上午') || inputLower.includes('早上')) slotKeyword = '上午';
  else if (inputLower.includes('下午')) slotKeyword = '下午';
  else if (inputLower.includes('晚上') || inputLower.includes('夜')) slotKeyword = '晚上';

  const slotIndex = ['上午', '下午', '晚上'].indexOf(slotKeyword);
  const targetSlotIdx = slotIndex >= 0 ? slotIndex : 1;

  const adjustments: any[] = [];

  if (inputLower.includes('添加') || inputLower.includes('增加') || inputLower.includes('想去')) {
    let newName = '新景点';
    for (const prefix of ['添加', '增加', '想去']) {
      if (inputLower.includes(prefix)) {
        const idx = inputLower.indexOf(prefix) + prefix.length;
        const rest = inputLower.slice(idx).trim();
        const match = rest.match(/^(.+?)(?:的|景点|地方|。|$)/);
        if (match && match[1].length > 0 && match[1].length < 15) newName = match[1];
        break;
      }
    }
    adjustments.push({
      dayIndex,
      slotIndex: targetSlotIdx,
      action: 'add',
      data: {
        name: newName,
        description: `根据你的需求添加的景点「${newName}」，是当地非常受欢迎的地方。`,
        duration: '2小时',
        transport: { mode: '步行', duration: '10分钟' },
        tags: ['推荐'],
      },
    });
    return { reply: `好的！已为你将「${newName}」添加到行程中 👀`, adjustments };
  }

  if (inputLower.includes('删除') || inputLower.includes('去掉')) {
    const spotNames = itinerary?.days[dayIndex]?.slots.flatMap((s: any) => s.spots).map((s: any) => s.name) ?? [];
    for (const name of spotNames) {
      if (inputLower.includes(name)) {
        const spots = itinerary.days[dayIndex].slots.flatMap((s: any) => s.spots);
        const spotIdx = spots.findIndex((s: any) => s.name === name);
        adjustments.push({ dayIndex, slotIndex: targetSlotIdx, spotIndex: spotIdx, action: 'delete' });
        return { reply: `已移除「${name}」🗑️`, adjustments };
      }
    }
  }

  adjustments.push({ dayIndex, slotIndex: targetSlotIdx, action: 'modify', data: { description: '已根据你的需求优化了游玩建议。' } });
  return { reply: '好的，已根据你的反馈优化了攻略内容 ✅', adjustments };
}