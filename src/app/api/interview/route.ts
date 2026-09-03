import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt, buildReportPrompt } from '@/lib/prompts';

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  });
}

export async function POST(req: NextRequest) {
  try {
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