import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { publicUser } = await requireUser(req);
  if (!publicUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: publicUser });
}