import apiClient from './apiClient';
import type { Requirements } from '../types/conversation';

/* ========================================
   攻略生成 API 调用
   ======================================== */

export interface GenerateRequest {
  requirements: Record<string, string>;
  materials?: { type: 'text' | 'image'; content: string }[];
  conversationHistory?: { role: string; content: string }[];
}

export interface GenerateResponse {
  itinerary: any;
  raw?: string;
}

/**
 * 生成攻略
 */
export async function generateItinerary(
  requirements: Record<string, string> | Requirements,
  materials?: { type: 'text' | 'image'; content: string }[],
  conversationHistory?: { role: string; content: string }[]
): Promise<GenerateResponse> {
  const raw: any = await apiClient.post('/generate', {
    requirements,
    materials,
    conversationHistory,
  } as GenerateRequest);

  // apiClient 拦截器返回 response.data → { success, data }
  // 后端 /generate 返回 { success, data: { itinerary, raw } }
  // 所以 raw = { success, data: { itinerary, raw } }

  // 情况1: raw.data.itinerary (标准路径)
  if (raw?.data?.itinerary) {
    return { itinerary: raw.data.itinerary, raw: raw.data.raw };
  }
  // 情况2: raw.itinerary (拦截器已剥开一层)
  if (raw?.itinerary) {
    return { itinerary: raw.itinerary, raw: raw.raw };
  }
  // 情况3: 看控制台日志
  console.error('【generateService】API 返回格式异常:', JSON.stringify(raw).slice(0, 300));
  throw new Error('攻略生成返回数据异常');
}