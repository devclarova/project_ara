import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const inFlightMap = new Map<string, Promise<string>>();

interface TranslateRequest {
  text: string;
  targetLang: string;
  contentId?: string;
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
    const { text, targetLang, contentId } = req.body as TranslateRequest;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lockKey = contentId ? `${targetLang}:${contentId}` : null;

    // 1. 서버 사이드 공용 캐시 재조회
    if (lockKey && contentId) {
        const { data: cached } = await supabaseAdmin
            .from('translations')
            .select('translated_text')
            .eq('content_id', contentId)
            .eq('target_lang', targetLang)
            .is('user_id', null)
            .maybeSingle();
        
        if (cached?.translated_text) {
            return res.status(200).json({ translatedText: cached.translated_text });
        }

        // 2. In-flight Deduplication (Lock)
        const inFlight = inFlightMap.get(lockKey);
        if (inFlight) {
            try {
                const result = await inFlight;
                return res.status(200).json({ translatedText: result });
            } catch (err) {
                // 기존 작업 실패 시 직접 진행
            }
        }
    }

    // 3. OpenAI 호출 로직을 Promise로 래핑하여 Map에 등록
    const translateTask = (async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

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
   - zh: Latin-letter Korean sound guide for Chinese learners only. Never translate meaning into Chinese. This is NOT Mandarin vocabulary pinyin. Represent the original Korean pronunciation accurately, not the Chinese meaning. Do NOT replace Korean words with Chinese equivalents or their pinyin. For example, [PRON:생일] should follow "saeng il" or "seng il" style, NOT "sheng ri"; [PRON:우리] should follow "u ri" style, NOT "wo men" or "wu li"; [PRON:강아지] should follow "gang a ji" style, NOT "xiao gou"; [PRON:알았다] should follow "a ra da" style, NOT "hao le"; [PRON:수제비] should follow "su je bi" style, NOT "shou gong mian". Avoid Chinese characters and tone marks. Use simple spaced syllables and preserve the Korean sound flow for easy reading.
   - ru: Cyrillic only (e.g., ха다).
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
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        if (!result) throw new Error('Empty AI response');

        // 4. 공용 캐시 저장 (Awaited with error handling)
        if (contentId) {
            if (!supabaseServiceKey) {
                console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Skipping public cache save.');
            } else {
                try {
                    const { error } = await supabaseAdmin.from('translations').insert({
                        content_id: contentId,
                        target_lang: targetLang,
                        original_text: text,
                        translated_text: result,
                        user_id: null
                    });
                    
                    if (error && error.code !== '23505') {
                        console.error('Failed to save public cache:', error.code, error.message);
                    }
                } catch (dbErr) {
                    console.error('Unexpected DB error during public cache save:', dbErr);
                }
            }
        }

        return result;
    })();

    // Timeout (15s) 래핑
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Translation timeout')), 15000)
    );

    if (lockKey) inFlightMap.set(lockKey, translateTask);

    try {
        const finalResult = await Promise.race([translateTask, timeoutPromise]);
        return res.status(200).json({ translatedText: finalResult });
    } finally {
        if (lockKey) inFlightMap.delete(lockKey);
    }

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
