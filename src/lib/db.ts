import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据目录可通过环境变量指定，便于挂载持久化硬盘
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(path.join(DATA_DIR, 'offer-lai.db'));

db.pragma('journal_mode = WAL');

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_premium INTEGER NOT NULL DEFAULT 0,
    premium_until INTEGER,
    free_credits INTEGER NOT NULL DEFAULT 3,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    position TEXT NOT NULL,
    level TEXT NOT NULL,
    company TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export interface User {
  id: string;
  email: string;
  password_hash: string;
  is_premium: number;
  premium_until: number | null;
  free_credits: number;
  created_at: number;
}

export type PublicUser = Omit<User, 'password_hash'>;

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    is_premium: u.is_premium,
    premium_until: u.premium_until,
    free_credits: u.free_credits,
    created_at: u.created_at,
  };
}