import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BatchTranslateRequest {
  texts: string[];
  targetLang: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
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
    const { texts, targetLang } = req.body as BatchTranslateRequest;

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields or invalid format' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const langCodeToName: Record<string, string> = {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
      zh: 'Chinese (Simplified)',
      ru: 'Russian',
      vi: 'Vietnamese',
      bn: 'Bengali',
      ar: 'Arabic',
      hi: 'Hindi',
      th: 'Thai',
      es: 'Spanish',
      fr: 'French',
      pt: 'Portuguese',
      'pt-br': 'Brazilian Portuguese',
      de: 'German',
      fi: 'Finnish',
      id: 'Indonesian',
      it: 'Italian',
      tr: 'Turkish',
    };
    const targetLanguageName = langCodeToName[targetLang] || targetLang;

    const systemPrompt = `You are a high-performance translation engine for a language learning app.
Target Language: ${targetLanguageName} (Code: ${targetLang})
Context: Korean Subtitles, K-Pop Lyrics, K-Drama.

Output Format: JSON Object with key "translations" containing an Array of Strings.
Example: { "translations": ["Translated Text 1", "Translated Text 2"] }

CRITICAL TRANSLATION RULES (Follow Strictly):
1. **Target Language Only**: The output MUST be in **${targetLanguageName}**. 
   - If the input is English, **TRANSLATE** it to ${targetLanguageName}. Do NOT keep it in English (unless Target is English).
   - If the input is Korean, **TRANSLATE** it to ${targetLanguageName}.
2. **PRONUNCIATION (Romanization) HANDLING (HIGHEST PRIORITY)**:
   - **Scenario A (Bracketed)**: Input contains '[Romanization]'.
     - Action: Transliterate content inside '[]' to Target Script (Sound Only). **No Meaning **
   - **Scenario B (Raw/Unbracketed)**: Input is ONLY Romanized Korean (e.g. "Saranghae", "Annyeong").
     - Action: **Transliterate** to Target Script (Sound Only).
     - **Strict Rule**: NEVER translate the meaning of Romanized Korean.
     - **Bad Example**: "Saranghae" -> "I Love You" (Wrong! Meaning)
     - **Good Example (JA)**: "Saranghae" -> "サランヘ" (Correct! Sound)
     - **Good Example (RU)**: "Annyeong" -> "Аннён" (Correct! Sound)
3. **NO KOREAN CHARACTERS**: The output MUST NOT contain any Korean characters (Hangul).
4. **NO QUOTES**: Do NOT wrap strings in extra quotes inside the JSON array.
5. **Music Titles**:
   - If input is "Artist - Title", output "Artist - Translated Title".
   - If input is ONLY "Title", output "Translated Title". Do NOT add artist.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ texts }) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Translation API error' });
    }

    const data = await response.json();
    const contentStr = data.choices[0].message.content;

    // Parse JSON safely
    let parsedResults: string[] = [];
    try {
      const parsed = JSON.parse(contentStr);
      if (parsed.translations && Array.isArray(parsed.translations)) {
        parsedResults = parsed.translations;
      } else if (Array.isArray(parsed)) {
        parsedResults = parsed;
      } else {
        // Fallback: try to find any array
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray) parsedResults = firstArray as string[];
      }
    } catch (e) {
      console.error('Failed to parse JSON response', e);
      return res.status(500).json({ error: 'JSON parsing failed' });
    }

    return res.status(200).json({ translations: parsedResults });
  } catch (error) {
    console.error('Batch translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
