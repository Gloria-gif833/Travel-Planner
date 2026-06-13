import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/connection';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'travel-planner-dev-secret-key';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;
let userIdCounter = 0;

export async function registerUser(
  email: string, password: string, name: string
): Promise<{ id: string; email: string; name: string; token: string }> {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) throw new Error('该邮箱已被注册');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  userIdCounter += 1;
  const id = `user_${Date.now()}_${userIdCounter}`;

  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
    id, email.toLowerCase(), passwordHash, name || email.split('@')[0]
  );

  const token = generateToken(id);
  logger.info(`用户注册成功: ${email}`);
  return { id, email: email.toLowerCase(), name: name || email.split('@')[0], token };
}

export async function loginUser(
  email: string, password: string
): Promise<{ id: string; email: string; name: string; token: string }> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) throw new Error('邮箱或密码错误');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('邮箱或密码错误');

  const token = generateToken(user.id);
  return { id: user.id, email: user.email, name: user.name || '', token };
}

export async function getUserById(userId: string): Promise<{ id: string; email: string; name: string } | null> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(userId) as any;
  return user || null;
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}