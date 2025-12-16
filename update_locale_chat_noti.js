
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, 'src', 'locales');
const ENV_PATH = path.join(__dirname, '.env');

// 추가할 키와 한국어 원문
// 이미 반영된 키는 제외하고 프로필만 남김 (재번역을 위해)
const NEW_KEYS = {
  chat: {
    user_search_placeholder: "Search users...",
    user_search_loading: "Searching users...",
    no_chats: "No chats yet.",
    no_messages: "No messages yet.",
    search_placeholder: "Search message content",
    search_btn: "Search",
    search_hint: "Search message content.",
    no_result: "No results found.",
    result_count: "{{index}} of {{count}} results",
    prev: "Prev",
    next: "Next",
    loading: "Loading...",
    loading_messages: "Loading messages...",
    select_or_start: "Select a chat from the left list or click the + button to start a conversation.",
    start_conversation: "Click the + button to start a conversation.",
    search_placeholder_history: "Search chat room or conversion content...",
    search_result_rooms: "Chat Rooms",
    search_result_messages: "Messages",
    last_message_label: "Last message",
    searching: "Searching...",
    no_search_result_desc: "No conversation history found for '{{query}}'."
  }
};

// .env에서 API 키 읽기
function getApiKey() {
  try {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/VITE_OPENAI_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    console.error('.env file not found or readable');
  }
  return process.env.VITE_OPENAI_API_KEY;
}

const API_KEY = getApiKey();

if (!API_KEY) {
  console.error('API Key not found inside .env');
  process.exit(1);
}

// OpenAI 번역 요청
function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    if (targetLang === 'ko') {
      resolve(text);
      return;
    }

    const data = JSON.stringify({
      model: "gpt-4o-mini", // Cost effective model
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a Social Media (SNS) app. 
          Translate the given Korean text into the target language (${targetLang}).
          IMPORTANT: Translate '좋아요' as 'Likes' (or social context equivalent like 'いいね', 'J'aime'), NOT as 'Good' or 'Nice'.
          Keep the tone polite and appropriate for a UI.
          Return ONLY the translated text, no quotes or explanations.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content.trim());
          } else {
            console.error(`Translation failed for ${targetLang}:`, json);
            resolve(text); // Fallback to original
          }
        } catch (e) {
          console.error(`Error parsing response for ${targetLang}`, e);
          resolve(text);
        }
      });
    });

    req.on('error', e => {
      console.error(`Request error for ${targetLang}:`, e);
      resolve(text);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = path.basename(file, '.json');
    const filePath = path.join(LOCALES_DIR, file);

    // 한국어는 이미 작업 완료되었으므로 건너뜀
    if (langCode === 'ko') continue;
    
    console.log(`Processing ${langCode}...`);
    
    let content = {};
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
      continue;
    }

    await processKeys(content, NEW_KEYS, langCode);

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  }
  
  console.log('All locales updated successfully!');
}

// 중첩 객체 병합 및 번역 (강제 업데이트 로직 추가)
async function processKeys(currentObj, newKeysObj, langCode) {
  for (const key in newKeysObj) {
    if (typeof newKeysObj[key] === 'object' && newKeysObj[key] !== null) {
      if (!currentObj[key]) currentObj[key] = {};
      await processKeys(currentObj[key], newKeysObj[key], langCode);
    } else {
      // 키가 없거나, 값이 영어 원문과 똑같다면(번역 안된 상태) 번역 시도
      const isMissing = !currentObj[key];
      const isNotTranslated = currentObj[key] === newKeysObj[key];
      
      if (isMissing || isNotTranslated) {
        process.stdout.write(`Translating [${key}] to ${langCode}... `);
        const translated = await translateText(newKeysObj[key], langCode);
        currentObj[key] = translated;
        console.log(translated !== newKeysObj[key] ? 'Done' : 'Failed (Same as source)');
      }
    }
  }
}

main().catch(console.error);
