import { NextRequest, NextResponse } from 'next/server';
import { db, Payment } from '@/lib/db';

export async function GET(req: NextRequest) {
  // 管理端鉴权
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: '服务端未配置 ADMIN_TOKEN' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  const suppliedToken = bearer || queryToken;

  if (suppliedToken !== adminToken) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const email = url.searchParams.get('email')?.trim().toLowerCase();

  let rows: Payment[];
  if (email) {
    rows = db
      .prepare('SELECT * FROM payments WHERE email LIKE ? ORDER BY created_at DESC')
      .all(`%${email}%`) as Payment[];
  } else {
    rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all() as Payment[];
  }

  // 统计
  const total = db
    .prepare('SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as s FROM payments')
    .get() as { c: number; s: number };

  return NextResponse.json({ payments: rows, totalCount: total.c, totalAmount: total.s });
}