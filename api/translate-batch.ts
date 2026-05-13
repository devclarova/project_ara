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

    const systemPrompt = `You are an elite-tier translation and phonetic transcription engine for ARA (Korean Learning App).
Target Language: ${targetLanguageName} (Code: ${targetLang})
Context: Korean Subtitles, K-Pop Lyrics, K-Drama.

Output Format: JSON Object with key "translations" containing an Array of Strings.
Example: { "translations": ["Translated Text 1", "Translated Text 2"] }

STRICT BATCH RULES:
1. Return exactly one output string for each input item.
2. Preserve the exact input order. Do not merge, split, skip, summarize, or reorder items.
3. The translations array length MUST exactly equal the input texts array length.
4. If an input item is empty, return an empty string for that item.

CRITICAL TRANSLATION RULES:
1. **Target Language Only & No Hangul**: 
   - Translate all content (Korean/English) into ${targetLanguageName}.
   - AI outputs MUST NOT contain any Hangul characters (original Korean is handled by the UI).
2. **Proper Nouns & Artists**:
   - Use official international names (e.g., IU, BTS, BLACKPINK).
   - If no official name exists, transliterate the sound into ${targetLanguageName} script. Never leave as Hangul.
3. **Pronunciation ([PRON:...]) Task**:
   - Perform **Phonetic Transcription ONLY**. Never translate meaning. Help a native speaker of ${targetLanguageName} pronounce the Korean sound accurately using their native script and reading conventions.
   - en: Standard English romanization (e.g., ha-da).
   - ja: Katakana only (e.g., ハダ).
   - zh: Learner-friendly Pinyin or notation.
   - ru: Cyrillic only (e.g., хада).
   - vi: Use Vietnamese alphabet and reading habits to approximate the Korean sound. **Strictly avoid Korean Revised Romanization (RR) or generic English-style hyphenated romanization.** Do NOT output RR-style forms (e.g., hae-ju-da, yeop, geu-nyang, mo-reu-da). Do not simply add Vietnamese letters or accents to an English/RR base. For long sentences, maintain a natural Vietnamese-readable phonetic flow and avoid mechanical syllable-by-syllable hyphenation (e.g., mwol-hae-jwo-ya...).
   - bn: Bengali script only.
   - ar: Arabic script only.
   - hi: Devanagari script only.
   - th: Thai script only.
   - es, fr, de, pt, pt-br, fi, id, it, tr: Use the language's native alphabet and reading conventions to represent the sound accurately. Do not use generic English-style romanization.
4. **Music Titles**:
   - Format: "Artist - Translated Title". Ensure both Artist and Title are in ${targetLanguageName} script or international names (No Hangul).
   - DO NOT combine original and translation (No "Original (Translation)").
5. **Integrity**: Return valid JSON only. No markdown, no quotes wrapping the array items, no explanations.
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

