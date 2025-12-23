import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, 'src', 'locales');

// Translation data
const translations = {
  ko: {
    "nav": { "goods": "굿즈샵" },
    "goods": {
      "hero_title": "공식 굿즈 스토어",
      "hero_desc": "여러분의 학습을 응원하는 특별한 아이템들을 만나보세요.",
      "category_all": "전체",
      "category_clothing": "의류",
      "category_accessories": "액세서리",
      "category_digital": "디지털",
      "new_arrival": "신상품",
      "best_seller": "베스트",
      "sold_out": "품절",
      "price_unit": "원"
    }
  },
  en: {
    "nav": { "goods": "Goods Shop" },
    "goods": {
      "hero_title": "Official Goods Store",
      "hero_desc": "Discover special items to support your learning journey.",
      "category_all": "All",
      "category_clothing": "Clothing",
      "category_accessories": "Accessories",
      "category_digital": "Digital",
      "new_arrival": "New",
      "best_seller": "Best",
      "sold_out": "Sold Out",
      "price_unit": "KRW"
    }
  },
  ja: {
    "nav": { "goods": "グッズショップ" },
    "goods": {
      "hero_title": "公式グッズストア",
      "hero_desc": "あなたの学習を応援する特別なアイテムを見つけましょう。",
      "category_all": "すべて",
      "category_clothing": "衣類",
      "category_accessories": "アクセサリー",
      "category_digital": "デジタル",
      "new_arrival": "新着",
      "best_seller": "ベスト",
      "sold_out": "売り切れ",
      "price_unit": "ウォン"
    }
  },
  zh: {
    "nav": { "goods": "周边商店" },
    "goods": {
      "hero_title": "官方周边商店",
      "hero_desc": "发现支持您学习之旅的特别商品。",
      "category_all": "全部",
      "category_clothing": "服装",
      "category_accessories": "配饰",
      "category_digital": "数码",
      "new_arrival": "新品",
      "best_seller": "热销",
      "sold_out": "售罄",
      "price_unit": "韩元"
    }
  },
  es: {
    "nav": { "goods": "Tienda" },
    "goods": {
      "hero_title": "Tienda Oficial",
      "hero_desc": "Descubre artículos especiales para apoyar tu aprendizaje.",
      "category_all": "Todo",
      "category_clothing": "Ropa",
      "category_accessories": "Accesorios",
      "category_digital": "Digital",
      "new_arrival": "Nuevo",
      "best_seller": "Mejor",
      "sold_out": "Agotado",
      "price_unit": "KRW"
    }
  },
  // Add simplified defaults for others to save space, will use English/Korean mixed logic or generic
  fr: { "nav": { "goods": "Boutique" }, "goods": { "hero_title": "Boutique Officielle", "category_all": "Tout" } },
  de: { "nav": { "goods": "Shop" }, "goods": { "hero_title": "Offizieller Shop", "category_all": "Alle" } },
  ru: { "nav": { "goods": "Магазин" }, "goods": { "hero_title": "Официальный магазин", "category_all": "Все" } },
  pt: { "nav": { "goods": "Loja" }, "goods": { "hero_title": "Loja Oficial", "category_all": "Tudo" } },
  it: { "nav": { "goods": "Negozio" }, "goods": { "hero_title": "Negozio Ufficiale", "category_all": "Tutti" } },
  vi: { "nav": { "goods": "Cửa hàng" }, "goods": { "hero_title": "Cửa hàng chính thức", "category_all": "Tất cả" } },
  th: { "nav": { "goods": "ร้านค้า" }, "goods": { "hero_title": "ร้านค้าอย่างเป็นทางการ", "category_all": "ทั้งหมด" } },
  id: { "nav": { "goods": "Toko" }, "goods": { "hero_title": "Toko Resmi", "category_all": "Semua" } },
  ar: { "nav": { "goods": "المتجر" }, "goods": { "hero_title": "المتجر الرسمي", "category_all": "الكل" } },
  hi: { "nav": { "goods": "દુકાન" }, "goods": { "hero_title": "સત્તાવાર દુકાન", "category_all": "બધું" } }, // Gujarati? fallback to generic layout
  bn: { "nav": { "goods": "দোকান" }, "goods": { "hero_title": "অফিসিয়াল স্টোর", "category_all": "সব" } }
};

// Helper: Deep merge
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

function updateLocaleFile({ lang, data }) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Locale ${lang} not found.`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let json = JSON.parse(content);

        // Merge nav
        if (!json.nav) json.nav = {};
        json.nav.goods = data.nav?.goods || "Goods Shop";

        // Merge goods
        if (!json.goods) json.goods = {};
        const goodsData = data.goods || translations.en.goods; // Fallback to EN if missing
        Object.assign(json.goods, goodsData);

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`Updated ${lang}.json`);
    } catch (e) {
        console.error(`Error updating ${lang}:`, e);
    }
}

console.log("Updating locales for Goods Shop...");
Object.entries(translations).forEach(([lang, data]) => {
    updateLocaleFile({ lang, data });
});
console.log("Done.");
