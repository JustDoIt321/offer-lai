'use client';

import { useState } from 'react';
import { login, register, PublicUser } from '@/lib/client';

interface Props {
  open: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
  onSuccess: (user: PublicUser) => void;
  message?: string;
}

export default function AuthModal({ open, mode, onClose, onSwitchMode, onSuccess, message }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = mode === 'login' ? login : register;
    const result = await fn(email.trim(), password);
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onSuccess(result.user);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {message && <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              minLength={6}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm"
          >
            {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册并免费体验'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? (
            <>还没有账号？<button className="text-blue-600" onClick={onSwitchMode}>去注册</button></>
          ) : (
            <>已有账号？<button className="text-blue-600" onClick={onSwitchMode}>去登录</button></>
          )}
        </p>
      </div>
    </div>
  );
}