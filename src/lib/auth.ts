import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db, toPublicUser, User } from '@/lib/db';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export async function createUser(email: string, password: string): Promise<User> {
  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  const createdAt = Date.now();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, is_premium, premium_until, free_credits, created_at) VALUES (?, ?, ?, 0, NULL, 3, ?)'
  ).run(id, email.toLowerCase(), hash, createdAt);
  return (await findUserById(id))!;
}

export function createSession(userId: string): string {
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    now,
    now + SESSION_TTL_MS
  );
  return token;
}

export function destroySession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as
    | { token: string; user_id: string; expires_at: number }
    | undefined;
  if (!row) return null;
  if (Date.now() > row.expires_at) {
    destroySession(token);
    return null;
  }
  return (await findUserById(row.user_id)) || null;
}

export function getToken(req: NextRequest): string | undefined {
  const cookie = req.cookies.get('session')?.value;
  if (cookie) return cookie;
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return undefined;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
}

export type SessionResult =
  | { user: User; publicUser: ReturnType<typeof toPublicUser> }
  | { user: null; publicUser: null };

export async function requireUser(req: NextRequest): Promise<SessionResult> {
  const user = await getUserFromToken(getToken(req));
  if (!user) return { user: null, publicUser: null };
  return { user, publicUser: toPublicUser(user) };
}