import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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
      // 1. DB 캐시 확인 (Supabase)
      const { data: cached } = await (supabase.from('tts_cache') as any)
        .select('audio_base64')
        .eq('text_key', text)
        .eq('lang', lang)
        .maybeSingle();

      let audioBase64 = cached?.audio_base64;

      // 2. 캐시 미스 시 API 호출
      if (!audioBase64) {
        if (isLocal) {
          // 로컬 환경: Google Cloud TTS 직접 호출
          const res = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${import.meta.env.VITE_GOOGLE_TTS_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                input: { text },
                voice: { languageCode: lang, ssmlGender: 'FEMALE' },
                audioConfig: { audioEncoding: 'MP3' },
              }),
            }
          );
          if (!res.ok) throw new Error('local_api_failed');
          const data = await res.json();
          audioBase64 = data.audioContent;
        } else {
          // 배포 환경: Vercel API Route 호출
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, lang }),
          });
          if (!res.ok) throw new Error('server_api_failed');
          const data = await res.json();
          audioBase64 = data.audioContent;
        }

        // 3. 신규 데이터 DB 캐싱
        if (audioBase64) {
          (supabase.from('tts_cache') as any)
            .upsert({
              text_key: text,
              lang,
              audio_base64: audioBase64,
            }, { onConflict: 'text_key,lang' })
            .then(({ error }: any) => {
              if (error) console.error('TTS Cache Save Error:', error);
            });
        }
      }

      if (!audioBase64) throw new Error('no_audio_content');

      // 4. Audio 재생
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
