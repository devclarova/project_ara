import type { VercelRequest, VercelResponse } from '@vercel/node';

interface DetectLanguageRequest {
  text: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body as DetectLanguageRequest;

    // 입력 유효성 검사
    if (!text) {
      return res.status(400).json({ error: 'Missing text field' });
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 언어 감지 프롬프트
    const systemPrompt = `
다음 문장이 의미 있는 자연어인지 판별해라.
한국어/영어/기타 문장 → "valid"
의미 없는 랜덤 문자(예: 뷃둙훽뤰줻) → "invalid"
설명 없이 valid 또는 invalid만 출력.
    `;

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Detection API error' });
    }

    const data = await response.json();
    const validation = data.choices?.[0]?.message?.content?.trim() || 'invalid';

    return res.status(200).json({ validation });
  } catch (error) {
    console.error('Language detection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
