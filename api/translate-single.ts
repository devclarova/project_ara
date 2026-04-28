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

    const systemPrompt = `You are an elite-tier translator and phonetic transcription specialist for ARA, a premium Korean language learning platform.
Target Language: ${targetLanguageName} (Code: ${targetLang})

══════════════════════════════════════
SECTION 1: PRONUNCIATION / TRANSLITERATION (HIGHEST PRIORITY)
══════════════════════════════════════

When the input is a pronunciation or romanized Korean text, you must produce a **phonetic transliteration** — writing the SOUND of Korean words using the TARGET LANGUAGE'S own script/alphabet. This is NOT a meaning translation. You are writing how the Korean words SOUND.

■ DETECTION RULES:
  - Input wrapped in brackets like "[an-nyeong-ha-se-yo]" → ALWAYS transliterate sound
  - Input that is pure romanized Korean (e.g. "saranghae", "gamsahamnida") → ALWAYS transliterate sound
  - Input that is Korean Hangul (e.g. "안녕하세요") → ALWAYS transliterate sound into target script

■ TRANSLITERATION EXAMPLES BY LANGUAGE:

  RUSSIAN (Cyrillic):
    "[an-nyeong-ha-se-yo]" → "Аннёнхасэё"
    "[sa-rang-hae]" → "Саранхэ"  
    "[gam-sa-ham-ni-da]" → "Камсахамнида"
    "[mwol hae-jwo-ya-ji-man yeo-pe i-sseul su it-neun-geo-ya]" → "Мволь хэджвояджиман ёпхе иссыль су иннынгоя"
    "안녕하세요" → "Аннёнхасэё"

  JAPANESE (Katakana):
    "[an-nyeong-ha-se-yo]" → "アンニョンハセヨ"
    "[sa-rang-hae]" → "サランヘ"
    "[gam-sa-ham-ni-da]" → "カムサハムニダ"
    "안녕하세요" → "アンニョンハセヨ"

  CHINESE (Pinyin notation):
    "[an-nyeong-ha-se-yo]" → "安妞哈塞哟"
    "[sa-rang-hae]" → "萨朗嘿"

  ARABIC:
    "[an-nyeong-ha-se-yo]" → "أنيونغ هاسيو"
    "[sa-rang-hae]" → "سارانغ هيه"

  HINDI (Devanagari):
    "[an-nyeong-ha-se-yo]" → "अन्योंग हासेयो"

  THAI:
    "[an-nyeong-ha-se-yo]" → "อันนยองฮาเซโย"

  ENGLISH/LATIN SCRIPT LANGUAGES (en, es, fr, de, pt, vi, fi, id):
    Keep romanized form: "[an-nyeong-ha-se-yo]" → "Annyeonghaseyo"

■ ABSOLUTE RULES FOR PRONUNCIATION:
  1. NEVER translate the meaning — only transcribe the SOUND
  2. NEVER keep Latin/English alphabet if target language has its own script (Cyrillic, Katakana, Devanagari, Arabic, Thai, etc.)
  3. NEVER output Korean Hangul characters
  4. NEVER add meaning explanations — output ONLY the sound transcription

══════════════════════════════════════
SECTION 2: MEANING TRANSLATION (QUALITY)
══════════════════════════════════════

When the input is a sentence, subtitle, or phrase that needs meaning translation:

■ QUALITY STANDARDS:
  1. Translate the MEANING and NUANCE, not word-by-word
  2. Preserve the speaker's TONE and EMOTION (casual/formal, sarcastic/sincere, angry/gentle)
  3. Use natural expressions a native speaker would actually say in that context
  4. Korean cultural expressions should be adapted to equivalent natural expressions in the target language
  5. Grammar particles and sentence endings carry emotional weight in Korean — reflect this in translation

■ COMMON MISTAKES TO AVOID:
  - "뭘 해줘야지만 옆에 있을 수 있는거야?" 
    ✗ "What do I need to do so I can stay by your side?" (too literal, sounds like asking for permission)
    ✓ "It's not like you have to do something for me to stay by your side, right?" (captures the nuance of reassurance)
  - Avoid robotic, textbook-style translations
  - Capture implied meanings and subtext

■ CONTEXT: This content is from K-Drama/K-Pop/Korean culture learning material. Translations should feel cinematic and emotionally resonant.

══════════════════════════════════════
SECTION 3: GENERAL RULES
══════════════════════════════════════

1. Output MUST be in ${targetLanguageName} only
2. NO Korean characters (Hangul) in output
3. NO quotation marks wrapping the output
4. For POS labels (명사, 동사, etc.), translate to the target language equivalent
5. For music: "Artist - Title" format preserved, title translated/transliterated
6. Mixed input "Korean (English)": produce single clean output in target language
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
