#!/bin/bash

# 언어별 "Login Required" 번역
declare -A login_translations=(
  ["ja"]="ログインが必要"
  ["zh"]="需要登录"
  ["ru"]="Требуется авторизация"
  ["vi"]="Cần đăng nhập"
  ["bn"]="লগইন প্রয়োজন"
  ["ar"]="تسجيل الدخول مطلوب"
  ["hi"]="लॉगिन आवश्यक"
  ["th"]="ต้องเข้าสู่ระบบ"
  ["es"]="Inicio de sesión requerido"
  ["fr"]="Connexion requise"
  ["pt"]="Login necessário"
  ["pt-br"]="Login necessário"
  ["de"]="Anmeldung erforderlich"
  ["fi"]="Kirjautuminen vaaditaan"
)

# 언어별 "Preview" 번역
declare -A preview_translations=(
  ["ja"]="プレビュー"
  ["zh"]="预览"
  ["ru"]="Предпросмотр"
  ["vi"]="Xem trước"
  ["bn"]="পূর্বরূপ"
  ["ar"]="معاينة"
  ["hi"]="पूर्वावलोकन"
  ["th"]="ดูตัวอย่าง"
  ["es"]="Vista previa"
  ["fr"]="Aperçu"
  ["pt"]="Visualizar"
  ["pt-br"]="Visualizar"
  ["de"]="Vorschau"
  ["fi"]="Esikatselu"
)

for lang in "${!login_translations[@]}"; do
  file="src/locales/${lang}.json"
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$file', 'utf-8'));
      
      // study.login_required 추가
      if (!data.study.login_required) {
        data.study.login_required = '${login_translations[$lang]}';
      }
      
      // study.preview 추가
      if (!data.study.preview) {
        data.study.preview = '${preview_translations[$lang]}';
      }
      
      fs.writeFileSync('$file', JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log('Updated $file');
    "
  fi
done

echo "All files updated!"
