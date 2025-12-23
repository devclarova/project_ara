import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const BATCH_TRANSLATION_VERSION = 'v3_local_api';

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
      const { data: { user } } = await supabase.auth.getUser();

      try {
        const uniqueKeys = cacheKeyInfos.map(k => `${k}_${BATCH_TRANSLATION_VERSION}`);

        // 2. Check DB Cache
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
            
            if (cacheMap[uniqueId]) {
                finalResults[idx] = cacheMap[uniqueId];
            } else if (text && text.trim()) {
                missingIndices.push(idx);
            } else {
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

        // 3. call Local Server API
        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              texts: inputsToTranslate,
              targetLang
            }),
        });

        if (!response.ok) {
            throw new Error(`Translation API Error: ${response.status}`);
        }

        const data = await response.json();
        const parsedResults = data.translations; // Expect { translations: [] }
        
        if (!parsedResults || !Array.isArray(parsedResults)) {
             throw new Error('Invalid API Response Format');
        }

        // Apply results
        if (parsedResults.length === inputsToTranslate.length) {
             const upsertData: any[] = [];

             missingIndices.forEach((originalIdx, i) => {
                const tr = parsedResults[i];
                if (tr) {
                    finalResults[originalIdx] = tr;
                    
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

             // 4. Save to DB
             if (upsertData.length > 0) {
                 supabase.from('translations').upsert(upsertData, { 
                     onConflict: 'user_id,content_id,target_lang' 
                 }).then(({ error }) => {
                     if (error) console.error('Batch save error:', error);
                 });
             }

        } else {
             console.error('Mismatch in translation count', inputsToTranslate.length, parsedResults.length);
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
