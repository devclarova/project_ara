import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface TTSCacheRow {
  audio_base64: string;
}

interface TTSRequest {
  text: string;
  lang: string;
}

// Supabase Admin 클라이언트 생성 (service_role 사용)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, lang = 'ko-KR' } = req.body as TTSRequest;

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    // 1. 캐시 확인 (Server-side)
    const { data: cached, error: selectError } = await supabaseAdmin
      .from('tts_cache')
      .select('audio_base64')
      .eq('text_key', text)
      .eq('lang', lang)
      .maybeSingle() as { data: TTSCacheRow | null; error: { message: string } | null };

    if (selectError) {
      console.warn('TTS Cache Select Error:', selectError.message);
    }

    if (cached?.audio_base64) {
      return res.status(200).json({ audioContent: cached.audio_base64 });
    }

    // 2. 캐시 미스 시 Google TTS 호출
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_TTS_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
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

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      return res.status(ttsResponse.status).json({ error: errorData.error?.message || 'TTS API error' });
    }

    const data = await ttsResponse.json();
    const audioContent = data.audioContent;

    // 3. 신규 데이터 캐시 저장 (Admin 권한으로 RLS 우회)
    if (audioContent) {
      const { error: upsertError } = await supabaseAdmin
        .from('tts_cache')
        .upsert(
          { text_key: text, lang, audio_base64: audioContent },
          { onConflict: 'text_key,lang' }
        );

      if (upsertError) {
        console.error('TTS Cache Upsert Error:', upsertError.message);
        // 캐시 저장 실패해도 오디오 결과는 반환함
      }
    }

    return res.status(200).json({ audioContent });
  } catch (error) {
    console.error('TTS proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
