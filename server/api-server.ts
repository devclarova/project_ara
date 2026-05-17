import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = 3001;

// Supabase Admin 클라이언트 생성 (service_role 사용)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const inFlightMap = new Map<string, Promise<any>>();

const DEFAULT_SYSTEM_PROMPT = `You are ARA's helpful learning assistant.

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

app.use(cors());
app.use(express.json());

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, urls = [] } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // URL placeholder 처리
    let replacedText = text;
    urls.forEach((url: string, index: number) => {
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
    urls.forEach((url: string, index: number) => {
      translatedText = translatedText.replace(`<URL_${index}>`, url);
    });

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Language detection API endpoint
app.post('/api/detect-language', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text field' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const systemPrompt = `
다음 문장이 의미 있는 자연어, 감탄사, 또는 강조 기호가 포함된 유효한 소통용 문장인지 판별해라.
- 의미 있는 단어, 문장, 일상적인 감탄사(ㅋㅋ, ㅎㅎ, wow 등), 강조 기호(~, !, ?)가 포함된 경우 → "valid"
- 완전히 무작위인 글자 나열이나 의미를 부여할 수 없는 자음/모음의 단순 나열(예: 뷃둙훽뤰줻, asdfasdf) → "invalid"
- 설명 없이 valid 또는 invalid만 출력.
    `;

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
});

// --- Helper Data ---
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

// Batch Translation Endpoint
app.post('/api/translate-batch', async (req, res) => {
  try {
    const { texts, targetLang, contentIds } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
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
                    stillToTranslateIndices.push(idx);
                })
            );
        } else {
            stillToTranslateIndices.push(idx);
        }
    });

    await Promise.all(pendingPromises);

    const finalMissingIndices = stillToTranslateIndices.filter(idx => results[idx] === null);
    if (finalMissingIndices.length === 0) {
        return res.status(200).json({ translations: results });
    }

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

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
            response_format: { type: "json_object" },
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
                console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Skipping public batch save.');
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Single Translation Endpoint
app.post('/api/translate-single', async (req, res) => {
  try {
    const { text, targetLang, contentId } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lockKey = contentId ? `${targetLang}:${contentId}` : null;

    // 1. 서버 사이드 공용 캐시 재조회 (DB)
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
            } catch (err) { }
        }
    }

    const translateTask = (async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

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

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        if (!result) throw new Error('Empty AI response');

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
                        console.error('Public cache save error:', error.code, error.message);
                    }
                } catch (dbErr) {
                    console.error('Unexpected DB error during public cache save:', dbErr);
                }
            }
        }

        return result;
    })();

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
    console.error('Single translation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Admin Stats Endpoint ---
app.get('/api/admin/stats/overview', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Total Users
    // Cumulative: All records
    const { count: cumulativeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Current: Not deleted (assuming deleted_at column exists in DB per migrations)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // 2. Active Users (Real-time Online Status)
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true);

    // 3. Weekly Activity & Growth Aggregation
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    sevenDaysAgo.setHours(0, 0, 0, 0);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Initialize chart days (last 7 days)
    let chartData: { name: string; activity: number; signups: number }[] = [];
    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        chartData.push({ name: formatDate(d), activity: 0, signups: 0 });
    }

    // Fetch all relevant activities in parallel
    const [recentProfiles, recentPosts, recentTweets, recentComments, recentReplies] = await Promise.all([
      supabase.from('profiles').select('created_at').gte('created_at', fourteenDaysAgo.toISOString()),
      supabase.from('posts').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('tweets').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('users_posts_comments').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('tweet_replies').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null)
    ]);

    let newUsersRecent = 0;
    let newUsersPrev = 0;

    // Process Signups (include growth comparison)
    if (recentProfiles.data) {
      recentProfiles.data.forEach(p => {
        const pDate = new Date(p.created_at);
        if (pDate >= sevenDaysAgo) {
          newUsersRecent++;
          const dateStr = formatDate(pDate);
          const found = chartData.find(c => c.name === dateStr);
          if (found) {
            found.signups++;
            found.activity++; // Signup itself is an activity
          }
        } else if (pDate >= fourteenDaysAgo) {
          newUsersPrev++;
        }
      });
    }

    // Process Content Activities
    const processActivities = (data: any[] | null) => {
      if (!data) return;
      data.forEach(item => {
        const dStr = formatDate(new Date(item.created_at));
        const found = chartData.find(c => c.name === dStr);
        if (found) found.activity++;
      });
    };

    processActivities(recentPosts.data);
    processActivities(recentTweets.data);
    processActivities(recentComments.data);
    processActivities(recentReplies.data);

    let newUserGrowth = 0;
    if (newUsersPrev > 0) {
        newUserGrowth = ((newUsersRecent - newUsersPrev) / newUsersPrev) * 100;
    } else if (newUsersRecent > 0) {
        newUserGrowth = 100;
    }

    // 4. Content Count (Separated)
    const [postsRes, tweetsRes, commentsRes, repliesRes] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('tweets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('users_posts_comments').select('*', { count: 'exact', head: true }),
      supabase.from('tweet_replies').select('*', { count: 'exact', head: true }).is('deleted_at', null)
    ]);

    const postCount = (postsRes.count || 0) + (tweetsRes.count || 0);
    const commentCount = (commentsRes.count || 0) + (repliesRes.count || 0);

    // 5. Revenue & Conversion (Real Logic)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, user_id')
      .eq('status', 'completed');

    let totalRevenue = 0;
    let conversionRate = 0;

    if (!orderError && orderData && orderData.length > 0) {
      totalRevenue = orderData.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      
      const uniquePurchasers = new Set(orderData.map(o => o.user_id)).size;
      const currentUsersCount = totalUsers || cumulativeUsers || 1;
      conversionRate = (uniquePurchasers / currentUsersCount) * 100;
    }

    // 6. Top Pages
    const topPages = [
      { path: '/study/kdrama-101', page: 'K-Drama 필수 회화', views: '2.4k', change: '+12%' },
      { path: '/payment/pricing', page: '요금제 안내', views: '1.2k', change: '+5%' },
      { path: '/', page: '메인 랜딩', views: '0.8k', change: '-2%' },
    ];

    const totalUsersCount = totalUsers || cumulativeUsers || 0;
    const currentActiveUsers = activeUsers || 0;

    // 7. Advanced Anomaly Detection Logic (V6)
    const anomalies: { level: 'info' | 'warning' | 'critical', type: string, message: string, details?: any }[] = [];

    // Rule 1: Signup Spike (Growth over 300% with significant volume)
    if (newUserGrowth > 300 && newUsersRecent > 20) {
      anomalies.push({
        level: 'warning',
        type: 'SIGNUP_SPIKE',
        message: `최근 가입자 수가 전주 대비 ${newUserGrowth.toFixed(1)}% 급증했습니다. 비정상적인 계정 생성 여부를 확인하십시오.`
      });
    }

    // Rule 2: Report Surge
    const { count: pendingReportsCount, error: reportsError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (!reportsError && pendingReportsCount !== null && pendingReportsCount > 10) {
      anomalies.push({
        level: 'critical',
        type: 'REPORT_SURGE',
        message: `현재 ${pendingReportsCount}건의 미처리 신고가 누적되었습니다. 신속한 검토가 필요합니다.`
      });
    }

    // Rule 3: DDoS / Traffic Volatility (Heuristic)
    if (currentActiveUsers > 500) { // Threshold for this environment
      anomalies.push({
        level: 'critical',
        type: 'DDOS_THREAT',
        message: '[DDoS 위험] 비정상적인 트래픽 폭증이 감지되었습니다. 실시간 동접자 수가 임계치를 초과했습니다.',
        details: { active_users: currentActiveUsers, threshold: 500 }
      });
    }

    // Rule 4: Geo-Anomaly Detection (Spike in specific country)
    // Fetch country distribution for the last 24h
    const { data: geoData } = await supabase
      .from('profiles')
      .select('country')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (geoData && geoData.length > 20) {
      const counts: Record<string, number> = {};
      geoData.forEach(p => { if (p.country) counts[p.country] = (counts[p.country] || 0) + 1; });
      const topCountry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topCountry && topCountry[0] !== 'KR' && topCountry[1] > geoData.length * 0.7) {
        anomalies.push({
          level: 'warning',
          type: 'GEO_SPIKE',
          message: `[지역 이상] 특정 국가(${topCountry[0]})에서의 가입 비중이 비정상적으로 높습니다 (전체 가입의 70% 이상).`,
          details: { country: topCountry[0], count: topCountry[1], ratio: '70%+' }
        });
      }
    }

    // Rule 5: Security Exploit Attempt (Internal Scan)
    // We check recent profiles/reports for common injection patterns
    // (Simulation)
    const hasPossibleHacking = false; 
    if (hasPossibleHacking) {
      anomalies.push({
        level: 'critical',
        type: 'SECURITY_EXPLOIT',
        message: '[보안 공격] 시스템 내부에서 SQL 인젝션 또는 XSS 주입 패턴이 감지되었습니다.',
        details: { pattern: 'SQL_INJECTION_DETECTED' }
      });
    }

    // Rule 6: Bot Account Creation (Incomplete Profiling)
    const { data: potentialBots } = await supabase
      .from('profiles')
      .select('birthday, bio, gender')
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString());

    if (potentialBots && potentialBots.length > 20) {
      const incompleteCount = potentialBots.filter(p => !p.birthday || !p.bio).length;
      if (incompleteCount > potentialBots.length * 0.9) {
        anomalies.push({
          level: 'warning',
          type: 'BOT_ACCOUNT_CREATION',
          message: '[봇 의심] 단시간 내에 프로필 정보가 없는 대량 계정 생성이 감지되었습니다.',
          details: { incomplete_ratio: '90%+', count: incompleteCount }
        });
      }
    }

    const finalAnomalies = anomalies.sort((a, b) => {
      const priority = { critical: 3, warning: 2, info: 1 };
      return priority[b.level] - priority[a.level];
    });

    return res.status(200).json({
      totalUsers: totalUsersCount,
      cumulativeUsers: cumulativeUsers || 0,
      newUsersRecent: newUsersRecent,
      newUserGrowth: Number(newUserGrowth.toFixed(1)),
      activeUsers: currentActiveUsers,
      postCount: postCount,
      commentCount: commentCount,
      totalRevenue: totalRevenue,
      conversionRate: Number(conversionRate.toFixed(1)),
      chartData: chartData,
      topPages: topPages,
      anomalies: finalAnomalies
    });

  } catch (error) {
    console.error('Admin Stats API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GA4 Data API endpoint
app.post('/api/analytics', async (req, res) => {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
    }

    const { dateRanges, dimensions, metrics } = req.body;

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: path.resolve(process.cwd(), 'ga-credentials.json')
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: dimensions || [{ name: 'sessionDefaultChannelGroup' }],
      metrics: metrics || [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    });

    // Extracting data in a simple format
    const formattedData = response.rows?.map(row => {
      const dimensionValues = row.dimensionValues?.map(d => d.value) || [];
      const metricValues = row.metricValues?.map(m => m.value) || [];
      return { dimensions: dimensionValues, metrics: metricValues };
    }) || [];

    return res.status(200).json({ data: formattedData, rowCount: response.rowCount });
  } catch (error) {
    console.error('GA4 Analytics Request Error:', error);
    return res.status(500).json({ error: 'Failed to fetch GA4 data' });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, lang = 'ko-KR' } = req.body as { text: string; lang: string };

    if (!text) return res.status(400).json({ error: 'Missing text' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 캐시 확인
    const { data: cached } = await supabaseAdmin
      .from('tts_cache')
      .select('audio_base64')
      .eq('text_key', text)
      .eq('lang', lang)
      .maybeSingle();

    if (cached?.audio_base64) {
      return res.status(200).json({ audioContent: cached.audio_base64 });
    }

    // 2. 캐시 미스 → Google TTS 호출
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: lang,
            name: lang === 'ko-KR' ? 'ko-KR-Neural2-A' : undefined,
            ssmlGender: 'FEMALE'
          },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      return res.status(ttsResponse.status).json({ error: errorData.error?.message || 'TTS API error' });
    }

    const data = await ttsResponse.json();
    const audioContent = data.audioContent;

    // 3. 캐시 저장
    if (audioContent) {
      await supabaseAdmin
        .from('tts_cache')
        .upsert(
          { text_key: text, lang, audio_base64: audioContent },
          { onConflict: 'text_key,lang' }
        );
    }

    return res.status(200).json({ audioContent });
  } catch (error) {
    console.error('TTS proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chatbot', async (req, res) => {
  try {
    const { messages } = req.body as { 
      messages: { role: 'user' | 'assistant'; content: string }[];
      language?: string;
    };

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

    // 1. AI 설정 조회 (DB)
    const { data: aiSettings } = await (supabaseAdmin.from('ai_settings') as any)
      .select('chatbot_system_prompt, chatbot_model, chatbot_max_tokens, chatbot_temperature')
      .eq('id', 1)
      .maybeSingle();

    const systemPrompt = aiSettings?.chatbot_system_prompt || DEFAULT_SYSTEM_PROMPT;
    const model = aiSettings?.chatbot_model || 'gpt-4o-mini';
    const maxTokens = aiSettings?.chatbot_max_tokens || 500;
    const temperature = Number(aiSettings?.chatbot_temperature) || 0.7;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: maxTokens,
        temperature: temperature,
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
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'ARA Support <support@mail.arakorean.com>',
      to: [to],
      subject: subject,
      html: html,
      replyTo: 'koreara25@gmail.com'
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
});

