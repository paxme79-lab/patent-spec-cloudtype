import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge'; // Cloudtype에서 edge 가능, 안 되면 제거

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title_ko, notes, claims_text } = body || {};

    if (!claims_text || !claims_text.trim()) {
      return new Response('청구항이 필요합니다.', { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('OPENAI_API_KEY 미설정', { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const systemPrompt = `당신은 KR/US 특허 명세서 전문 작성자다.
- 청구항 용어를 변경하지 말고, 명세서에서 충분한 근거를 제공하라.
- 불필요한 한정/축소 표현을 피하고 대체 실시형태를 제시하라.
- JSON 객체만 출력하라 (명세서 섹션과 consistency_report 포함).`;

    const userPrompt = `[입력]
발명의 명칭(선택): ${title_ko || "(미지정)"}
메모(선택): ${notes || "(없음)"}

[청구범위]
${claims_text}

[지시]
1) 배경기술, 발명의 요지, 도면의 간단한 설명, 상세한 설명(실시예), 효과, 변형예, 용어정의, 산업상 이용가능성, 요약서, 도면부호표를 포함한 JSON만 생성.
2) consistency_report(antecedent_ok, term_map[], risky_limitations[]) 포함.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 5000
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    return new Response(content, { headers: { "Content-Type": "application/json" } });
  } catch (e:any) {
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
