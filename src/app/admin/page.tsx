'use client';

import { useEffect, useState } from 'react';

const DOMAIN = ''; // 同源，留空即可

interface GrantResult {
  id: string;
  email: string;
  is_premium: number;
  premium_until: number | null;
  free_credits: number;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; title: string; detail: string; user?: GrantResult } | null>(null);

  // 记住密钥，下次打开不用重填
  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  const saveToken = (v: string) => {
    setToken(v);
    localStorage.setItem('admin_token', v);
  };

  const formatDate = (ms: number | null) => {
    if (!ms) return '—';
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!token.trim()) {
      setResult({ ok: false, title: '请先填写管理员密钥', detail: '密钥用于鉴权，只有拿到密钥的人才能开通会员。' });
      return;
    }
    const em = email.trim();
    if (!em) {
      setResult({ ok: false, title: '请填写用户邮箱', detail: '要开通会员的注册邮箱不能为空。' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: token.trim(), email: em, days: Number(days) || 30 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, title: '开通失败', detail: data.error || '服务器返回错误，请检查密钥或邮箱是否正确。' });
      } else {
        setResult({
          ok: true,
          title: '开通成功 🎉',
          detail: `已为 ${data.user.email} 开通会员 ${Number(days) || 30} 天。`,
          user: data.user,
        });
        setEmail('');
      }
    } catch {
      setResult({ ok: false, title: '网络错误', detail: '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">开通会员后台</h1>
          <p className="text-gray-500 mt-1 text-sm">输入用户邮箱，一键开通，界面友好、无需命令行</p>
        </div>

        <form onSubmit={handleGrant} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* 密钥 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">管理员密钥</label>
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="粘贴 ADMIN_TOKEN"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">已自动记住，下次打开无需重填</p>
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户注册邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 天数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">开通天数</label>
            <div className="flex gap-2">
              {[7, 30, 90, 365].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    days === d
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d === 365 ? '1年' : `${d}天`}
                </button>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm"
          >
            {loading ? '正在开通...' : '立即开通会员'}
          </button>
        </form>

        {/* 结果卡片 */}
        {result && (
          <div
            className={`mt-5 rounded-2xl border p-5 ${
              result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className={`font-bold text-base ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.title}
            </div>
            <div className={`text-sm mt-1 ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.detail}</div>
            {result.user && (
              <div className="text-sm mt-3 space-y-1 text-green-800">
                <div>会员状态：<b>{result.user.is_premium ? '已开通' : '未开通'}</b></div>
                <div>到期时间：<b>{formatDate(result.user.premium_until)}</b></div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          此页面仅管理员可见 · 密钥勿泄露给他人
        </p>
      </div>
    </main>
  );
}