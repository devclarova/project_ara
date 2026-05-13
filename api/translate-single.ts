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

    const systemPrompt = `You are an elite-tier translation and phonetic transcription engine for ARA (Korean Learning App).
Target Language: ${targetLanguageName} (Code: ${targetLang})
Context: Korean Subtitles, K-Pop Lyrics, K-Drama, Vocabulary.

CRITICAL TRANSLATION RULES:
1. **Target Language Only & No Hangul**: 
   - Translate all content (Korean/English) into ${targetLanguageName}.
   - AI outputs MUST NOT contain any Hangul characters.
2. **Proper Nouns & Artists**:
   - Use official international names (e.g., IU, BTS, BLACKPINK).
   - If no official name exists, transliterate the sound into ${targetLanguageName} script. Never leave as Hangul.
3. **Pronunciation ([PRON:...]) Task**:
   - Perform **Phonetic Transcription ONLY**. Never translate meaning. Help a native speaker of ${targetLanguageName} pronounce the Korean sound accurately using their native script and reading conventions.
   - en: Standard English romanization (e.g., ha-da).
   - ja: Katakana only (e.g., ハダ).
   - zh: Learner-friendly Pinyin or notation.
   - ru: Cyrillic only (e.g., хада).
   - vi: Use Vietnamese alphabet and reading habits to approximate the Korean sound. **Strictly avoid Korean Revised Romanization (RR) or English-style romanization.** Do NOT output RR-style forms (e.g., ha-da, hae-ju-da, yeop, geu-nyang, mo-reu-da, mwol hae jwo...). Do NOT preserve RR clusters like 'eo', 'eu', 'ae', 'oe', 'ui', 'yeo', 'jwo'. Instead, use Vietnamese-friendly letters like 'ơ', 'ư', 'ê', 'ô', 'uy', 'ch', 'gi', 'ng', 'nh'. For long sentences, maintain a natural Vietnamese-readable phonetic flow and separate by phrase groups naturally, not by every syllable. Use lowercase unless punctuation requires. Avoid arbitrary tone marks unless they improve readability. Do NOT translate meaning and never include Hangul. Remove any [PRON:...] markers.
   - bn: Bengali script only.
   - ar: Arabic script only.
   - hi: Devanagari script only.
   - th: Thai script only.
   - es, fr, de, pt, pt-br, fi, id, it, tr: Use the language's native alphabet and reading conventions to represent the sound accurately. Do not use generic English-style romanization.
4. **Music Titles**:
   - Format: "Artist - Translated Title". Ensure both Artist and Title are in ${targetLanguageName} script or international names (No Hangul).
   - DO NOT combine original and translation (No "Original (Translation)").
5. **Format & Integrity**:
   - Return clean output in ${targetLanguageName} only.
   - No quotation marks, no markdown, no explanations.
   - If input is a PoS label (명사, 동사), translate to the equivalent in ${targetLanguageName}.
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

