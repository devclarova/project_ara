import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { messages } = req.body as { 
      messages: { role: 'user' | 'assistant'; content: string }[];
      language?: string;
    };

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const systemPrompt = `You are ARA's helpful learning assistant.

About ARA:
ARA is a Korean language learning platform for foreigners who want to learn Korean. ARA uses self-produced animations (folk tales, legends, everyday life animations) to teach real, living Korean as used by native speakers.

Key Features:
- Animation-based learning: Watch self-produced animations with subtitles, vocabulary, pronunciation (TTS), and culture notes
- Vocabulary: Save and review words from lessons
- Quizzes: 3 types - OX quiz, multiple choice, matching quiz
- Community (SNS): Practice Korean by posting and interacting with global learners
- 1:1 Chat: Connect and chat directly with other learners
- Goods Shop: ARA merchandise shop (coming soon - UI only, launching soon)
- Supports 16 languages

Learning Philosophy:
ARA believes language is learned through stories and real usage, not memorization.

Guidelines:
- IMPORTANT: Always respond in the exact same language the user is writing in. If the user writes in Japanese, respond in Japanese. If in Spanish, respond in Spanish. Never switch languages.
- Be friendly, encouraging, and concise
- For pricing, refund policies, or specific account issues, direct users to contact support at koreara25@gmail.com
- If you don't know something specific, be honest about it`;

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
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'ChatBot API error' });
    }

    const data = await response.json();
    return res.status(200).json({ 
      message: data.choices[0].message.content 
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
