/**
 * 지능형 자동 번역 및 캐싱 엔진(Intelligent Auto-Translation & Caching Engine):
 * - 목적(Why): 다국어 학습 환경에서 학습 콘텐츠와 사용자 메시지를 실시간으로 번역하여 언어 장벽을 해소함
 * - 방법(How): 로컬 서버 API와 Supabase 번역 DB를 연동한 2단계 캐싱(Memory/Session/DB)을 수행하며, 동시성 제어(Concurrency Limiter)를 통해 API 과호출을 방지함
 */
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// 간단한 캐시 객체
const memoryCache: Record<string, string> = {};

const TRANSLATION_VERSION = 'v14_local_api'; // Bump version

// --- Concurrency Limiter ---
const MAX_CONCURRENCY = 10;
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

      // 4. Check Session Storage
      try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          memoryCache[cacheKey] = stored;
          if (mounted) setTranslatedText(stored);
          return;
        }
      } catch (e) {}

      setIsLoading(true);

      try {
        await enqueueRequest(async () => {
          if (!mounted) return;

          const { data: { user } } = await supabase.auth.getUser();

          // 5. If logged in, check Supabase first
          if (user) {
            const { data: existing } = await (supabase.from('translations') as any)
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

          // 6. Call Local Server API
          const response = await fetch('/api/translate-single', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              targetLang,
            }),
          });
  
          if (!response.ok) {
             console.error('Translation API Error:', response.status);
             return;
          }
  
          const data = await response.json();
          const result = data.translatedText;
  
          if (result) {
            // 7. Save to DB
            if (user) {
               (supabase.from('translations') as any).upsert({
                  user_id: user.id,
                  content_id: uniqueId,
                  original_text: text,
                  translated_text: result,
                  target_lang: targetLang,
               }, { onConflict: 'user_id,content_id,target_lang' }).then(({ error }: any) => {
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
