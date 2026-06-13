import apiClient from './apiClient';

/* ========================================
   分享链接服务（对接后端 API）
   ======================================== */

export interface ShareLinkResult {
  id: string;
  shortCode: string;
  url: string;
  itineraryId: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * 生成分享链接
 */
export async function generateShareLink(itineraryId?: string): Promise<ShareLinkResult> {
  // 如果没有 itineraryId，先获取当前攻略
  let targetId = itineraryId;
  if (!targetId) {
    try {
      const data: any = await apiClient.get('/itineraries?limit=1');
      const items = data?.data?.items ?? [];
      if (items.length > 0) targetId = items[0].id;
    } catch { /* fallback */ }
  }

  if (!targetId) {
    throw new Error('没有可分享的攻略，请先生成攻略');
  }

  const data: any = await apiClient.post('/share', { itineraryId: targetId });
  return data.data as ShareLinkResult;
}

/**
 * 格式化过期时间
 */
export function formatExpiryDate(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}