const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  ko: {
    coming_soon: "곧 만나요!",
    coming_soon_desc: "지금 열심히 준비하고 있습니다. 더 멋진 기능으로 찾아뵐게요! 🚀"
  },
  en: {
    coming_soon: "Coming Soon!",
    coming_soon_desc: "We are preparing hard now. We will find you with better features! 🚀"
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const lang = file.split('.')[0];
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.common) content.common = {};
  
  // Use English as fallback for other languages for now if not defined
  const keys = newKeys[lang] || newKeys['en'];
  
  content.common.coming_soon = keys.coming_soon;
  content.common.coming_soon_desc = keys.coming_soon_desc;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`Updated ${file}`);
});
