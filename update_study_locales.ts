
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, 'src', 'locales');

const languages = [
  'ja', 'zh', 'ru', 'vi', 'bn', 'ar', 
  'hi', 'th', 'es', 'fr', 'pt', 'pt-br', 'de', 'fi'
];

type TranslationMap = Record<string, {
  study: {
    level: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    no_content: string;
    search_placeholder: string;
  };
  auth: {
    login_needed: string;
  };
}>;

const translations: TranslationMap = {
  ja: {
    study: { level: { beginner: '初級', intermediate: '中級', advanced: '上級' }, no_content: 'コンテンツが見つかりません。', search_placeholder: '検索...' },
    auth: { login_needed: 'ログインが必要です' }
  },
  zh: {
    study: { level: { beginner: '初级', intermediate: '中级', advanced: '高级' }, no_content: '未找到相关内容。', search_placeholder: '搜索...' },
    auth: { login_needed: '需要登录' }
  },
  ru: {
    study: { level: { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' }, no_content: 'Контент не найден.', search_placeholder: 'Поиск...' },
    auth: { login_needed: 'Требуется вход' }
  },
  vi: {
    study: { level: { beginner: 'Sơ cấp', intermediate: 'Trung cấp', advanced: 'Cao cấp' }, no_content: 'Không tìm thấy nội dung.', search_placeholder: 'Tìm kiếm...' },
    auth: { login_needed: 'Cần đăng nhập' }
  },
  bn: {
    study: { level: { beginner: 'প্রাথমিক', intermediate: 'মধ্যবর্তী', advanced: 'উন্নত' }, no_content: 'কোন বিষয়বস্তু পাওয়া যায়নি।', search_placeholder: 'অনুসন্ধান...' },
    auth: { login_needed: 'লগইন প্রয়োজন' }
  },
  ar: {
    study: { level: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }, no_content: 'لا يوجد محتوى.', search_placeholder: 'بحث...' },
    auth: { login_needed: 'تسجيل الدخول مطلوب' }
  },
  hi: {
    study: { level: { beginner: 'शुरुआती', intermediate: 'मध्यम', advanced: 'उन्नत' }, no_content: 'कोई सामग्री नहीं मिली।', search_placeholder: 'खोज...' },
    auth: { login_needed: 'लॉगिन आवश्यक है' }
  },
  th: {
    study: { level: { beginner: 'ระดับต้น', intermediate: 'ระดับกลาง', advanced: 'ระดับสูง' }, no_content: 'ไม่พบเนื้อหา', search_placeholder: 'ค้นหา...' },
    auth: { login_needed: 'จำเป็นต้องเข้าสู่ระบบ' }
  },
  es: {
    study: { level: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }, no_content: 'No se ha encontrado contenido.', search_placeholder: 'Buscar...' },
    auth: { login_needed: 'Inicio de sesión requerido' }
  },
  fr: {
    study: { level: { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' }, no_content: 'Aucun contenu trouvé.', search_placeholder: 'Rechercher...' },
    auth: { login_needed: 'Connexion requise' }
  },
  pt: {
    study: { level: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }, no_content: 'Nenhum conteúdo encontrado.', search_placeholder: 'Pesquisar...' },
    auth: { login_needed: 'Login necessário' }
  },
  'pt-br': {
    study: { level: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }, no_content: 'Nenhum conteúdo encontrado.', search_placeholder: 'Pesquisar...' },
    auth: { login_needed: 'Login necessário' }
  },
  de: {
    study: { level: { beginner: 'Anfänger', intermediate: 'Fortgeschritten', advanced: 'Profi' }, no_content: 'Kein Inhalt gefunden.', search_placeholder: 'Suchen...' },
    auth: { login_needed: 'Anmeldung erforderlich' }
  },
  fi: {
    study: { level: { beginner: 'Aloittelija', intermediate: 'Keskitaso', advanced: 'Edistynyt' }, no_content: 'Ei sisältöä.', search_placeholder: 'Hae...' },
    auth: { login_needed: 'Kirjautuminen vaaditaan' }
  }
};

function loadJson(lang: string) {
  const p = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return {};
}

console.log("Starting targeted locale update for Study keys...");

for (const lang of languages) {
  const data = loadJson(lang);
  const updates = translations[lang];
  
  if (!updates) continue;

  // Ensure structure exists
  if (!data.study) data.study = {};
  if (!data.study.level) data.study.level = {};
  if (!data.auth) data.auth = {};

  // Apply updates
  data.study.level.beginner = updates.study.level.beginner;
  data.study.level.intermediate = updates.study.level.intermediate;
  data.study.level.advanced = updates.study.level.advanced;
  data.study.no_content = updates.study.no_content;
  data.study.search_placeholder = updates.study.search_placeholder;
  data.auth.login_needed = updates.auth.login_needed;

  const filePath = path.join(localesDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${lang}.json with study translations.`);
}

console.log("Update complete.");
