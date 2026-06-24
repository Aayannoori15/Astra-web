import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT =
  'You are the Celestial Oracle for Project Zenith. You are an expert in astronomy, astrophysics, satellites, and space science. Answer questions about planets, constellations, satellites, and the ISS concisely and accurately. Match the serious, sleek, scientific tone of the dashboard.';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key missing. Add GROQ_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages payload.' }, { status: 400 });
    }

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message ?? `Groq API error ${response.status}`;
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const reply =
      (data as any).choices?.[0]?.message?.content ?? 'No response received from Groq.';

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
