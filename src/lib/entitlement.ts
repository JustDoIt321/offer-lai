import { db, User } from '@/lib/db';
import { randomUUID } from 'crypto';

export function isPremium(user: User): boolean {
  if (!user.is_premium) return false;
  if (user.premium_until && Date.now() > user.premium_until) return false;
  return true;
}

export type EntitlementResult =
  | { ok: true; premium: boolean; remainingFree: number; sessionId: string }
  | { ok: false; code: 'no_login' | 'no_credits'; message: string };

// 开始一场面试：校验登录 + 会员/免费额度，并消费一次免费额度
export function startInterview(user: User, input: { type: string; position: string; level: string; company?: string }): EntitlementResult {
  if (isPremium(user)) {
    const sessionId = randomUUID();
    db.prepare(
      'INSERT INTO interviews (id, user_id, type, position, level, company, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, user.id, input.type, input.position, input.level, input.company || null, Date.now());
    return { ok: true, premium: true, remainingFree: user.free_credits, sessionId };
  }

  if (user.free_credits > 0) {
    db.prepare('UPDATE users SET free_credits = free_credits - 1 WHERE id = ?').run(user.id);
    const sessionId = randomUUID();
    db.prepare(
      'INSERT INTO interviews (id, user_id, type, position, level, company, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sessionId, user.id, input.type, input.position, input.level, input.company || null, Date.now());
    return { ok: true, premium: false, remainingFree: user.free_credits - 1, sessionId };
  }

  return { ok: false, code: 'no_credits', message: '免费体验次数已用完，请开通会员后继续' };
}