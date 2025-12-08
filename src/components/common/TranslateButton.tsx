import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface TranslateButtonProps {
  text: string;
  contentId: string;
  setTranslated: (value: string) => void;
}

export default function TranslateButton({ text, contentId, setTranslated }: TranslateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 의미 없는 문자 감지
  const detectLanguage = async (inputText: string) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
다음 문장이 의미 있는 자연어인지 판별해라.
한국어/영어/기타 문장 → "valid"
의미 없는 랜덤 문자(예: 뷃둙훽뤰줻) → "invalid"
설명 없이 valid 또는 invalid만 출력.
            `,
          },
          { role: 'user', content: inputText },
        ],
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'invalid';
  };

  const handleTranslate = async () => {
    // 토글 OFF → 번역 숨기기
    if (isOpen) {
      setIsOpen(false);
      setTranslated('');
      return;
    }

    setIsOpen(true);

    if (!text.trim()) return;

    setIsLoading(true);

    try {
      // 1) Supabase에서 기존 번역 조회 (캐시 확인)
      const { data: existing } = await supabase
        .from('translations')
        .select('translated_text')
        .eq('content_id', contentId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      // ▶ 기존 번역 존재 → 바로 적용 (API 비용 0원)
      if (existing) {
        setTranslated(existing.translated_text);
        return;
      }

      // 2) 의미 없는 문자 감지
      const validation = await detectLanguage(text);

      if (validation !== 'valid') {
        setTranslated('❗ 의미를 파악할 수 없어 번역할 수 없는 문장입니다.');
        return;
      }

      // 3) URL placeholder 처리
      const urls = text.match(/https?:\/\/\S+/g) || [];
      let replacedText = text;
      urls.forEach((url, index) => {
        replacedText = replacedText.replace(url, `<URL_${index}>`);
      });

      // 4) 번역 API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `
너는 번역가다.
<URL_n> 패턴은 절대 번역하지 말고 그대로 두어라.
설명 없이 번역만 출력한다.
              `,
            },
            { role: 'user', content: replacedText },
          ],
          max_tokens: 200,
        }),
      });

      if (!response.ok) throw new Error('API 요청 실패');

      const data = await response.json();
      let translatedText = data.choices[0].message.content;

      // URL 복원
      urls.forEach((url, index) => {
        translatedText = translatedText.replace(`<URL_${index}>`, url);
      });

      // 5) 번역 결과 Supabase 저장
      const user = (await supabase.auth.getUser()).data.user;

      await supabase.from('translations').insert({
        user_id: user?.id,
        content_id: contentId,
        original_text: text,
        translated_text: translatedText,
      });

      // 6) UI에 반영
      setTranslated(translatedText);
    } catch (err) {
      console.error(err);
      setTranslated('번역 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={e => {
        e.stopPropagation();
        handleTranslate();
      }}
      disabled={isLoading || !text.trim()}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors
"
    >
      {isLoading ? (
        <i className="ri-loader-4-line text-lg animate-spin text-gray-600 dark:text-gray-300" />
      ) : (
        <i className="ri-translate-2 text-lg text-gray-700 dark:text-gray-200" />
      )}
    </button>
  );
}
