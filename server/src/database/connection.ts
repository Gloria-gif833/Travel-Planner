/* ========================================
   数据库连接 — better-sqlite3
   开发环境：SQLite
   生产环境：切换为 PostgreSQL 驱动
   ======================================== */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.resolve(__dirname, '../../prisma');
    const dbPath = path.resolve(dbDir, 'dev.db');

    // 确保目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id TEXT PRIMARY KEY,
      guest_id TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      itinerary_id TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      data TEXT NOT NULL,
      change_type TEXT,
      change_summary TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      itinerary_id TEXT REFERENCES itineraries(id),
      type TEXT NOT NULL,
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS share_links (
      id TEXT PRIMARY KEY,
      itinerary_id TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      short_code TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_itineraries_guest ON itineraries(guest_id);
    CREATE INDEX IF NOT EXISTS idx_versions_itinerary ON versions(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
    CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(short_code);
  `);
}

export function disconnectDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}