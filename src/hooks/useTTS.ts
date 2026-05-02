import { useState } from 'react';

const isLocal = !!import.meta.env.VITE_GOOGLE_TTS_API_KEY;

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakWord = async (
    text: string,
    lang: string = 'ko-KR',
    options?: { onStart?: () => void; onEnd?: () => void }
  ) => {
    if (!text) return;

    try {
      let audioBase64 = '';

      // 1. API 호출 (서버 사이드에서 캐시 처리됨)
      // 로컬 환경이고 VITE_GOOGLE_TTS_API_KEY가 있으면 직접 호출 가능하지만, 
      // 캐시 일관성을 위해 가급적 /api/tts 프록시를 통하는 것이 유리함.
      // 여기서는 배포/로컬 모두 /api/tts를 우선 시도하도록 통합함.
      
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      if (res.ok) {
        const data = await res.json();
        audioBase64 = data.audioContent;
      } else if (isLocal) {
        // /api/tts 호출 실패 시 로컬 환경이라면 Google TTS 직접 호출 시도 (Fallback)
        const localRes = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${import.meta.env.VITE_GOOGLE_TTS_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: { 
                languageCode: lang, 
                name: lang === 'ko-KR' ? 'ko-KR-Neural2-A' : undefined,
                ssmlGender: 'FEMALE' 
              },
              audioConfig: { audioEncoding: 'MP3' },
            }),
          }
        );
        if (localRes.ok) {
          const localData = await localRes.json();
          audioBase64 = localData.audioContent;
        }
      }

      if (!audioBase64) throw new Error('no_audio_content');

      // 2. Audio 재생
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      
      audio.onplay = () => {
        setIsSpeaking(true);
        options?.onStart?.();
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };

      await audio.play();
    } catch (err) {
      // 폴백: Web Speech API (오류 노출 없이 조용히 전환)
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.9;
      
      utter.onstart = () => {
        setIsSpeaking(true);
        options?.onStart?.();
      };
      
      utter.onend = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      
      utter.onerror = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utter);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel?.();
    setIsSpeaking(false);
  };

  return { speakWord, isSpeaking, stopSpeaking };
}
