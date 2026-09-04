import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createSession, setSessionCookie } from '@/lib/auth';
import { toPublicUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const token = createSession(user.id);
    const res = NextResponse.json({ user: toPublicUser(user) });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('login error', e);
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}