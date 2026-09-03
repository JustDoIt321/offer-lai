'use client';

import { useState } from 'react';
import { InterviewConfig, InterviewType } from '@/lib/types';

interface Props {
  onStart: (config: InterviewConfig) => void;
}

const POSITIONS = [
  '前端工程师', '后端工程师', '全栈工程师', '算法工程师',
  '数据工程师', 'DevOps/SRE', '移动端工程师', '测试工程师',
  '产品经理', '技术经理/主管',
];

export default function InterviewSetup({ onStart }: Props) {
  const [config, setConfig] = useState<InterviewConfig>({
    type: 'tech',
    position: '前端工程师',
    level: 'mid',
    company: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  const typeOptions: { value: InterviewType; label: string; desc: string }[] = [
    { value: 'tech', label: '💻 技术面试', desc: '算法、八股文、项目经验' },
    { value: 'system-design', label: '🏗️ 系统设计', desc: '架构设计、高并发、分布式' },
    { value: 'behavioral', label: '🤝 行为面试', desc: '项目经历、团队协作、领导力' },
    { value: 'hr', label: '📋 HR 面试', desc: '职业规划、薪资期望、离职原因' },
    { value: 'english', label: '🌍 英文面试', desc: '全英文技术面试' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Offer来</h1>
          <p className="text-gray-500 mt-2">AI 模拟面试 · 真实题库 · 精准反馈</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* 面试类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择面试类型</label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfig({ ...config, type: opt.value })}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    config.type === opt.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 目标岗位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标岗位</label>
            <select
              value={config.position}
              onChange={(e) => setConfig({ ...config, position: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 级别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">经验级别</label>
            <div className="flex gap-2">
              {(['junior', 'mid', 'senior', 'staff'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfig({ ...config, level })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    config.level === level
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {level === 'junior' ? '初级' : level === 'mid' ? '中级' : level === 'senior' ? '高级' : '专家'}
                </button>
              ))}
            </div>
          </div>

          {/* 目标公司（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标公司 <span className="text-gray-400 font-normal">（选填，面试官会针对公司技术栈提问）</span>
            </label>
            <input
              type="text"
              value={config.company}
              onChange={(e) => setConfig({ ...config, company: e.target.value })}
              placeholder="例如：字节跳动、腾讯、阿里..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 开始按钮 */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            🚀 开始模拟面试
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          首次免费体验 3 次 · 之后仅 ¥39/月
        </p>
      </div>
    </div>
  );
}