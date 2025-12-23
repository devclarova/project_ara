import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TranslateRequest {
  text: string;
  targetLang: string;
  urls?: string[];
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
    const { text, targetLang, urls = [] } = req.body as TranslateRequest;

    // 입력 유효성 검사
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // URL placeholder 처리
    let replacedText = text;
    urls.forEach((url, index) => {
      replacedText = replacedText.replace(url, `<URL_${index}>`);
    });

    // 번역 프롬프트
    const systemPrompt = `
너는 전문 번역가다.
사용자의 국가 언어 코드: "${targetLang}"
텍스트를 반드시 이 언어("${targetLang}")로 번역하라.
<URL_n> 패턴은 절대 변경 금지.
설명 없이 번역만 출력하라.
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
          { role: 'user', content: replacedText },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Translation API error' });
    }

    const data = await response.json();
    let translatedText = data.choices[0].message.content;

    // URL 복원
    urls.forEach((url, index) => {
      translatedText = translatedText.replace(`<URL_${index}>`, url);
    });

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
