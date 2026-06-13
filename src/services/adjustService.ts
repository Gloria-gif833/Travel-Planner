import apiClient from './apiClient';

/* ========================================
   攻略调整 API 调用
   ======================================== */

export interface AdjustRequest {
  itinerary: any;
  request: string;
}

export interface AdjustResponse {
  itinerary: any;
  raw?: string;
}

/**
 * 调整攻略
 */
export async function adjustItinerary(
  currentItinerary: any,
  userRequest: string
): Promise<AdjustResponse> {
  const raw: any = await apiClient.post('/adjust', {
    itinerary: currentItinerary,
    request: userRequest,
  } as AdjustRequest);
  if (raw?.data?.itinerary) {
    return { itinerary: raw.data.itinerary };
  }
  throw new Error('攻略调整返回数据异常');
}