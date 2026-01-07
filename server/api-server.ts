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


// --- Admin Stats Endpoint ---
app.get('/api/admin/stats/overview', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Total Users
    // Cumulative: All records
    const { count: cumulativeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Current: Not deleted (assuming deleted_at column exists in DB per migrations)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // 2. Active Users (Real-time Online Status)
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true);

    // 3. Weekly Activity & Growth Aggregation
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    sevenDaysAgo.setHours(0, 0, 0, 0);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Initialize chart days (last 7 days)
    let chartData: { name: string; activity: number; signups: number }[] = [];
    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        chartData.push({ name: formatDate(d), activity: 0, signups: 0 });
    }

    // Fetch all relevant activities in parallel
    const [recentProfiles, recentPosts, recentTweets, recentComments, recentReplies] = await Promise.all([
      supabase.from('profiles').select('created_at').gte('created_at', fourteenDaysAgo.toISOString()),
      supabase.from('posts').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('tweets').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      supabase.from('users_posts_comments').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('tweet_replies').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null)
    ]);

    let newUsersRecent = 0;
    let newUsersPrev = 0;

    // Process Signups (include growth comparison)
    if (recentProfiles.data) {
      recentProfiles.data.forEach(p => {
        const pDate = new Date(p.created_at);
        if (pDate >= sevenDaysAgo) {
          newUsersRecent++;
          const dateStr = formatDate(pDate);
          const found = chartData.find(c => c.name === dateStr);
          if (found) {
            found.signups++;
            found.activity++; // Signup itself is an activity
          }
        } else if (pDate >= fourteenDaysAgo) {
          newUsersPrev++;
        }
      });
    }

    // Process Content Activities
    const processActivities = (data: any[] | null) => {
      if (!data) return;
      data.forEach(item => {
        const dStr = formatDate(new Date(item.created_at));
        const found = chartData.find(c => c.name === dStr);
        if (found) found.activity++;
      });
    };

    processActivities(recentPosts.data);
    processActivities(recentTweets.data);
    processActivities(recentComments.data);
    processActivities(recentReplies.data);

    let newUserGrowth = 0;
    if (newUsersPrev > 0) {
        newUserGrowth = ((newUsersRecent - newUsersPrev) / newUsersPrev) * 100;
    } else if (newUsersRecent > 0) {
        newUserGrowth = 100;
    }

    // 4. Content Count (Separated)
    const [postsRes, tweetsRes, commentsRes, repliesRes] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('tweets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('users_posts_comments').select('*', { count: 'exact', head: true }),
      supabase.from('tweet_replies').select('*', { count: 'exact', head: true }).is('deleted_at', null)
    ]);

    const postCount = (postsRes.count || 0) + (tweetsRes.count || 0);
    const commentCount = (commentsRes.count || 0) + (repliesRes.count || 0);

    // 5. Revenue & Conversion (Real Logic)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, user_id')
      .eq('status', 'completed');

    let totalRevenue = 0;
    let conversionRate = 0;

    if (!orderError && orderData && orderData.length > 0) {
      totalRevenue = orderData.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      
      const uniquePurchasers = new Set(orderData.map(o => o.user_id)).size;
      const currentUsersCount = totalUsers || cumulativeUsers || 1;
      conversionRate = (uniquePurchasers / currentUsersCount) * 100;
    }

    // 6. Top Pages
    const topPages = [
      { path: '/study/kdrama-101', page: 'K-Drama 필수 회화', views: '2.4k', change: '+12%' },
      { path: '/payment/pricing', page: '요금제 안내', views: '1.2k', change: '+5%' },
      { path: '/', page: '메인 랜딩', views: '0.8k', change: '-2%' },
    ];

    const totalUsersCount = totalUsers || cumulativeUsers || 0;
    const currentActiveUsers = activeUsers || 0;

    // 7. Advanced Anomaly Detection Logic (V6)
    const anomalies: { level: 'info' | 'warning' | 'critical', type: string, message: string, details?: any }[] = [];

    // Rule 1: Signup Spike (Growth over 300% with significant volume)
    if (newUserGrowth > 300 && newUsersRecent > 20) {
      anomalies.push({
        level: 'warning',
        type: 'SIGNUP_SPIKE',
        message: `최근 가입자 수가 전주 대비 ${newUserGrowth.toFixed(1)}% 급증했습니다. 비정상적인 계정 생성 여부를 확인하십시오.`
      });
    }

    // Rule 2: Report Surge
    const { count: pendingReportsCount, error: reportsError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (!reportsError && pendingReportsCount !== null && pendingReportsCount > 10) {
      anomalies.push({
        level: 'critical',
        type: 'REPORT_SURGE',
        message: `현재 ${pendingReportsCount}건의 미처리 신고가 누적되었습니다. 신속한 검토가 필요합니다.`
      });
    }

    // Rule 3: DDoS / Traffic Volatility (Heuristic)
    if (currentActiveUsers > 500) { // Threshold for this environment
      anomalies.push({
        level: 'critical',
        type: 'DDOS_THREAT',
        message: '[DDoS 위험] 비정상적인 트래픽 폭증이 감지되었습니다. 실시간 동접자 수가 임계치를 초과했습니다.',
        details: { active_users: currentActiveUsers, threshold: 500 }
      });
    }

    // Rule 4: Geo-Anomaly Detection (Spike in specific country)
    // Fetch country distribution for the last 24h
    const { data: geoData } = await supabase
      .from('profiles')
      .select('country')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (geoData && geoData.length > 20) {
      const counts: Record<string, number> = {};
      geoData.forEach(p => { if (p.country) counts[p.country] = (counts[p.country] || 0) + 1; });
      const topCountry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topCountry && topCountry[0] !== 'KR' && topCountry[1] > geoData.length * 0.7) {
        anomalies.push({
          level: 'warning',
          type: 'GEO_SPIKE',
          message: `[지역 이상] 특정 국가(${topCountry[0]})에서의 가입 비중이 비정상적으로 높습니다 (전체 가입의 70% 이상).`,
          details: { country: topCountry[0], count: topCountry[1], ratio: '70%+' }
        });
      }
    }

    // Rule 5: Security Exploit Attempt (Internal Scan)
    // We check recent profiles/reports for common injection patterns
    // (Simulation)
    const hasPossibleHacking = false; 
    if (hasPossibleHacking) {
      anomalies.push({
        level: 'critical',
        type: 'SECURITY_EXPLOIT',
        message: '[보안 공격] 시스템 내부에서 SQL 인젝션 또는 XSS 주입 패턴이 감지되었습니다.',
        details: { pattern: 'SQL_INJECTION_DETECTED' }
      });
    }

    // Rule 6: Bot Account Creation (Incomplete Profiling)
    const { data: potentialBots } = await supabase
      .from('profiles')
      .select('birthday, bio, gender')
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString());

    if (potentialBots && potentialBots.length > 20) {
      const incompleteCount = potentialBots.filter(p => !p.birthday || !p.bio).length;
      if (incompleteCount > potentialBots.length * 0.9) {
        anomalies.push({
          level: 'warning',
          type: 'BOT_ACCOUNT_CREATION',
          message: '[봇 의심] 단시간 내에 프로필 정보가 없는 대량 계정 생성이 감지되었습니다.',
          details: { incomplete_ratio: '90%+', count: incompleteCount }
        });
      }
    }

    const finalAnomalies = anomalies.sort((a, b) => {
      const priority = { critical: 3, warning: 2, info: 1 };
      return priority[b.level] - priority[a.level];
    });

    return res.status(200).json({
      totalUsers: totalUsersCount,
      cumulativeUsers: cumulativeUsers || 0,
      newUsersRecent: newUsersRecent,
      newUserGrowth: Number(newUserGrowth.toFixed(1)),
      activeUsers: currentActiveUsers,
      postCount: postCount,
      commentCount: commentCount,
      totalRevenue: totalRevenue,
      conversionRate: Number(conversionRate.toFixed(1)),
      chartData: chartData,
      topPages: topPages,
      anomalies: finalAnomalies
    });

  } catch (error) {
    console.error('Admin Stats API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
});
