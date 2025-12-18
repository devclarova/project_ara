
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, 'src', 'locales');
const ENV_PATH = path.join(__dirname, '.env');

function getApiKey() {
  try {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/VITE_OPENAI_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // ignore
  }
  return process.env.VITE_OPENAI_API_KEY;
}

const API_KEY = getApiKey();

if (!API_KEY) {
  console.error('API Key not found.');
  process.exit(1);
}

function callOpenAI(messages, model = "gpt-4o-mini") {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      messages,
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
            console.error('API Error:', json);
            resolve(null);
          }
        } catch (e) {
          console.error('Parse Error:', e);
          resolve(null);
        }
      });
    });

    req.on('error', e => reject(e));
    req.write(data);
    req.end();
  });
}

async function refineJapanese(jsonContent) {
  console.log('Refining Japanese locale...');
  const prompt = `
    You are a UX writer for a mobile app. 
    Refine the values in the following JSON to be softer and easier to read for Japanese users.
    
    Rules:
    1. Use Hiragana and Katakana primarily.
    2. Keep Kanji ONLY for very common words (e.g., 設定, 検索, 会員) or where Hiragana-only would make it hard to read (ambiguous word boundaries).
    3. The goal is a friendly, approachable tone.
    4. Return ONLY the valid JSON string. No markdown code blocks.
  `;

  const result = await callOpenAI([
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(jsonContent, null, 2) }
  ]);

  if (!result) return jsonContent; // Fail safe
  try {
    // Strip markdown code blocks if present
    const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Failed to parse refined Japanese JSON', e);
    return jsonContent;
  }
}

async function translateSettingsDesc(langCode, currentVal) {
  // If already contains slash, assume it's okay (or if it's Korean)
  if (currentVal && currentVal.includes('/')) return currentVal;
  if (langCode === 'ko') return "프로필/설정";

  console.log(`Translating settings_desc for ${langCode}...`);
  const prompt = `
    Translate "프로필/설정" (Profile/Settings) into ${langCode}.
    Format MUST be "Profile/Settings" (Noun/Noun).
    Keep the slash (/).
    Return ONLY the translated string.
  `;
  
  const result = await callOpenAI([
    { role: "system", content: "You are a translator." },
    { role: "user", content: prompt }
  ]);
  
  return result || currentVal;
}

async function main() {
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = path.basename(file, '.json');
    const filePath = path.join(LOCALES_DIR, file);
    
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    // 1. Refine Japanese
    if (langCode === 'ja') {
      const refined = await refineJapanese(content);
      if (refined) {
        content = refined;
        modified = true;
      }
    }

    // 2. Fix common.settings_desc
    if (content.common) {
        const oldDesc = content.common.settings_desc;
        const newDesc = await translateSettingsDesc(langCode, oldDesc);
        if (newDesc !== oldDesc) {
            content.common.settings_desc = newDesc;
            modified = true;
        }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No changes for ${file}`);
    }
  }
}

main().catch(console.error);
