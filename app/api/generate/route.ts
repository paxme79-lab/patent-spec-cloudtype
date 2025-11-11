// app/api/generate/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title_ko, notes, claims_text } = body as {
      title_ko?: string;
      notes?: string;
      claims_text?: string;
    };

    if (!claims_text?.trim()) {
      return Response.json({ error: '청구범위(청구항)가 필요합니다.' }, { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    // ↓ 기존에 쓰던 system/user 프롬프트를 그대로 사용하세요.
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'KR/US 특허 명세서 작성 전문가로 동작...' },
        { role: 'user', content: `제목:${title_ko||''}\n메모:${notes||''}\n[청구범위]\n${claims_text}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = completion.choices?.[0]?.message?.content ?? '{}';

    // OpenAI가 문자열 JSON을 줄 수도 있으므로 안전 파싱
    let data: any;
    try {
      data = JSON.parse(content);
    } catch {
      data = { raw: content };
    }

    // ✅ 항상 JSON으로 응답
    return Response.json(data, { status: 200 });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status =
      /429|quota|rate limit/i.test(msg) ? 429 :
      /unauthorized|401/i.test(msg) ? 401 :
      500;
    return Response.json({ error: msg }, { status });
  }
}
