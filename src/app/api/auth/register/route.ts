import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail, createSession, setSessionCookie } from '@/lib/auth';
import { toPublicUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: '密码至少需要 6 位' }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册，请直接登录' }, { status: 409 });
    }

    const user = await createUser(email, password);
    const token = createSession(user.id);
    const res = NextResponse.json({ user: toPublicUser(user) });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('register error', e);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}