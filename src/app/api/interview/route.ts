import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt, buildReportPrompt } from '@/lib/prompts';
import { requireUser } from '@/lib/auth';

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  });
}

const CORRECT_SYSTEM_PROMPT = `你是中文语音识别纠错助手，专注技术面试场景。用户的技术术语可能被识别成同音/形近错字，请把识别结果纠正为正确、通顺的中文。

规则：
1. 只修正明显的同音/形近错字，保留原意和语气，不要增删实质内容、不要改写、不要总结。
2. 正确还原技术术语，例如："哈希麦普"→"HashMap"，"夸大纳闷/库贝内提斯"→"Kubernetes"，"reddis/红烧"→"Redis"，"买思口语/麦思扣"→"MySQL"，"双塔"→"双塔模型"，"反冲"→"缓存"，"安贝丁"→"Embedding"，"微服务"等按技术语境还原。
3. 保持中英混读正确，常见英文技术名词保留英文原文（如 HashMap、Redis、Kubernetes、MySQL、Spark、Flink、GC、HTTP、API、JSON 等）。
4. 只输出纠正后的文本本身，不要解释、不要加引号、不要加前后缀。`;

export async function POST(req: NextRequest) {
  try {
    const { publicUser } = await requireUser(req);
    if (!publicUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const { action, config, messages } = body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: '请先设置 DEEPSEEK_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    if (action === 'chat') {
      const systemPrompt = buildSystemPrompt(config);

      const completion = await getClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20).map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content || '抱歉，我遇到了一些问题，请重新尝试。';
      return NextResponse.json({ reply });
    }

    if (action === 'correct') {
      const raw = body.raw;
      if (!raw || typeof raw !== 'string') {
        return NextResponse.json({ error: '缺少待纠错文本' }, { status: 400 });
      }
      const context = typeof body.context === 'string' ? body.context : '';

      const completion = await getClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: CORRECT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `面试官最近的问题：${context || '无'}\n\n待纠错的语音识别结果：${raw}\n\n请输出纠正后的文本。`,
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      });

      const corrected = completion.choices[0]?.message?.content?.trim() || raw;
      return NextResponse.json({ corrected });
    }

    if (action === 'report') {
      const reportPrompt = buildReportPrompt(config, messages);

      const completion = await getClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的面试报告生成器。只输出 JSON，不要包含任何其他内容。' },
          { role: 'user', content: reportPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content || '{}';

      // 提取 JSON（DeepSeek 可能返回 markdown 代码块包裹的 JSON）
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

      try {
        const report = JSON.parse(jsonStr);
        return NextResponse.json({ report });
      } catch {
        return NextResponse.json({ error: '报告生成失败，请重试' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}