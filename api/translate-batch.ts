import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const inFlightMap = new Map<string, Promise<string>>();

interface BatchTranslateRequest {
  texts: string[];
  targetLang: string;
  contentIds?: string[];
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
    const { texts, targetLang, contentIds } = req.body as BatchTranslateRequest;

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields or invalid format' });
    }

    const results = new Array(texts.length).fill(null);
    const indicesToProcess: number[] = [];

    // 1. 서버 사이드 공용 캐시 재조회 (DB)
    if (contentIds && contentIds.length === texts.length) {
        const { data: cachedRows } = await supabaseAdmin
            .from('translations')
            .select('content_id, translated_text')
            .in('content_id', Array.from(new Set(contentIds)))
            .eq('target_lang', targetLang)
            .is('user_id', null);

        const cacheMap = new Map((cachedRows || []).map(r => [r.content_id, r.translated_text]));

        texts.forEach((_, idx) => {
            const cid = contentIds[idx];
            if (cacheMap.has(cid)) {
                results[idx] = cacheMap.get(cid);
            } else {
                indicesToProcess.push(idx);
            }
        });
    } else {
        // contentIds가 없으면 전체 처리
        texts.forEach((_, idx) => indicesToProcess.push(idx));
    }

    if (indicesToProcess.length === 0) {
        return res.status(200).json({ translations: results });
    }

    // 2. In-flight Deduplication (Lock)
    const stillToTranslateIndices: number[] = [];
    const pendingPromises: Promise<void>[] = [];

    indicesToProcess.forEach(idx => {
        const cid = contentIds?.[idx];
        const lockKey = cid ? `${targetLang}:${cid}` : null;
        const inFlight = lockKey ? inFlightMap.get(lockKey) : null;

        if (inFlight) {
            pendingPromises.push(
                inFlight.then(res => { results[idx] = res; }).catch(() => {
                    // 실패 시 다시 번역 대상에 포함 (실제로 다음 단계에서 처리하기엔 늦으므로 개별 처리)
                    stillToTranslateIndices.push(idx);
                })
            );
        } else {
            stillToTranslateIndices.push(idx);
        }
    });

    await Promise.all(pendingPromises);

    // 3. 진짜 OpenAI 호출이 필요한 항목만 추출 (중복 제거 포함)
    const finalMissingIndices = stillToTranslateIndices.filter(idx => results[idx] === null);
    if (finalMissingIndices.length === 0) {
        return res.status(200).json({ translations: results });
    }

    // 동일 요청 내 중복 contentId 처리
    const uniqueToTranslate = new Map<string, { text: string, indices: number[] }>();
    finalMissingIndices.forEach(idx => {
        const cid = contentIds?.[idx] || `manual_${idx}`;
        if (!uniqueToTranslate.has(cid)) {
            uniqueToTranslate.set(cid, { text: texts[idx], indices: [] });
        }
        uniqueToTranslate.get(cid)!.indices.push(idx);
    });

    const itemsToCall = Array.from(uniqueToTranslate.entries());
    const textsToCall = itemsToCall.map(([_, val]) => val.text);

    // 4. OpenAI 호출 로직을 Promise로 래핑
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

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

    const fullSystemPrompt = `You are an elite-tier translation and phonetic transcription engine for ARA (Korean Learning App).
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
   - ja: Katakana only (e.g., ハ다).
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
5. **Integrity**: Return valid JSON only. No markdown, no quotes wrapping the array items, no explanations.
`;

    const apiTask = (async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content: JSON.stringify({ texts: textsToCall }) },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
        const data = await response.json();
        const contentStr = data.choices[0].message.content;
        const parsed = JSON.parse(contentStr);
        const trs = parsed.translations || parsed;
        if (!Array.isArray(trs)) throw new Error('Invalid AI response format');
        return trs;
    })();

    // In-flight Map 등록 (각 항목별로)
    const locks: string[] = [];
    itemsToCall.forEach(([cid, _], i) => {
        const lockKey = `${targetLang}:${cid}`;
        // [Surgical Fix] apiTask 실패 시 unhandled rejection 방지를 위해 dummy catch 추가
        const itemPromise = apiTask.then(allResults => allResults[i]).catch(() => undefined);
        inFlightMap.set(lockKey, itemPromise);
        locks.push(lockKey);
    });

    try {
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Batch translation timeout')), 20000)
        );
        const finalResultsFromAI = await Promise.race([apiTask, timeoutPromise]);

        // 결과 배분 및 DB 저장
        const upsertData: any[] = [];
        itemsToCall.forEach(([cid, val], i) => {
            const translated = finalResultsFromAI[i];
            if (translated) {
                val.indices.forEach(idx => { results[idx] = translated; });
                if (!cid.startsWith('manual_')) {
                    upsertData.push({
                        content_id: cid,
                        target_lang: targetLang,
                        original_text: val.text,
                        translated_text: translated,
                        user_id: null
                    });
                }
            }
        });

        if (upsertData.length > 0) {
            if (!supabaseServiceKey) {
                console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Skipping public cache batch save.');
            } else {
                try {
                    const { error } = await supabaseAdmin.from('translations').insert(upsertData);
                    if (error && error.code !== '23505') {
                        console.error('Public batch save error:', error.code, error.message);
                    }
                } catch (dbErr) {
                    console.error('Unexpected DB error during public batch save:', dbErr);
                }
            }
        }

        return res.status(200).json({ translations: results });
    } finally {
        locks.forEach(l => inFlightMap.delete(l));
    }
  } catch (error: any) {
    console.error('Batch translation error:', error);
    if (error?.message?.includes('429')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
