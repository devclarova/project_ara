/**
 * 지능형 자동 번역 및 캐싱 엔진(Intelligent Auto-Translation & Caching Engine):
 * - 목적(Why): 다국어 학습 환경에서 학습 콘텐츠와 사용자 메시지를 실시간으로 번역하여 언어 장벽을 해소함
 * - 방법(How): 로컬 서버 API와 Supabase 번역 DB를 연동한 2단계 캐싱(Memory/Session/DB)을 수행하며, 동시성 제어(Concurrency Limiter)를 통해 API 과호출을 방지함
 */
import { supabase } from '@/lib/supabase';
import { queuedFetch } from '@/lib/translationQueue';
import { useEffect, useState } from 'react';

// 간단한 캐시 객체
const memoryCache: Record<string, string> = {};

const TRANSLATION_VERSION = 'v20_pron_fixed'; // 발음 전사 고도화 + 레이아웃 안정화 버전
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
  return TRANSLATION_VERSION;
};

export function useAutoTranslation(text: string, contentId: string, targetLang: string) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 버전이 적용된 ID
  const uniqueId = `${contentId}_${getTranslationVersion(contentId, targetLang)}`;

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
          if (!mounted) return;

          const { data: { user } } = await supabase.auth.getUser();

          // 5. Check Supabase (DB Cache)
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

          // 6. Call Local Server API — queuedFetch가 동시 요청 제한 + 429 retry 처리
          const response = await queuedFetch('/api/translate-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang }),
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
