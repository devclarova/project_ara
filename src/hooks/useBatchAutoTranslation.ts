import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const BATCH_TRANSLATION_VERSION = 'v2_force_target';

interface UseBatchAutoTranslationResult {
  translatedTexts: (string | null)[];
  loading: boolean;
  error: unknown;
}

export const useBatchAutoTranslation = (
  texts: string[], // 번역할 텍스트 배열
  cacheKeyInfos: string[], // 각 텍스트에 매칭되는 유니크 키
  targetLang: string
): UseBatchAutoTranslationResult => {
  const [translatedTexts, setTranslatedTexts] = useState<(string | null)[]>(
    new Array(texts.length).fill(null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // 중복 요청 방지
  const processingRef = useRef<string>('');

  useEffect(() => {
    let mounted = true;

    // 1. 유효성 검사
    if (!texts || texts.length === 0 || !targetLang) {
      setTranslatedTexts([]);
      return;
    }

    // 한국어 타겟이면 번역 불필요 (원본 그대로 리턴)
    if (targetLang === 'ko' || targetLang === 'ko-KR') {
      setTranslatedTexts(texts);
      return;
    }

    const currentProcessKey = texts.join('|') + targetLang;
    if (processingRef.current === currentProcessKey) return;
    processingRef.current = currentProcessKey;

    const translateBatch = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      // 0. Get User (needed for DB operations)
      // Guests will skip DB read/write to avoid schema/policy errors
      const { data: { user } } = await supabase.auth.getUser();

      try {
        // Prepare unique IDs (content_id) with version appended
        // This matches the schema used in useAutoTranslation: `${contentId}_${TRANSLATION_VERSION}`
        const uniqueKeys = cacheKeyInfos.map(k => `${k}_${BATCH_TRANSLATION_VERSION}`);

        // 2. Check DB Cache (Only if logged in)
        // If guest, we skip DB cache check (relying on memory/session cache or fresh API call)
        // Note: For now, guests will always hit OpenAI on refresh. 
        // Improvement: Implement session storage caching for batch results.
        const finalResults = [...translatedTexts];
        let cacheMap: Record<string, string> = {};

        if (user) {
             const { data: cachedData } = await supabase
               .from('translations')
               .select('content_id, translated_text')
               .in('content_id', uniqueKeys)
               .eq('target_lang', targetLang);
             
             cacheMap = (cachedData || []).reduce((acc, curr) => {
               acc[curr.content_id] = curr.translated_text; 
               return acc;
             }, {} as Record<string, string>);
        }

        // Identify missing items
        const missingIndices: number[] = [];
        texts.forEach((text, idx) => {
            const uniqueId = uniqueKeys[idx];
            
            // Priority 1: DB Cache (if found)
            if (cacheMap[uniqueId]) {
                finalResults[idx] = cacheMap[uniqueId];
            } else if (text && text.trim()) {
                // Priority 2: Needs Translation
                missingIndices.push(idx);
            } else {
                // Priority 3: Empty string
                finalResults[idx] = text; 
            }
        });

        // If everything is cached or empty, we are done
        if (missingIndices.length === 0) {
          if (mounted) {
            setTranslatedTexts(finalResults);
            setLoading(false);
          }
          return;
        }

        const inputsToTranslate = missingIndices.map(i => texts[i]);

        // 3. OpenAI API Call
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
           console.error('OpenAI API Key missing');
           if (mounted) setLoading(false);
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
            'id': 'Indonesian',
            'it': 'Italian',
            'tr': 'Turkish',
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
     - Action: Transliterate content inside '[]' to Target Script (Sound Only). **No Meaning Translation.**
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
                { role: 'user', content: JSON.stringify({ texts: inputsToTranslate }) }, // Wrap in object for clarity
              ],
              response_format: { type: "json_object" },
              temperature: 0.3,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.status}`);
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
                 console.warn('Unexpected JSON structure', parsed);
                 // Fallback: try to find any array
                 const firstArray = Object.values(parsed).find(v => Array.isArray(v));
                 if (firstArray) parsedResults = firstArray as string[];
            }
        } catch (e) {
            console.error('Failed to parse JSON response', e);
        }

        // Apply results
        if (parsedResults.length === inputsToTranslate.length) {
             const upsertData: any[] = [];

             missingIndices.forEach((originalIdx, i) => {
                const tr = parsedResults[i];
                if (tr) {
                    finalResults[originalIdx] = tr;
                    
                    // Prepare DB data
                    if (user) {
                        upsertData.push({
                            user_id: user.id,
                            content_id: uniqueKeys[originalIdx], 
                            original_text: texts[originalIdx],   
                            translated_text: tr,
                            target_lang: targetLang
                        });
                    }
                }
             });

             if (mounted) setTranslatedTexts([...finalResults]);

             // 4. Save to DB (Fire and forget, only if user exists)
             if (upsertData.length > 0) {
                 supabase.from('translations').upsert(upsertData, { 
                     onConflict: 'user_id,content_id,target_lang' 
                 }).then(({ error }) => {
                     if (error) console.error('Batch save error:', error);
                 });
             }

        } else {
             console.error('Mismatch in translation count', inputsToTranslate.length, parsedResults.length);
             // Partial persistence could be dangerous if indices differ, so we skip DB save
        }

      } catch (err) {
        console.error('Batch Translation Failed', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    translateBatch();

    return () => {
        mounted = false;
    };

  }, [texts.join(','), targetLang]);

  return { translatedTexts, loading, error };
};
