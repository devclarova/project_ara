/**
 * 고성능 대량 자동 번역 엔진(High-Performance Batch Auto-Translation Engine):
 * - 목적(Why): 다수의 텍스트 항목을 한 번의 API 호출로 번역하여 네트워크 오버헤드를 최소화하고 사용자 경험을 개선함
 * - 방법(How): Supabase DB 캐시를 선제적으로 조회하여 불필요한 API 호출을 방지하고, 로컬 서버의 배치 번역 엔드포인트를 통해 원자적 번역 처리를 수행함
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const BATCH_TRANSLATION_VERSION = 'v6_enhanced_quality';

const batchMemoryCache: Record<string, string> = {};

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

    // 🔄 Ensure state length matches new texts length to avoid index mismatch errors
    setTranslatedTexts(new Array(texts.length).fill(null));

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
        const finalResults = new Array(texts.length).fill(null);

        // Phase 1: 메모리 + sessionStorage 캐시 즉시 적용 (네트워크 0회)
        const afterLocalCache: number[] = [];
        texts.forEach((text, idx) => {
            const uniqueId = uniqueKeys[idx];
            const memoryKey = `${uniqueId}_${targetLang}`;
            if (batchMemoryCache[memoryKey]) {
                finalResults[idx] = batchMemoryCache[memoryKey];
            } else {
                try {
                    const stored = sessionStorage.getItem(`ara_bt_${memoryKey}`);
                    if (stored) {
                        finalResults[idx] = stored;
                        batchMemoryCache[memoryKey] = stored;
                    } else {
                        afterLocalCache.push(idx);
                    }
                } catch { afterLocalCache.push(idx); }
            }
        });

        // 로컬 캐시 히트분 즉시 반영
        if (mounted) setTranslatedTexts([...finalResults]);

        // Phase 2: DB 캐시 조회 (미번역 항목만)
        let cacheMap: Record<string, string> = {};
        if (user && afterLocalCache.length > 0) {
            const keysToQuery = afterLocalCache.map(i => uniqueKeys[i]);
            const { data: cachedData } = await (supabase.from('translations') as any)
              .select('content_id, translated_text')
              .in('content_id', keysToQuery)
              .eq('target_lang', targetLang);
            cacheMap = (cachedData || []).reduce((acc: Record<string, string>, curr: any) => {
              acc[curr.content_id] = curr.translated_text;
              return acc;
            }, {} as Record<string, string>);
        }

        // DB 히트분 반영 + 최종 미번역 목록 산출
        const missingIndices: number[] = [];
        afterLocalCache.forEach(idx => {
            const uniqueId = uniqueKeys[idx];
            const memoryKey = `${uniqueId}_${targetLang}`;
            if (cacheMap[uniqueId]) {
                const val = cacheMap[uniqueId];
                finalResults[idx] = val;
                batchMemoryCache[memoryKey] = val;
                try { sessionStorage.setItem(`ara_bt_${memoryKey}`, val); } catch {}
            } else if (texts[idx] && texts[idx].trim()) {
                missingIndices.push(idx);
            } else {
                finalResults[idx] = texts[idx];
            }
        });

        // DB 히트분 즉시 반영
        if (mounted && afterLocalCache.length > 0) setTranslatedTexts([...finalResults]);

        // If everything is cached or empty, we are done
        if (missingIndices.length === 0) {
          if (mounted) {
            setTranslatedTexts(finalResults);
            setLoading(false);
          }
          return;
        }

        const inputsToTranslate = missingIndices.map(i => texts[i]);

        // 3. Parallel Batch Processing — Split large batches into smaller chunks for faster OpenAI parallel inference
        const CHUNK_SIZE = 15;
        const chunks: string[][] = [];
        for (let i = 0; i < inputsToTranslate.length; i += CHUNK_SIZE) {
            chunks.push(inputsToTranslate.slice(i, i + CHUNK_SIZE));
        }

        const chunkPromises = chunks.map(chunk => 
            fetch('/api/translate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: chunk, targetLang }),
            }).then(async r => {
                if (!r.ok) throw new Error(`API Error: ${r.status}`);
                const data = await r.json();
                return data.translations as string[];
            })
        );

        const chunkedResults = await Promise.all(chunkPromises);
        const parsedResults = chunkedResults.flat();
        
        if (parsedResults.length === inputsToTranslate.length) {
             const upsertData: any[] = [];

             missingIndices.forEach((originalIdx, i) => {
                const tr = parsedResults[i];
                if (tr) {
                    finalResults[originalIdx] = tr;
                    const mk = `${uniqueKeys[originalIdx]}_${targetLang}`;
                    batchMemoryCache[mk] = tr;
                    try { sessionStorage.setItem(`ara_bt_${mk}`, tr); } catch {}
                    
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
                 (supabase.from('translations') as any).upsert(upsertData, { 
                     onConflict: 'user_id,content_id,target_lang' 
                 }).then(({ error }: any) => {
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
