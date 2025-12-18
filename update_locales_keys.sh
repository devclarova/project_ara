#!/bin/bash

# 언어별 "Agree and Close" 번역
declare -A translations=(
  ["ja"]="同意して閉じる"
  ["zh"]="同意并关闭"
  ["ru"]="Согласиться и закрыть"
  ["vi"]="Đồng ý và đóng"
  ["bn"]="সম্মতি এবং বন্ধ"
  ["ar"]="موافق وإغلاق"
  ["hi"]="सहमत और बंद करें"
  ["th"]="ยอมรับและปิด"
  ["es"]="Aceptar y cerrar"
  ["fr"]="Accepter et fermer"
  ["pt"]="Concordar e fechar"
  ["pt-br"]="Concordar e fechar"
  ["de"]="Zustimmen und schließen"
  ["fi"]="Hyväksy ja sulje"
)

# close 번역
declare -A close_translations=(
  ["ja"]="閉じる"
  ["zh"]="关闭"
  ["ru"]="Закрыть"
  ["vi"]="Đóng"
  ["bn"]="বন্ধ"
  ["ar"]="إغلاق"
  ["hi"]="बंद करें"
  ["th"]="ปิด"
  ["es"]="Cerrar"
  ["fr"]="Fermer"
  ["pt"]="Fechar"
  ["pt-br"]="Fechar"
  ["de"]="Schließen"
  ["fi"]="Sulje"
)

for lang in "${!translations[@]}"; do
  file="src/locales/${lang}.json"
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # common 섹션에 close 추가
    # signup 섹션에 agree_and_close 추가
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$file', 'utf-8'));
      
      // common.close 추가
      if (!data.common.close) {
        data.common.close = '${close_translations[$lang]}';
      }
      
      // signup.agree_and_close 추가
      if (!data.signup.agree_and_close) {
        data.signup.agree_and_close = '${translations[$lang]}';
      }
      
      fs.writeFileSync('$file', JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log('Updated $file');
    "
  fi
done

echo "All files updated!"
