'use client';

import { useEffect, useState } from 'react';
import { InterviewReport as IReport } from '@/lib/types';
import InterviewSetup from '@/components/InterviewSetup';
import InterviewChat from '@/components/InterviewChat';
import InterviewReport from '@/components/InterviewReport';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import { InterviewConfig } from '@/lib/types';
import { PublicUser, fetchMe, logout, startInterview, isPremiumUser } from '@/lib/client';

type Phase = 'setup' | 'interview' | 'report';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [report, setReport] = useState<IReport | null>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const premium = user ? isPremiumUser(user) : false;

  const handleStart = async (c: InterviewConfig) => {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    setStarting(true);
    const result = await startInterview(c);
    setStarting(false);

    if (!result.ok) {
      if (result.code === 'no_credits') {
        setUpgradeOpen(true);
      } else if (result.error === '请先登录') {
        setAuthOpen(true);
      } else {
        alert(result.error || '无法开始面试');
      }
      return;
    }

    setUser((prev) =>
      prev
        ? { ...prev, is_premium: result.premium ? 1 : prev.is_premium, free_credits: result.remainingFree ?? prev.free_credits }
        : prev
    );
    setConfig(c);
    setPhase('interview');
  };

  const handleFinish = (r: IReport) => {
    setReport(r);
    setPhase('report');
  };

  const handleRestart = () => {
    setPhase('setup');
    setConfig(null);
    setReport(null);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button className="flex items-center gap-2" onClick={handleRestart}>
            <span className="font-bold text-gray-900">🎯 Offer来</span>
            <span className="hidden sm:inline text-xs text-gray-500">AI 模拟面试 · 真实题库 · 精准反馈</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {premium ? (
                <span className="text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full">👑 会员</span>
              ) : (
                <span className="text-xs text-gray-600">
                  <button onClick={() => setUpgradeOpen(true)} className="text-blue-600 font-medium">免费剩 {user.free_credits} 次</button>
                </span>
              )}
              <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      {phase === 'setup' && (
        <InterviewSetup
          onStart={handleStart}
          starting={starting}
          user={user}
          premium={premium}
          onLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      )}
      {phase === 'interview' && config && (
        <InterviewChat config={config} onFinish={handleFinish} onBack={handleRestart} />
      )}
      {phase === 'report' && report && config && (
        <InterviewReport report={report} config={config} onRestart={handleRestart} />
      )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        onSuccess={(u) => { setUser(u); setAuthOpen(false); }}
        message={!user ? '首次注册即可获得 3 次免费体验' : undefined}
      />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} userEmail={user?.email} />
    </main>
  );
}