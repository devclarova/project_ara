
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, 'src', 'locales');

// Define supported languages
const languages = [
  'ko', 'en', 'ja', 'zh', 'ru', 'vi', 'bn', 'ar', 
  'hi', 'th', 'es', 'fr', 'pt', 'pt-br', 'de', 'fi'
];

// Load base translations (Korean and English)
function loadJson(lang: string) {
  const p = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return {};
}

const ko = loadJson('ko');
const en = loadJson('en');

// Recursive function to merge keys
// target: The object for a specific language (e.g. ja.json content)
// source: The source object to copy structure from (e.g. en.json)
// We use EN as the fallback source because it's more universally understood than KO for placeholders
function mergeKeys(target: any, source: any) {
  if (typeof source !== 'object' || source === null) {
    return target !== undefined ? target : source;
  }

  const result: any = target || {};
  
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      result[key] = mergeKeys(result[key], source[key]);
    } else {
      // If key exists in target, keep it. If not, use source (English) value
      if (result[key] === undefined) {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// Ensure locales directory exists
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Validating base files exist
if (Object.keys(ko).length === 0 || Object.keys(en).length === 0) {
  console.error("Critical Error: ko.json or en.json is empty or missing. Cannot generate locales.");
  process.exit(1);
}

console.log("Starting locale generation...");

for (const lang of languages) {
  if (lang === 'ko' || lang === 'en') continue; // Skip source files

  const existingData = loadJson(lang);
  // Merge: Start with existing data, fill gaps with English data
  const mergedData = mergeKeys(existingData, en);
  
  const filePath = path.join(localesDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2), 'utf8');
  console.log(`Generated/Updated ${lang}.json`);
}

console.log("Locale generation complete.");
