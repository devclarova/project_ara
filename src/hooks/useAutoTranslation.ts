import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// 간단한 캐시 객체 (페이지 내 중복 요청 방지)
const memoryCache: Record<string, string> = {};

// 번역 버전 (프롬프트 변경 시 이 값을 올려서 기존 캐시 무시/새로 번역 강제)
const TRANSLATION_VERSION = 'v13_force_target'; // Bump to force refresh with 'Target Language Only' rule

// ... (skip lines 11-155) ...
// --- Concurrency Limiter (Faster than Serial Queue) ---

// --- Concurrency Limiter (Faster than Serial Queue) ---
const MAX_CONCURRENCY = 10; // Allow up to 10 parallel translations for speed
let activeCount = 0;
const requestQueue: (() => void)[] = [];

const processQueue = () => {
  while (requestQueue.length > 0 && activeCount < MAX_CONCURRENCY) {
    const next = requestQueue.shift();
    next?.();
  }
};

const enqueueRequest = (fn: () => Promise<void>) => {
  return new Promise<void>((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        await fn();
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        activeCount--;
        processQueue();
      }
    };

    if (activeCount < MAX_CONCURRENCY) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
};
// ---------------------------

export function useAutoTranslation(text: string, contentId: string, targetLang: string) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 버전이 적용된 ID
  const uniqueId = `${contentId}_${TRANSLATION_VERSION}`;

  useEffect(() => {
    let mounted = true;

    async function fetchTranslation() {
      // 1. Basic validation
      if (!text || typeof text !== 'string' || !text.trim() || !contentId || !targetLang) return;

      // 2. Skip translation for Korean target
      if (targetLang === 'ko' || targetLang === 'ko-KR') {
          if (mounted) {
              setTranslatedText(null); // Use original text
              setIsLoading(false);
          }
          return;
      }

      // 3. Check memory cache first
      const cacheKey = `ara_trans_${uniqueId}_${targetLang}`;
      if (memoryCache[cacheKey]) {
        if (mounted) setTranslatedText(memoryCache[cacheKey]);
        return;
      }

      // 4. Check Session Storage (for guests or persistent tab session)
      try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          memoryCache[cacheKey] = stored;
          if (mounted) setTranslatedText(stored);
          return;
        }
      } catch (e) {
        // Ignore session storage errors (e.g. private mode quota)
      }

      setIsLoading(true);

      try {
        // Enqueue the API call
        await enqueueRequest(async () => {
          if (!mounted) return;

          const { data: { user } } = await supabase.auth.getUser();

          // 5. If logged in, check Supabase first
          if (user) {
            const { data: existing } = await supabase
              .from('translations')
              .select('translated_text')
              .eq('content_id', uniqueId)
              .eq('target_lang', targetLang)
              .maybeSingle();

            if (existing) {
              const val = existing.translated_text;
              memoryCache[cacheKey] = val;
              try { sessionStorage.setItem(cacheKey, val); } catch {}
              
              if (mounted) {
                setTranslatedText(val);
                setIsLoading(false);
              }
              return;
            }
          }

          // 6. OpenAI Translation (Fallback for everyone)
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
          if (!apiKey) {
             console.warn('OpenAI API Key missing');
             return;
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
          };
  
          const targetLanguageName = langCodeToName[targetLang] || targetLang;
  
  
          const japaneseGuideline = targetLang === 'ja' 
            ? '\n- For Japanese: Use hiragana (ひらがな) and katakana (カタカナ) as much as possible. Minimize the use of kanji (漢字). Prefer simpler, more accessible Japanese.'
            : '';
          // System Prompt - High Quality / Natural / Nuanced
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
              model: 'gpt-4o', // Upgraded to GPT-4o for highest quality
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
              ],
              max_tokens: 200, 
              temperature: 0.3, // Lower temperature for more consistent/focused outputs
            }),
          });
  
          if (!response.ok) {
             console.error('OpenAI API Error:', response.status);
             return;
          }
  
          const data = await response.json();
          const result = data.choices?.[0]?.message?.content?.trim();
  
          if (result) {
            // 7. Save to DB (only if logged in)
            if (user) {
               // Fire and forget upsert to avoid blocking UI
               supabase.from('translations').upsert({
                  user_id: user.id,
                  content_id: uniqueId,
                  original_text: text,
                  translated_text: result,
                  target_lang: targetLang,
               }, { onConflict: 'user_id,content_id,target_lang' }).then(({ error }) => {
                   if (error) console.error('Failed to save translation', error);
               });
            }
  
            // 8. Update caches
            memoryCache[cacheKey] = result;
            try { sessionStorage.setItem(cacheKey, result); } catch {}
  
            if (mounted) setTranslatedText(result);
          }
        }); // End of enqueueRequest
      } catch (err) {
        console.error('Auto Translate Error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchTranslation();

    return () => {
      mounted = false;
    };
  }, [text, contentId, targetLang]);

  return { translatedText, isLoading };
}
