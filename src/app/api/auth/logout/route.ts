import { NextRequest, NextResponse } from 'next/server';
import { getToken, destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (token) destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', '', { maxAge: 0, path: '/' });
  return res;
}