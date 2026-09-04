import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicUser } from '@/lib/db';
import { findUserByEmail } from '@/lib/auth';
import { randomUUID } from 'crypto';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // 管理端鉴权：请求头或 body 中携带 ADMIN_TOKEN
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: '服务端未配置 ADMIN_TOKEN' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const body = await req.json().catch(() => ({}));
  const suppliedToken = bearer || body.adminToken;

  if (suppliedToken !== adminToken) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { email, days, amount, note } = body;
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: '缺少 email' }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const durationDays = Number(days) > 0 ? Number(days) : 30;
  const now = Date.now();
  const base = user.premium_until && user.premium_until > now ? user.premium_until : now;
  const newUntil = base + durationDays * DAY_MS;

  db.prepare('UPDATE users SET is_premium = 1, premium_until = ?, free_credits = 0 WHERE id = ?').run(
    newUntil,
    user.id
  );

  // 录入充值记录
  db.prepare(
    'INSERT INTO payments (id, user_id, email, amount, days, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    randomUUID(),
    user.id,
    email.toLowerCase(),
    Number(amount) >= 0 ? Number(amount) : 0,
    durationDays,
    typeof note === 'string' && note.trim() ? note.trim() : null,
    now
  );

  const updated = await findUserByEmail(email);
  return NextResponse.json({ user: toPublicUser(updated!) });
}