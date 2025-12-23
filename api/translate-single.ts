import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TranslateRequest {
  text: string;
  targetLang: string;
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
    const { text, targetLang } = req.body as TranslateRequest;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const langCodeToName: Record<string, string> = {
        'ko': 'Korean',
        'en': 'English',
        'ja': 'Japanese',
        'zh': 'Chinese (Simplified)',
        'ru': 'Russian',
        'vi': 'Vietnamese',
        'bn': 'Bengali',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'th': 'Thai',
        'es': 'Spanish',
        'fr': 'French',
        'pt': 'Portuguese',
        'pt-br': 'Brazilian Portuguese',
        'de': 'German',
        'fi': 'Finnish',
        'id': 'Indonesian',
        'it': 'Italian',
        'tr': 'Turkish',
    };

    const targetLanguageName = langCodeToName[targetLang] || targetLang;

    const japaneseGuideline = targetLang === 'ja' 
      ? '\n- For Japanese: Use hiragana (ひらがな) and katakana (カタカナ) as much as possible. Minimize the use of kanji (漢字). Prefer simpler, more accessible Japanese.'
      : '';

    const systemPrompt = `You are an expert translator and localization specialist for a premium Korean language learning platform.
Target Language: ${targetLanguageName} (Code: ${targetLang})

Your goal is to provide **natural, fluently written translations** that sound like they were written by a native speaker of the target language.

CRITICAL RULES:
1. **TARGET LANGUAGE ONLY**: The output MUST be in **${targetLanguageName}**. 
   - If the input is English, **TRANSLATE** it to ${targetLanguageName}. Do NOT keep it in English (unless Target is English).
   - If the input is Korean, **TRANSLATE** it to ${targetLanguageName}.
2. **PRONUNCIATION (Romanization) HANDLING (HIGHEST PRIORITY)**:
   - **Scenario A (Bracketed)**: Input contains '[Romanization]'.
     - Action: Transliterate content inside '[]' to Target Script (Sound Only). **No Meaning Translation.**
   - **Scenario B (Raw/Unbracketed)**: Input is ONLY Romanized Korean (e.g. "Saranghae", "Annyeong").
     - Action: **Transliterate** to Target Script (Sound Only).
     - **Strict Rule**: NEVER translate the meaning of Romanized Korean.
     - **Bad Example**: "Saranghae" -> "I Love You" (Wrong! Meaning)
     - **Good Example (JA)**: "Saranghae" -> "サランヘ" (Correct! Sound)
     - **Good Example (RU)**: "Annyeong" -> "Аннён" (Correct! Sound)
3. **NO KOREAN CHARACTERS**: The output MUST NOT contain any Korean characters (Hangul). If you see Korean, translate it completely.
4. **NO QUOTES**: Do NOT wrap the translation in quotation marks (single ' or double "). Return only the clean text.
5. **Music Titles**:
   - **Format Preservation**: 
     - If input is "Artist - Title", output "Artist - Translated Title".
     - If input is ONLY "Title" (no artist), output ONLY "Translated Title". **DO NOT ADD THE ARTIST NAME.**
   - **Artist**: Use official name (e.g., "IU", "BTS").
   - **Title**: Use official title **in the Target Language Script**.
     - If the title is English (e.g. "Love Poem") and Target is NOT English: **Transliterate or Translate** it (e.g. "Love Poem" -> "ラブ·ポエム" for Japanese). **Do NOT keep it in English alphabet.**
   - Example: "밤편지" -> "Through the Night" (for English).
   - Example: "Love Poem" -> "ラブ·ポエム" (for Japanese).
6. **English Input Handling**:
   - If the input is already in English (e.g. "Crush - Beautiful", "Drama Title"), but the Target Language is NOT English (e.g. Japanese, Spanish), you MUST translate/transliterate it to the target language.
   - Do NOT just copy the English input unless the target language uses English titles officially (common in some regions, but prefer local script if standard).
7. **Mixed Input Handling**: 
   - Input: "내 손을 잡아 (Hold My Hand)"
   - Instruction: Translate content into a single clean title in the target language.
8. **Naturalness**: Avoid robotic literal translations. Use correct grammar, casing, and spacing.
9. **Context**: K-Drama, K-Pop, Movie titles.

${japaneseGuideline}`;

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
          { role: 'user', content: text },
        ],
        max_tokens: 200, 
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Translation API error' });
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ translatedText });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
