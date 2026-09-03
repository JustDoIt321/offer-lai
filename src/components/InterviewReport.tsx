'use client';

import { InterviewReport as IReport, InterviewConfig } from '@/lib/types';

interface Props {
  report: IReport;
  config: InterviewConfig;
  onRestart: () => void;
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 5) * circumference;
  const color = score >= 4 ? '#22c55e' : score >= 3 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold" style={{ color }}>{score.toFixed(1)}</div>
        <div className="text-xs text-gray-400">/ 5.0</div>
      </div>
    </div>
  );
}

export default function InterviewReport({ report, config, onRestart }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">📊 面试报告</h1>
          <p className="text-gray-500 mt-1">
            {config.position} · {config.level === 'junior' ? '初级' : config.level === 'mid' ? '中级' : config.level === 'senior' ? '高级' : '专家'}
            {config.company ? ` · 目标：${config.company}` : ''}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <h2 className="text-sm font-medium text-gray-500 mb-4">综合评分</h2>
          <ScoreRing score={report.overall_score} />
          <div className="mt-4 text-sm text-gray-600">{report.overall_feedback}</div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-green-600 mb-3">✅ 优势</h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-amber-600 mb-3">⚠️ 待提升</h3>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Q&A Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">📝 逐题分析</h2>
          <div className="space-y-4">
            {report.qa_scores.map((qa, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">问题 {i + 1}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    qa.score >= 4 ? 'bg-green-50 text-green-600' :
                    qa.score >= 3 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {qa.score}/5
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-2">{qa.question}</p>
                <div className="text-xs text-gray-500 mb-1">你的回答：</div>
                <p className="text-sm text-gray-600 mb-3">{qa.answer}</p>
                <div className="text-xs text-gray-500 mb-1">反馈：</div>
                <p className="text-sm text-gray-600 mb-1">{qa.feedback}</p>
                {qa.improvement && (
                  <>
                    <div className="text-xs text-gray-500 mb-1 mt-2">改进建议：</div>
                    <p className="text-sm text-blue-600">{qa.improvement}</p>
                  </>
                )}
                {qa.referenceAnswer && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">查看参考回答</summary>
                    <p className="text-sm text-gray-500 mt-2 p-3 bg-gray-50 rounded-lg">{qa.referenceAnswer}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">📋 总结与建议</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
          <div className="text-xs text-gray-400 mt-4">
            共 {report.total_questions} 题 · 面试时长约 {report.duration_minutes} 分钟
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            🔄 再来一次
          </button>
          <button
            onClick={() => {
              const text = `🎯 Offer来 面试报告\n\n综合评分：${report.overall_score}/5.0\n\n${report.summary}`;
              navigator.clipboard.writeText(text);
              alert('报告已复制到剪贴板！');
            }}
            className="px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            📋 复制报告
          </button>
        </div>
      </div>
    </div>
  );
}