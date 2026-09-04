'use client';

import { useEffect, useState } from 'react';

interface GrantResult {
  id: string;
  email: string;
  is_premium: number;
  premium_until: number | null;
  free_credits: number;
}

interface Payment {
  id: string;
  email: string;
  amount: number;
  days: number;
  note: string | null;
  created_at: number;
}

function formatDate(ms: number | null) {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'grant' | 'records'>('grant');
  const [token, setToken] = useState('');

  // 开通表单
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(30);
  const [amount, setAmount] = useState('39');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; title: string; detail: string; user?: GrantResult } | null>(null);

  // 记录
  const [emailFilter, setEmailFilter] = useState('');
  const [records, setRecords] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  const saveToken = (v: string) => {
    setToken(v);
    localStorage.setItem('admin_token', v);
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
        body: JSON.stringify({
          adminToken: token.trim(),
          email: em,
          days: Number(days) || 30,
          amount: Number(amount) || 0,
          note: note.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, title: '开通失败', detail: data.error || '服务器返回错误，请检查密钥或邮箱是否正确。' });
      } else {
        setResult({
          ok: true,
          title: '开通成功 🎉',
          detail: `已为 ${data.user.email} 开通会员 ${Number(days) || 30} 天，并记入充值记录。`,
          user: data.user,
        });
        setEmail('');
        setNote('');
      }
    } catch {
      setResult({ ok: false, title: '网络错误', detail: '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (filter: string) => {
    if (!token.trim()) {
      setRecordsError('请先填写管理员密钥再查询');
      return;
    }
    setRecordsError('');
    setRecordsLoading(true);
    try {
      const url = new URL('/api/admin/payments', window.location.origin);
      if (filter.trim()) url.searchParams.set('email', filter.trim());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRecordsError(data.error || '查询失败');
        setRecords([]);
        setTotalCount(0);
        setTotalAmount(0);
      } else {
        setRecords(data.payments || []);
        setTotalCount(data.totalCount || 0);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch {
      setRecordsError('网络错误，请重试');
    } finally {
      setRecordsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">开通会员后台</h1>
          <p className="text-gray-500 mt-1 text-sm">开通会员 + 充值记录管理</p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-5 bg-white rounded-xl border border-gray-200 p-1.5">
          {([
            ['grant', '开通会员'],
            ['records', '充值记录'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 密钥共用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">管理员密钥</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="粘贴 ADMIN_TOKEN"
              autoComplete="off"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">已自动记住，下次打开无需重填</p>
        </div>

        {tab === 'grant' ? (
          <form onSubmit={handleGrant} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">充值金额（元）</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="39"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注（选填）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="如：微信转账单号"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm"
            >
              {loading ? '正在开通...' : '立即开通会员'}
            </button>

            {result && (
              <div
                className={`rounded-2xl border p-5 ${
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
          </form>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">按账号筛选（邮箱，可模糊）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder="留空查询全部，或输入邮箱关键词"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => loadRecords(emailFilter)}
                  disabled={recordsLoading}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {recordsLoading ? '查询中...' : '查询'}
                </button>
              </div>
            </div>

            {/* 统计 */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                <div className="text-xs text-gray-500">充值笔数（全部）</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</div>
              </div>
              <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                <div className="text-xs text-gray-500">累计金额（全部）</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">¥{totalAmount}</div>
              </div>
            </div>

            {recordsError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{recordsError}</div>
            )}

            {/* 记录列表 */}
            {records.length === 0 && !recordsLoading ? (
              <div className="text-center text-sm text-gray-400 py-8">
                暂无记录{emailFilter ? '（当前筛选下）' : ''}，开通会员后会自动记入
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {records.map((r) => (
                  <div key={r.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{r.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(r.created_at)}</div>
                      {r.note && <div className="text-xs text-gray-500 mt-0.5">备注：{r.note}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-green-600">¥{r.amount}</div>
                      <div className="text-xs text-gray-400">{r.days}天</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">此页面仅管理员可见 · 密钥勿泄露给他人</p>
      </div>
    </main>
  );
}