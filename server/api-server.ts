import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, urls = [] } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // URL placeholder 처리
    let replacedText = text;
    urls.forEach((url: string, index: number) => {
      replacedText = replacedText.replace(url, `<URL_${index}>`);
    });

    // 번역 프롬프트
    const systemPrompt = `
너는 전문 번역가다.
사용자의 국가 언어 코드: "${targetLang}"
텍스트를 반드시 이 언어("${targetLang}")로 번역하라.
<URL_n> 패턴은 절대 변경 금지.
설명 없이 번역만 출력하라.
    `;

    // OpenAI API 호출
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
          { role: 'user', content: replacedText },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Translation API error' });
    }

    const data = await response.json();
    let translatedText = data.choices[0].message.content;

    // URL 복원
    urls.forEach((url: string, index: number) => {
      translatedText = translatedText.replace(`<URL_${index}>`, url);
    });

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Language detection API endpoint
app.post('/api/detect-language', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text field' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const systemPrompt = `
다음 문장이 의미 있는 자연어인지 판별해라.
한국어/영어/기타 문장 → "valid"
의미 없는 랜덤 문자(예: 뷃둙훽뤰줻) → "invalid"
설명 없이 valid 또는 invalid만 출력.
    `;

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
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Detection API error' });
    }

    const data = await response.json();
    const validation = data.choices?.[0]?.message?.content?.trim() || 'invalid';

    return res.status(200).json({ validation });
  } catch (error) {
    console.error('Language detection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Helper Data ---
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
  'id': 'Indonesian',
  'it': 'Italian',
  'tr': 'Turkish',
};

// Batch Translation Endpoint
app.post('/api/translate-batch', async (req, res) => {
  try {
    const { texts, targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const targetLanguageName = langCodeToName[targetLang] || targetLang;

    const systemPrompt = `You are a high-performance translation engine for a language learning app.
Target Language: ${targetLanguageName} (Code: ${targetLang})
Context: Korean Subtitles, K-Pop Lyrics, K-Drama.

Output Format: JSON Object with key "translations" containing an Array of Strings.
Example: { "translations": ["Translated Text 1", "Translated Text 2"] }

CRITICAL TRANSLATION RULES (Follow Strictly):
1. **Target Language Only**: The output MUST be in **${targetLanguageName}**. 
   - If the input is English, **TRANSLATE** it to ${targetLanguageName}. Do NOT keep it in English (unless Target is English).
   - If the input is Korean, **TRANSLATE** it to ${targetLanguageName}.
2. **PRONUNCIATION (Romanization) HANDLING (HIGHEST PRIORITY)**:
   - **Scenario A (Bracketed)**: Input contains '[Romanization]'.
     - Action: Transliterate content inside '[]' to Target Script (Sound Only). **No Meaning Translation.**
   - **Scenario B (Raw/Unbracketed)**: Input is ONLY Romanized Korean (e.g. "Saranghae", "Annyeong").
     - Action: **Transliterate** to Target Script (Sound Only).
     - **Strict Rule**: NEVER translate the meaning of Romanized Korean.
     - **Bad Example**: "Saranghae" -> "I Love You" (Wrong! Meaning)
     - **Good Example (JA)**: "Saranghae" -> "サランヘ" (Correct! Sound)
     - **Good Example (RU)**: "Annyeong" -> "Аннён" (Correct! Sound)
3. **NO KOREAN CHARACTERS**: The output MUST NOT contain any Korean characters (Hangul).
4. **NO QUOTES**: Do NOT wrap strings in extra quotes inside the JSON array.
5. **Music Titles**:
   - If input is "Artist - Title", output "Artist - Translated Title".
   - If input is ONLY "Title", output "Translated Title". Do NOT add artist.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ texts }) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ error: 'OpenAI API Error' });
    }

    const data = await response.json();
    const contentStr = data.choices[0].message.content;
    let parsedResults: string[] = [];
    
    try {
        const parsed = JSON.parse(contentStr);
        if (parsed.translations && Array.isArray(parsed.translations)) {
            parsedResults = parsed.translations;
        } else if (Array.isArray(parsed)) {
            parsedResults = parsed;
        } else {
             // Fallback
             const firstArray = Object.values(parsed).find(v => Array.isArray(v));
             if (firstArray) parsedResults = firstArray as string[];
        }
    } catch (e) {
        console.error('Failed to parse JSON response', e);
        return res.status(500).json({ error: 'JSON Parse Error' });
    }

    return res.status(200).json({ translations: parsedResults });

  } catch (error) {
    console.error('Batch translation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Single Translation Endpoint
app.post('/api/translate-single', async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const targetLanguageName = langCodeToName[targetLang] || targetLang;
    const japaneseGuideline = targetLang === 'ja' 
      ? '\n- For Japanese: Use hiragana (ひらがな) and katakana (カタカナ) as much as possible. Minimize the use of kanji (漢字). Prefer simpler, more accessible Japanese.'
      : '';

    const systemPrompt = `You are an expert translator and localization specialist for a premium Korean language learning platform.
Target Language: ${targetLanguageName} (Code: ${targetLang})

Your goal is to provide **natural, fluently written translations** that sound like they were written by a native speaker of the target language.

CRITICAL RULES:
1. **TARGET LANGUAGE ONLY**: The output MUST be in **${targetLanguageName}**. 
   - If the input is English, **TRANSLATE** it to ${targetLanguageName}. Do NOT keep it in English (unless Target is English).
   - If the input is Korean, **TRANSLATE** it to ${targetLanguageName}.
2. **PRONUNCIATION (Romanization) HANDLING (HIGHEST PRIORITY)**:
   - **Scenario A (Bracketed)**: Input contains '[Romanization]'.
     - Action: Transliterate content inside '[]' to Target Script (Sound Only). **No Meaning Translation.**
   - **Scenario B (Raw/Unbracketed)**: Input is ONLY Romanized Korean (e.g. "Saranghae", "Annyeong").
     - Action: **Transliterate** to Target Script (Sound Only).
     - **Strict Rule**: NEVER translate the meaning of Romanized Korean.
     - **Bad Example**: "Saranghae" -> "I Love You" (Wrong! Meaning)
     - **Good Example (JA)**: "Saranghae" -> "サランヘ" (Correct! Sound)
     - **Good Example (RU)**: "Annyeong" -> "Аннён" (Correct! Sound)
3. **NO KOREAN CHARACTERS**: The output MUST NOT contain any Korean characters (Hangul). If you see Korean, translate it completely.
4. **NO QUOTES**: Do NOT wrap the translation in quotation marks (single ' or double "). Return only the clean text.
5. **Music Titles**:
   - **Format Preservation**: 
     - If input is "Artist - Title", output "Artist - Translated Title".
     - If input is ONLY "Title" (no artist), output ONLY "Translated Title". **DO NOT ADD THE ARTIST NAME.**
   - **Artist**: Use official name (e.g., "IU", "BTS").
   - **Title**: Use official title **in the Target Language Script**.
     - If the title is English (e.g. "Love Poem") and Target is NOT English: **Transliterate or Translate** it (e.g. "Love Poem" -> "ラブ·ポエム" for Japanese). **Do NOT keep it in English alphabet.**
   - Example: "밤편지" -> "Through the Night" (for English).
   - Example: "Love Poem" -> "ラブ·ポエム" (for Japanese).
6. **English Input Handling**:
   - If the input is already in English (e.g. "Crush - Beautiful", "Drama Title"), but the Target Language is NOT English (e.g. Japanese, Spanish), you MUST translate/transliterate it to the target language.
   - Do NOT just copy the English input unless the target language uses English titles officially.
7. **Mixed Input Handling**: 
   - Input: "내 손을 잡아 (Hold My Hand)"
   - Instruction: Translate content into a single clean title in the target language.
8. **Naturalness**: Avoid robotic literal translations. Use correct grammar, casing, and spacing.
9. **Context**: K-Drama, K-Pop, Movie titles.

${japaneseGuideline}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: 200, 
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
       console.error('OpenAI API Error:', response.status);
       return res.status(response.status).json({ error: 'OpenAI API Error' });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ translatedText: result });
  } catch (error) {
    console.error('Single translation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
});
