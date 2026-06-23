import apiClient from './apiClient';
import type { IntentResult } from '../types/intent';
import type { ItineraryData } from '../types/itinerary';

/* ========================================
   意图提取 API 调用
   ======================================== */

export async function extractIntent(
  userRequest: string,
  itinerarySummary: string
): Promise<IntentResult> {
  try {
    const raw: any = await apiClient.post('/intent/extract', {
      request: userRequest,
      itinerarySummary,
    });

    // 响应格式：{ success, data: { intent, confidence, params, summary } }
    const data = raw?.data || raw;
    if (data?.intent) {
      return data as IntentResult;
    }
    return fallbackIntent();
  } catch {
    return fallbackIntent();
  }
}

function fallbackIntent(): IntentResult {
  return {
    intent: 'unknown',
    confidence: 0,
    params: {},
    summary: '',
  };
}

/**
 * 从攻略数据生成摘要文本（供 AI 理解参考）
 */
export function buildItinerarySummary(itinerary: ItineraryData): string {
  if (!itinerary?.days) return '无攻略数据';

  const parts: string[] = [];
  parts.push(`共 ${itinerary.days.length} 天`);

  for (const day of itinerary.days) {
    const spots: string[] = [];
    for (const slot of day.slots) {
      for (const spot of slot.spots) {
        if (spot.name) spots.push(spot.name);
      }
    }
    parts.push(`Day${day.dayNumber}(${day.title || ''}): ${spots.join('、') || '无景点'}`);
  }

  return parts.join('\n');
}