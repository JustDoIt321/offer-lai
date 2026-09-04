import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { startInterview } from '@/lib/entitlement';
import { toPublicUser } from '@/lib/db';
import { InterviewType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { publicUser, user } = await requireUser(req);
  if (!publicUser || !user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const { type, position, level, company } = await req.json();

    if (!type || !position || !level) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const result = startInterview(user, {
      type,
      position,
      level,
      company,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message, code: result.code }, { status: 403 });
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      premium: result.premium,
      remainingFree: result.remainingFree,
      user: toPublicUser({ ...user, free_credits: result.remainingFree, is_premium: result.premium ? 1 : user.is_premium }),
    });
  } catch (e) {
    console.error('start interview error', e);
    return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
  }
}