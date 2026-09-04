'use client';

export interface PublicUser {
  id: string;
  email: string;
  is_premium: number;
  premium_until: number | null;
  free_credits: number;
  created_at: number;
}

export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ user: PublicUser } | { error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });
  return res.json();
}

export async function register(email: string, password: string): Promise<{ user: PublicUser } | { error: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}

export function isPremiumUser(u: PublicUser): boolean {
  if (!u.is_premium) return false;
  if (u.premium_until && Date.now() > u.premium_until) return false;
  return true;
}

export async function startInterview(config: {
  type: string;
  position: string;
  level: string;
  company?: string;
}): Promise<{ ok: boolean; error?: string; code?: string; premium?: boolean; remainingFree?: number }> {
  const res = await fetch('/api/interview/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || '无法开始面试', code: data.code };
  }
  return { ok: true, premium: data.premium, remainingFree: data.remainingFree };
}