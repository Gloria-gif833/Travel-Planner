import { getDb } from '../database/connection';
import { logger } from '../utils/logger';
import crypto from 'crypto';

function uid(): string {
  return crypto.randomUUID();
}

export async function getMaterialsList(userId: string, itineraryId?: string) {
  const db = getDb();
  let sql = 'SELECT * FROM materials WHERE user_id = ?';
  const params: any[] = [userId];

  if (itineraryId) {
    sql += ' AND itinerary_id = ?';
    params.push(itineraryId);
  }

  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params) as any[];
}

export async function createTextMaterial(
  userId: string, content: string, itineraryId?: string
) {
  const db = getDb();
  const id = uid();
  db.prepare(
    'INSERT INTO materials (id, user_id, itinerary_id, type, content) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, itineraryId || null, 'text', content);
  logger.info(`文本素材创建成功: ${id}`);
  return { id, type: 'text', content, userId };
}

export async function createImageMaterial(
  userId: string, fileUrl: string, fileName: string, itineraryId?: string
) {
  const db = getDb();
  const id = uid();
  db.prepare(
    'INSERT INTO materials (id, user_id, itinerary_id, type, file_url, file_name) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, userId, itineraryId || null, 'image', fileUrl, fileName);
  logger.info(`图片素材创建成功: ${id} - ${fileName}`);
  return { id, type: 'image', fileUrl, fileName, userId };
}

export async function deleteMaterial(id: string, userId: string) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM materials WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!existing) return false;
  db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  logger.info(`素材删除成功: ${id}`);
  return true;
}