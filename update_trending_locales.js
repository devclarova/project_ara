import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory for locales
const localesDir = path.join(__dirname, 'src', 'locales');

// Define the new key and values
const newKey = 'trending.shared_photo';
const translations = {
  ko: "사진을 공유했습니다.",
  en: "Shared a photo.",
  ja: "写真を共有しました。",
  zh: "分享了一张照片。",
  es: "Compartió una foto.",
  fr: "A partagé une photo.",
  de: "Hat ein Foto geteilt.",
  ru: "Поделился фото.",
  pt: "Compartilhou uma foto.",
  it: "Ha condiviso una foto.",
  vi: "Đã chia sẻ một bức ảnh.",
  th: "แชร์รูปภาพ",
  id: "Membagikan foto.",
  ar: "مشاركة صورة.",
  hi: "एक फोटो साझा की।",
  bn: "একটি ছবি শেয়ার করেছেন।"
};

function updateLocaleFile({ lang, value }) {
    const filePath = path.join(localesDir, `${lang}.json`);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: Locale file for ${lang} not found at ${filePath}`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let json = JSON.parse(content);

        if (!json.trending) {
            json.trending = {};
        }

        json.trending.shared_photo = value;

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`✅ Updated ${lang}.json`);
    } catch (err) {
        console.error(`❌ Error updating ${lang}.json:`, err);
    }
}

console.log("Starting locale updates...");
Object.entries(translations).forEach(([lang, value]) => {
    updateLocaleFile({ lang, value });
});
console.log("All updates completed.");
