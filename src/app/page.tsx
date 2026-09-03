'use client';

import { useState } from 'react';
import { InterviewReport as IReport } from '@/lib/types';
import InterviewSetup from '@/components/InterviewSetup';
import InterviewChat from '@/components/InterviewChat';
import InterviewReport from '@/components/InterviewReport';
import { InterviewConfig } from '@/lib/types';

type Phase = 'setup' | 'interview' | 'report';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [report, setReport] = useState<IReport | null>(null);

  const handleStart = (c: InterviewConfig) => {
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

  return (
    <main>
      {phase === 'setup' && <InterviewSetup onStart={handleStart} />}
      {phase === 'interview' && config && (
        <InterviewChat config={config} onFinish={handleFinish} onBack={handleRestart} />
      )}
      {phase === 'report' && report && config && (
        <InterviewReport report={report} config={config} onRestart={handleRestart} />
      )}
    </main>
  );
}