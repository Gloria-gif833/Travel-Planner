import { getDb } from '../database/connection';
import { logger } from '../utils/logger';
import crypto from 'crypto';

function uid(): string {
  return crypto.randomUUID();
}

export async function getItinerariesList(guestId: string, page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const items = db.prepare(
    'SELECT id, title, summary, created_at, updated_at FROM itineraries WHERE guest_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(guestId, limit, offset) as any[];

  const row = db.prepare('SELECT COUNT(*) as total FROM itineraries WHERE guest_id = ?').get(guestId) as any;

  return {
    items: items.map(i => ({ ...i, createdAt: i.created_at, updatedAt: i.updated_at })),
    pagination: { page, limit, total: row.total, totalPages: Math.ceil(row.total / limit) },
  };
}

export async function getItineraryById(id: string, guestId: string) {
  const db = getDb();
  const item = db.prepare('SELECT * FROM itineraries WHERE id = ? AND guest_id = ?').get(id, guestId) as any;
  if (!item) return null;
  return { ...item, data: JSON.parse(item.data), createdAt: item.created_at, updatedAt: item.updated_at };
}

export async function createItinerary(input: { guestId: string; title: string; data: any; summary?: string }) {
  const db = getDb();
  const id = uid();
  const dataStr = JSON.stringify(input.data);

  db.prepare(
    'INSERT INTO itineraries (id, guest_id, title, data, summary) VALUES (?, ?, ?, ?, ?)'
  ).run(id, input.guestId, input.title, dataStr, input.summary || null);

  // v1 snapshot
  db.prepare(
    'INSERT INTO versions (id, itinerary_id, version_number, data, change_type, change_summary) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uid(), id, 1, dataStr, 'initial', '初始生成攻略');

  logger.info(`攻略创建成功: ${id} - ${input.title}`);
  return { id, guestId: input.guestId, title: input.title, data: input.data, summary: input.summary || null };
}

export async function updateItinerary(id: string, guestId: string, input: { title?: string; data?: any; summary?: string }) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM itineraries WHERE id = ? AND guest_id = ?').get(id, guestId) as any;
  if (!existing) return null;

  const title = input.title ?? existing.title;
  const summary = input.summary ?? existing.summary;
  const dataStr = input.data ? JSON.stringify(input.data) : existing.data;

  db.prepare(
    'UPDATE itineraries SET title = ?, data = ?, summary = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(title, dataStr, summary, id);

  // Create version snapshot
  const latest = db.prepare(
    'SELECT MAX(version_number) as max_v FROM versions WHERE itinerary_id = ?'
  ).get(id) as any;
  const nextV = (latest?.max_v ?? 0) + 1;

  db.prepare(
    'INSERT INTO versions (id, itinerary_id, version_number, data, change_type, change_summary) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uid(), id, nextV, dataStr, 'manual', '编辑了攻略内容');

  return {
    id, guestId, title, summary,
    data: input.data ? input.data : JSON.parse(existing.data),
  };
}

export async function deleteItinerary(id: string, guestId: string) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM itineraries WHERE id = ? AND guest_id = ?').get(id, guestId);
  if (!existing) return false;
  db.prepare('DELETE FROM itineraries WHERE id = ?').run(id);
  logger.info(`攻略删除成功: ${id}`);
  return true;
}

export async function getItineraryVersions(itineraryId: string, guestId: string) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM itineraries WHERE id = ? AND guest_id = ?').get(itineraryId, guestId);
  if (!existing) return null;

  return db.prepare(
    'SELECT * FROM versions WHERE itinerary_id = ? ORDER BY version_number DESC'
  ).all(itineraryId) as any[];
}

export async function createVersionSnapshot(
  itineraryId: string, guestId: string, changeType: string, changeSummary: string
) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM itineraries WHERE id = ? AND guest_id = ?').get(itineraryId, guestId) as any;
  if (!existing) return null;

  const latest = db.prepare(
    'SELECT MAX(version_number) as max_v FROM versions WHERE itinerary_id = ?'
  ).get(itineraryId) as any;
  const nextV = (latest?.max_v ?? 0) + 1;

  const id = uid();
  db.prepare(
    'INSERT INTO versions (id, itinerary_id, version_number, data, change_type, change_summary) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, itineraryId, nextV, existing.data, changeType, changeSummary);

  return { id, versionNumber: nextV, data: JSON.parse(existing.data), changeType, changeSummary };
}