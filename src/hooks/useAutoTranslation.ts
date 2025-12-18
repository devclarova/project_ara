import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// 간단한 캐시 객체 (페이지 내 중복 요청 방지)
const memoryCache: Record<string, string> = {};

export function useAutoTranslation(text: string, contentId: string, targetLang: string) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchTranslation() {
      if (!text || !contentId || !targetLang) return;

      // 한국어인 경우 번역 스킵 (원본 사용) -> null 반환 시 호출부에서 원본 사용함
      if (targetLang === 'ko' || targetLang === 'ko-KR') {
          if (mounted) {
              setTranslatedText(null);
              setIsLoading(false);
          }
          return;
      }

      // 이미 번역된 결과가 메모리에 있다면
      const cacheKey = `${contentId}_${targetLang}`;
      if (memoryCache[cacheKey]) {
        if (mounted) setTranslatedText(memoryCache[cacheKey]);
        return;
      }

      setIsLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Supabase Translations 테이블 조회
        const { data: existing } = await supabase
          .from('translations')
          .select('translated_text')
          .eq('content_id', contentId)
          .eq('target_lang', targetLang)
          .maybeSingle();

        if (existing) {
          memoryCache[cacheKey] = existing.translated_text;
          if (mounted) {
            setTranslatedText(existing.translated_text);
            setIsLoading(false);
          }
          return;
        }

        // 2. OpenAI 번역 요청
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
           console.warn('OpenAI API Key missing');
           return;
        }

        // 언어 코드를 전체 언어 이름으로 매핑
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

        // 일본어 번역 특별 가이드라인
        const japaneseGuideline = targetLang === 'ja' 
          ? '\n- For Japanese: Use hiragana (ひらがな) and katakana (カタカナ) as much as possible. Minimize the use of kanji (漢字). Prefer simpler, more accessible Japanese.'
          : '';

        // System Prompt - 더 상세하고 컨텍스트를 제공
        const systemPrompt = `You are a professional translator specializing in Korean language learning content and K-culture (K-dramas, K-pop, Korean entertainment).

Target Language: ${targetLanguageName}

Instructions:
- Translate the given text into natural, fluent ${targetLanguageName}
- Preserve the original meaning and nuance
- Use appropriate terminology for Korean language learning and K-culture context
- Keep proper nouns (names, titles) in their original form when appropriate
- Output ONLY the translated text without any additional explanation or decoration${japaneseGuideline}

Context: This is content from a Korean language learning platform using K-drama, K-pop, and Korean entertainment.`;

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
            max_tokens: 200, 
          }),
        });

        if (!response.ok) {
           console.error('OpenAI API Error:', response.status);
           return;
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim();

        if (result) {
          // 3. 저장 (로그인 유저만)
          if (user) {
             await supabase.from('translations').upsert({
                user_id: user.id,
                content_id: contentId,
                original_text: text,
                translated_text: result,
                target_lang: targetLang,
             }, { onConflict: 'user_id,content_id,target_lang' });
          }

          memoryCache[cacheKey] = result;
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
