/**
 * 고성능 대량 자동 번역 엔진(High-Performance Batch Auto-Translation Engine):
 * - 목적(Why): 다수의 텍스트 항목을 한 번의 API 호출로 번역하여 네트워크 오버헤드를 최소화하고 사용자 경험을 개선함
 * - 방법(How): Supabase DB 캐시를 선제적으로 조회하여 불필요한 API 호출을 방지하고, 로컬 서버의 배치 번역 엔드포인트를 통해 원자적 번역 처리를 수행함
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queuedFetch } from '../lib/translationQueue';

const BATCH_TRANSLATION_VERSION = 'v8_pron_fixed';
const PRONUNCIATION_TRANSLATION_VERSION = 'v21_pron_policy_v1';
const VI_PRONUNCIATION_TRANSLATION_VERSION = 'v23_pron_policy_vi_v1';
const ZH_PRONUNCIATION_TRANSLATION_VERSION = 'v23_pron_policy_zh_v2';

const isPronunciationCacheKey = (key: string) =>
  key.startsWith('voca_pron_') || key.startsWith('subtitle_pron_');

const isVietnameseTarget = (lang: string) =>
  lang.toLowerCase() === 'vi' || lang.toLowerCase() === 'vi-vn';

const isChineseTarget = (lang: string) => {
  const normalized = lang.toLowerCase();
  return normalized === 'zh' || normalized === 'zh-cn';
};

const getTranslationVersion = (key: string, lang: string) => {
  if (isPronunciationCacheKey(key)) {
    if (isVietnameseTarget(lang)) {
      return VI_PRONUNCIATION_TRANSLATION_VERSION;
    }
    if (isChineseTarget(lang)) {
      return ZH_PRONUNCIATION_TRANSLATION_VERSION;
    }
    return PRONUNCIATION_TRANSLATION_VERSION;
  }
  return BATCH_TRANSLATION_VERSION;
};

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
        const uniqueKeys = cacheKeyInfos.map(k => `${k}_${getTranslationVersion(k, targetLang)}`);

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
        if (afterLocalCache.length > 0) {
            const keysToQuery = afterLocalCache.map(i => uniqueKeys[i]);
            type TranslationCacheRow = {
              content_id: string;
              translated_text: string | null;
              user_id: string | null;
            };

            const { data: cachedData } = await (supabase.from('translations') as any)
              .select('content_id, translated_text, user_id')
              .in('content_id', keysToQuery)
              .eq('target_lang', targetLang);

            const typedRows = (cachedData || []) as TranslationCacheRow[];
            const personalCacheKeys = new Set<string>();

            cacheMap = typedRows.reduce((acc: Record<string, string>, curr) => {
              if (!curr.content_id || !curr.translated_text) return acc;

              const isPersonal = Boolean(user && curr.user_id === user.id);
              const isPublic = curr.user_id == null;

              if (isPersonal) {
                acc[curr.content_id] = curr.translated_text;
                personalCacheKeys.add(curr.content_id);
                return acc;
              }

              if (isPublic && !personalCacheKeys.has(curr.content_id) && !acc[curr.content_id]) {
                acc[curr.content_id] = curr.translated_text;
              }

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

        // 3. Sequential Batch Processing — chunk 단위 순차 처리로 OpenAI 429 rate limit 방지
        const CHUNK_SIZE = 40;
        const chunks: string[][] = [];
        for (let i = 0; i < inputsToTranslate.length; i += CHUNK_SIZE) {
            chunks.push(inputsToTranslate.slice(i, i + CHUNK_SIZE));
        }

        const allChunkResults: string[][] = [];
        for (const chunk of chunks) {
            const r = await queuedFetch('/api/translate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    texts: chunk, 
                    targetLang,
                    contentIds: missingIndices.slice(allChunkResults.flat().length, allChunkResults.flat().length + chunk.length).map(i => uniqueKeys[i])
                }),
            });
            if (!r.ok) throw new Error(`API Error: ${r.status}`);
            const data = await r.json();
            allChunkResults.push(data.translations as string[]);
        }

        const parsedResults = allChunkResults.flat();
        
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
             console.warn('Mismatch in translation count', inputsToTranslate.length, parsedResults.length);
             // 응답받은 만큼만 적용 (인덱스 범위 내에서 처리)
             const upsertData: any[] = [];
             missingIndices.forEach((originalIdx, i) => {
                const tr = parsedResults[i]; // 범위 초과 시 undefined
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
             if (upsertData.length > 0) {
                 (supabase.from('translations') as any).upsert(upsertData, {
                     onConflict: 'user_id,content_id,target_lang'
                 }).then(({ error }: any) => {
                     if (error) console.error('Batch save error:', error);
                 });
             }
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
