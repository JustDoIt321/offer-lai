'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, InterviewConfig, InterviewReport } from '@/lib/types';

interface Props {
  config: InterviewConfig;
  onFinish: (report: InterviewReport) => void;
  onBack: () => void;
}

export default function InterviewChat({ config, onFinish, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `你好！我是你的 AI 面试官，今天我们来模拟一场 **${config.position}** 的${config.type === 'tech' ? '技术' : config.type === 'system-design' ? '系统设计' : config.type === 'behavioral' ? '行为' : config.type === 'hr' ? 'HR' : '英文'}面试。\n\n面试过程中我会根据你的回答进行提问和评分，请尽可能贴近真实面试场景回答。准备好了吗？那我们开始吧！`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          config,
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (ttsEnabled) speak(data.reply);

        // 检查是否结束面试
        if (data.reply.includes('面试到此结束') || data.reply.includes('总结报告')) {
          setIsEnding(true);
        }
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，网络出了点问题，请重新回答一次。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  // 语音播报：让 AI 面试官"开口说话"
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = text
      .replace(/\*\*/g, '')
      .replace(/【[\s\S]*?】/g, '')
      .replace(/[#*`>\n]/g, ' ');
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-CN';
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch {
      // 忽略语音合成异常
    }
  };

  // 语音纠错：识别后先交给大模型纠正专业术语，再发送
  const correctAndSend = async (raw: string) => {
    setIsLoading(true);
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'correct', raw, context: lastAssistant, config }),
      });
      const data = await res.json().catch(() => ({}));
      const corrected = (data.corrected && data.corrected.trim()) || raw;
      await sendMessage(corrected);
    } catch {
      await sendMessage(raw);
    }
  };

  // 语音输入：说话自动转文字并发送
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('当前浏览器不支持语音识别，请改用 Chrome、Edge 或 Safari 浏览器。');
      return;
    }
    if (isLoading || isEnding) return;

    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (!transcript) return;
      // 去掉口语填充词和无意义标点后，判断是否有实际内容
      const cleaned = transcript
        .replace(/[嗯啊呃哦噢诶呀哈喽这个那个就是然后]/g, '')
        .replace(/[，。！？、,.!?\s]/g, '');
      if (cleaned.length < 4) {
        alert('内容太短，没听清，请靠近麦克风再完整说一遍。');
        return;
      }
      setIsListening(false);
      correctAndSend(transcript.trim());
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        alert('麦克风权限被拒绝，请在浏览器地址栏授权麦克风后重试。');
      } else if (e.error !== 'no-speech') {
        alert('语音识别出错，请重试。');
      }
    };
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          config,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.report) {
        onFinish(data.report);
      }
    } catch {
      alert('报告生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">AI 模拟面试</h1>
            <p className="text-xs text-gray-500">
              {config.position} · {config.level === 'junior' ? '初级' : config.level === 'mid' ? '中级' : config.level === 'senior' ? '高级' : '专家'}
              {config.company ? ` · 目标：${config.company}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              ttsEnabled
                ? 'text-blue-600 border-blue-300 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 border-gray-200'
            }`}
          >
            {ttsEnabled ? '🔊 语音播报开' : '🔇 语音播报关'}
          </button>
          {messages.length > 2 && !isEnding && (
            <button
              onClick={() => {
                setIsEnding(true);
                sendMessage('面试到此结束，请给我总结报告');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200"
            >
              结束面试
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={
                msg.content.includes('**') || msg.content.includes('【')
                  ? { __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }
                  : undefined
              }>
                {msg.content.includes('**') || msg.content.includes('【') ? undefined : msg.content}
              </div>
              <div className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {isEnding && !isLoading && (
          <div className="flex justify-center">
            <button
              onClick={generateReport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              📊 查看面试报告
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || isEnding}
            title={isListening ? '停止录音' : '语音输入'}
            className={`px-3 py-2.5 rounded-xl text-sm transition-colors shrink-0 disabled:opacity-50 ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? '正在聆听，请说话...' : isLoading ? 'AI 面试官正在思考...' : '输入你的回答，或点击🎤语音回答'}
            disabled={isLoading || isEnding}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isEnding}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}