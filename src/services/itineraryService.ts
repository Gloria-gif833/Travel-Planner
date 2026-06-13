import apiClient from './apiClient';

/* ========================================
   攻略 CRUD — 自动携带 X-Guest-Id（apiClient 拦截器统一注入）
   ======================================== */

export interface ItineraryListItem {
  id: string;
  title: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDetail {
  id: string;
  guestId: string;
  title: string;
  data: any;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取当前访客的全部攻略列表 */
export async function fetchItineraries(page = 1, limit = 50): Promise<{
  items: ItineraryListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const raw: any = await apiClient.get('/itineraries', { params: { page, limit } });
  // raw = { success, data: { items, pagination } }
  return raw?.data ?? { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
}

/** 获取单条攻略完整数据（含 data 字段） */
export async function fetchItineraryById(id: string): Promise<ItineraryDetail | null> {
  try {
    const raw: any = await apiClient.get(`/itineraries/${id}`);
    // raw = { success, data: { id, data: {...}, ... } }
    return raw?.data ?? null;
  } catch {
    return null;
  }
}

/** 创建攻略（生成后保存） */
export async function createItinerary(data: {
  title: string;
  data: any;
  summary?: string;
}): Promise<{ id: string }> {
  const raw: any = await apiClient.post('/itineraries', data);
  // raw = { success, data: { id, ... } }
  return raw?.data ?? { id: '' };
}

/** 更新攻略（编辑后保存） */
export async function updateItinerary(
  id: string,
  data: { title?: string; data?: any; summary?: string }
): Promise<boolean> {
  try {
    await apiClient.put(`/itineraries/${id}`, data);
    return true;
  } catch {
    return false;
  }
}

/** 删除攻略 */
export async function deleteItinerary(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/itineraries/${id}`);
    return true;
  } catch {
    return false;
  }
}