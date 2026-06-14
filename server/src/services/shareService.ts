import { getDb } from '../database/connection';
import { logger } from '../utils/logger';
import crypto from 'crypto';

function uid(): string {
  return crypto.randomUUID();
}

const BASE_URL = process.env.SHARE_BASE_URL || 'https://travelplanner-gloria.netlify.app/s/';

/**
 * 生成 8 位随机短码
 */
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 生成唯一短码（重试直到不冲突）
 */
function generateUniqueCode(): string {
  const db = getDb();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateShortCode();
    const existing = db.prepare('SELECT id FROM share_links WHERE short_code = ?').get(code);
    if (!existing) return code;
  }
  // 极低概率冲突，加时间戳后缀
  return generateShortCode() + Date.now().toString(36).slice(-4);
}

/**
 * 计算过期时间（7 天后）
 */
function calculateExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

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
export async function createShareLink(
  guestId: string,
  itineraryId: string
): Promise<ShareLinkResult> {
  const db = getDb();

  // 验证攻略归属
  const itinerary = db.prepare(
    'SELECT id FROM itineraries WHERE id = ? AND guest_id = ?'
  ).get(itineraryId, guestId);
  if (!itinerary) {
    throw new Error('攻略不存在');
  }

  const id = uid();
  const shortCode = generateUniqueCode();
  const expiresAt = calculateExpiresAt();

  db.prepare(
    'INSERT INTO share_links (id, itinerary_id, short_code, expires_at) VALUES (?, ?, ?, ?)'
  ).run(id, itineraryId, shortCode, expiresAt);

  logger.info(`分享链接生成成功: ${shortCode} → ${itineraryId}`);

  return {
    id,
    shortCode,
    url: `${BASE_URL}${shortCode}`,
    itineraryId,
    expiresAt,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 通过短码获取分享攻略（公开接口）
 */
export async function getSharedItinerary(shortCode: string) {
  const db = getDb();

  const link = db.prepare(
    'SELECT * FROM share_links WHERE short_code = ?'
  ).get(shortCode) as any;

  if (!link) return null;

  // 检查过期
  if (new Date(link.expires_at) < new Date()) {
    return { expired: true };
  }

  const itinerary = db.prepare(
    'SELECT id, title, data, summary, created_at FROM itineraries WHERE id = ?'
  ).get(link.itinerary_id) as any;

  if (!itinerary) return null;

  return {
    expired: false,
    shortCode: link.short_code,
    expiresAt: link.expires_at,
    itinerary: {
      id: itinerary.id,
      title: itinerary.title,
      data: JSON.parse(itinerary.data),
      summary: itinerary.summary,
      createdAt: itinerary.created_at,
    },
  };
}

/**
 * 获取用户的分享链接列表
 */
export async function getUserShareLinks(guestId: string) {
  const db = getDb();

  const links = db.prepare(`
    SELECT sl.*, i.title as itinerary_title
    FROM share_links sl
    JOIN itineraries i ON i.id = sl.itinerary_id
    WHERE i.guest_id = ?
    ORDER BY sl.created_at DESC
  `).all(guestId) as any[];

  return links.map((l: any) => ({
    id: l.id,
    shortCode: l.short_code,
    url: `${BASE_URL}${l.short_code}`,
    itineraryId: l.itinerary_id,
    itineraryTitle: l.itinerary_title,
    expiresAt: l.expires_at,
    isExpired: new Date(l.expires_at) < new Date(),
    createdAt: l.created_at,
  }));
}

/**
 * 删除分享链接
 */
export async function deleteShareLink(id: string, guestId: string) {
  const db = getDb();

  const link = db.prepare(`
    SELECT sl.id FROM share_links sl
    JOIN itineraries i ON i.id = sl.itinerary_id
    WHERE sl.id = ? AND i.guest_id = ?
  `).get(id, guestId) as any;

  if (!link) return false;

  db.prepare('DELETE FROM share_links WHERE id = ?').run(id);
  logger.info(`分享链接删除成功: ${id}`);
  return true;
}