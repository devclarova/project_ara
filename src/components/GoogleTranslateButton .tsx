import React, { useEffect, useState } from 'react';

const GoogleTranslateButton = () => {
  const [isTranslateVisible, setTranslateVisible] = useState(false);

  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'ko', // 기본 언어 설정 (여기선 한국어)
        autoDisplay: true, // 자동 번역 기능 활성화
        includedLanguages: 'en,ko,es,fr,de', // 지원할 언어 목록
      },
      'google_translate_element',
    );
  };

  const loadTranslateScript = () => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (isTranslateVisible) {
      loadTranslateScript();
    }

    return () => {
      const script = document.querySelector(
        'script[src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]',
      );
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [isTranslateVisible]);

  const handleClick = () => {
    setTranslateVisible(!isTranslateVisible);
  };

  return (
    <div>
      <button onClick={handleClick}>{isTranslateVisible ? '번역 숨기기' : '번역 보기'}</button>

      {/* 구글 번역 위젯을 표시할 div */}
      {isTranslateVisible && <div id="google_translate_element"></div>}
    </div>
  );
};

export default GoogleTranslateButton;
