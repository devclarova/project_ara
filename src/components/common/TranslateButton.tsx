import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { SignInModal } from '@/components/auth/SignInModal';
import { toast } from 'sonner';

interface TranslateButtonProps {
  text: string;
  contentId: string;
  setTranslated: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const GUEST_TRANSLATION_LIMIT = 3;
const GUEST_TRANSLATION_COUNT_KEY = 'guest-translation-count';

export default function TranslateButton({
  text,
  contentId,
  setTranslated,
  size = 'md',
}: TranslateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  const sizeMap = {
    sm: {
      button: 'w-7 h-7',
      icon: 'text-sm',
    },
    md: {
      button: 'w-9 h-9',
      icon: 'text-lg',
    },
    lg: {
      button: 'w-11 h-11',
      icon: 'text-xl',
    },
  };

  // 사용자 타겟 언어 가져오기 (언어 선택 기반)
  const getUserTargetLang = async () => {
    // i18n에서 선택된 언어 사용
    return i18n.language || 'en';
  };

  // 의미 없는 문자 감지
  const detectLanguage = async (inputText: string) => {
    // 서버리스/로컬 API 사용 (보안 강화)
    try {
        const response = await fetch('/api/detect-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: inputText }),
        });
    
        if (!response.ok) {
          console.error('Language detection failed');
          return 'invalid';
        }
    
        const data = await response.json();
        return data.validation || 'invalid';
    } catch (e) {
        console.error('Language detection error', e);
        return 'invalid';
    }
  };

  // 번역 처리
  const handleTranslate = async () => {
    if (isOpen) {
      setIsOpen(false);
      setTranslated('');
      return;
    }

    setIsOpen(true);
    if (!text.trim()) return;

    // 게스트 번역 제한 체크
    if (!user) {
      const count = Number(localStorage.getItem(GUEST_TRANSLATION_COUNT_KEY) || '0');
      
      if (count >= GUEST_TRANSLATION_LIMIT) {
        setShowLoginModal(true);
        toast.error(t('translation.login_required'));
        setIsOpen(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const authUser = (await supabase.auth.getUser()).data.user;
      const userId = authUser?.id;

      // (1) 타깃 언어 가져오기
      const targetLang = await getUserTargetLang();

      // (2) 캐시 확인 (로그인 사용자만)
      if (userId) {
        const { data: existing } = await supabase
          .from('translations')
          .select('translated_text')
          .eq('content_id', contentId)
          .eq('user_id', userId)
          .eq('target_lang', targetLang)
          .maybeSingle();

        if (existing) {
          setTranslated(existing.translated_text);
          setIsLoading(false);
          return;
        }
      }

      // (3) 의미 없는 문장 검출
      const validation = await detectLanguage(text);
      if (validation !== 'valid') {
        setTranslated('의미를 파악할 수 없어 번역할 수 없는 문장입니다.');
        return;
      }

      // (4) URL 추출
      const urls = text.match(/https?:\/\/\S+/g) || [];

      // (5) 번역 API 요청
      let translatedText: string;

      // 서버리스/로컬 API 사용 (항상)
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          urls,
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      translatedText = data.translatedText;

      // (6) 번역 결과 저장 (로그인 사용자만)
      if (userId) {
        await supabase.from('translations').upsert(
          {
            user_id: userId,
            content_id: contentId,
            original_text: text,
            translated_text: translatedText,
            target_lang: targetLang,
          },
          {
            onConflict: 'user_id,content_id,target_lang',
          },
        );
      }

      setTranslated(translatedText);

      // 게스트 번역 카운트 증가
      if (!user) {
        const count = Number(localStorage.getItem(GUEST_TRANSLATION_COUNT_KEY) || '0');
        localStorage.setItem(GUEST_TRANSLATION_COUNT_KEY, String(count + 1));
      }
    } catch (err) {
      console.error(err);
      setTranslated('번역 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation();
          handleTranslate();
        }}
        disabled={isLoading || !text.trim()}
        className={`flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors ${sizeMap[size].button}`}
      >
        {isLoading ? (
          <i
            className={`ri-loader-4-line animate-spin text-gray-600 dark:text-gray-300 ${sizeMap[size].icon}`}
          />
        ) : (
          <i className={`ri-translate-2 text-gray-700 dark:text-gray-200 ${sizeMap[size].icon}`} />
        )}
      </button>

      {/* 게스트 로그인 모달 */}
      {!user && (
        <SignInModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
