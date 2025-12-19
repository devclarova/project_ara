import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'src/locales');

const translations = {
  ko: {
    "settings.withdraw_reason_label": "탈퇴 사유",
    "settings.withdraw_reason_placeholder": "사유를 선택해주세요",
    "settings.withdraw_detail_placeholder": "구체적인 사유를 입력해주세요",
    "settings.reason_low_usage": "자주 사용하지 않음",
    "settings.reason_rejoin": "재가입 목적",
    "settings.reason_privacy": "개인정보/보안 우려",
    "settings.reason_feature": "기능 불만족",
    "settings.reason_other": "기타"
  },
  en: {
    "settings.withdraw_reason_label": "Reason for withdrawal",
    "settings.withdraw_reason_placeholder": "Select a reason",
    "settings.withdraw_detail_placeholder": "Please provide details",
    "settings.reason_low_usage": "I don't use it often",
    "settings.reason_rejoin": "To rejoin with a new account",
    "settings.reason_privacy": "Privacy/Security concerns",
    "settings.reason_feature": "Unsatisfied with features",
    "settings.reason_other": "Other"
  },
  ja: {
    "settings.withdraw_reason_label": "退会理由",
    "settings.withdraw_reason_placeholder": "理由を選択してください",
    "settings.withdraw_detail_placeholder": "詳細を入力してください",
    "settings.reason_low_usage": "あまり使用していない",
    "settings.reason_rejoin": "再加入のため",
    "settings.reason_privacy": "個人情報/セキュリティの懸念",
    "settings.reason_feature": "機能に不満がある",
    "settings.reason_other": "その他"
  },
  zh: {
    "settings.withdraw_reason_label": "注销原因",
    "settings.withdraw_reason_placeholder": "请选择原因",
    "settings.withdraw_detail_placeholder": "请填写具体原因",
    "settings.reason_low_usage": "使用频率低",
    "settings.reason_rejoin": "为了重新注册",
    "settings.reason_privacy": "隐私/安全担忧",
    "settings.reason_feature": "功能不满意",
    "settings.reason_other": "其他"
  },
  es: {
    "settings.withdraw_reason_label": "Motivo de retiro",
    "settings.withdraw_reason_placeholder": "Seleccione un motivo",
    "settings.withdraw_detail_placeholder": "Proporcione detalles",
    "settings.reason_low_usage": "No lo uso a menudo",
    "settings.reason_rejoin": "Para volver a unirse",
    "settings.reason_privacy": "Preocupaciones de privacidad",
    "settings.reason_feature": "Insatisfecho con las funciones",
    "settings.reason_other": "Otro"
  },
  fr: {
    "settings.withdraw_reason_label": "Raison du retrait",
    "settings.withdraw_reason_placeholder": "Sélectionnez une raison",
    "settings.withdraw_detail_placeholder": "Veuillez fournir des détails",
    "settings.reason_low_usage": "Je ne l'utilise pas souvent",
    "settings.reason_rejoin": "Pour rejoindre à nouveau",
    "settings.reason_privacy": "Problèmes de confidentialité",
    "settings.reason_feature": "Insatisfait des fonctionnalités",
    "settings.reason_other": "Autre"
  },
  de: {
    "settings.withdraw_reason_label": "Grund für den Austritt",
    "settings.withdraw_reason_placeholder": "Wählen Sie einen Grund",
    "settings.withdraw_detail_placeholder": "Bitte geben Sie Details an",
    "settings.reason_low_usage": "Ich benutze es nicht oft",
    "settings.reason_rejoin": "Um wieder beizutreten",
    "settings.reason_privacy": "Datenschutzbedenken",
    "settings.reason_feature": "Unzufrieden mit Funktionen",
    "settings.reason_other": "Andere"
  },
  ru: {
    "settings.withdraw_reason_label": "Причина удаления",
    "settings.withdraw_reason_placeholder": "Выберите причину",
    "settings.withdraw_detail_placeholder": "Укажите подробности",
    "settings.reason_low_usage": "Редко пользуюсь",
    "settings.reason_rejoin": "Хочу создать новый аккаунт",
    "settings.reason_privacy": "Конфиденциальность",
    "settings.reason_feature": "Не нравятся функции",
    "settings.reason_other": "Другое"
  },
  pt: {
    "settings.withdraw_reason_label": "Motivo da saída",
    "settings.withdraw_reason_placeholder": "Selecione um motivo",
    "settings.withdraw_detail_placeholder": "Forneça detalhes",
    "settings.reason_low_usage": "Não uso com frequência",
    "settings.reason_rejoin": "Para entrar novamente",
    "settings.reason_privacy": "Preocupações com privacidade",
    "settings.reason_feature": "Insatisfeito com recursos",
    "settings.reason_other": "Outro"
  },
  "pt-br": {
    "settings.withdraw_reason_label": "Motivo da saída",
    "settings.withdraw_reason_placeholder": "Selecione um motivo",
    "settings.withdraw_detail_placeholder": "Forneça detalhes",
    "settings.reason_low_usage": "Não uso com frequência",
    "settings.reason_rejoin": "Para entrar novamente",
    "settings.reason_privacy": "Preocupações com privacidade",
    "settings.reason_feature": "Insatisfeito com recursos",
    "settings.reason_other": "Outro"
  },
  vi: {
    "settings.withdraw_reason_label": "Lý do hủy",
    "settings.withdraw_reason_placeholder": "Chọn lý do",
    "settings.withdraw_detail_placeholder": "Vui lòng cung cấp chi tiết",
    "settings.reason_low_usage": "Ít sử dụng",
    "settings.reason_rejoin": "Để tham gia lại",
    "settings.reason_privacy": "Lo ngại về quyền riêng tư",
    "settings.reason_feature": "Không hài lòng với tính năng",
    "settings.reason_other": "Khác"
  },
  th: {
    "settings.withdraw_reason_label": "เหตุผลการถอนตัว",
    "settings.withdraw_reason_placeholder": "เลือกเหตุผล",
    "settings.withdraw_detail_placeholder": "โปรดระบุรายละเอียด",
    "settings.reason_low_usage": "ไม่ได้ใช้บ่อย",
    "settings.reason_rejoin": "เพื่อสมัครใหม่",
    "settings.reason_privacy": "กังวลเรื่องความเป็นส่วนตัว",
    "settings.reason_feature": "ไม่พอใจในฟีเจอร์",
    "settings.reason_other": "อื่นๆ"
  },
  hi: {
    "settings.withdraw_reason_label": "हटाने का कारण",
    "settings.withdraw_reason_placeholder": "कारण चुनें",
    "settings.withdraw_detail_placeholder": "विवरण दें",
    "settings.reason_low_usage": "अक्सर उपयोग नहीं करते",
    "settings.reason_rejoin": "फिर से जुड़ने के लिए",
    "settings.reason_privacy": "गोपनीयता चिंता",
    "settings.reason_feature": "सुविधाओं से असंतुष्ट",
    "settings.reason_other": "अन्य"
  },
  ar: {
    "settings.withdraw_reason_label": "سبب الانسحاب",
    "settings.withdraw_reason_placeholder": "اختر سببا",
    "settings.withdraw_detail_placeholder": "يرجى تقديم التفاصيل",
    "settings.reason_low_usage": "لا أستخدمه كثيرًا",
    "settings.reason_rejoin": "لإعادة الانضمام",
    "settings.reason_privacy": "مخاوف الخصوصية",
    "settings.reason_feature": "غير راض عن الميزات",
    "settings.reason_other": "آخر"
  },
  bn: {
    "settings.withdraw_reason_label": "প্রত্যাহারের কারণ",
    "settings.withdraw_reason_placeholder": "একটি কারণ নির্বাচন করুন",
    "settings.withdraw_detail_placeholder": "বিস্তারিত প্রদান করুন",
    "settings.reason_low_usage": "বেশি ব্যবহার করি না",
    "settings.reason_rejoin": "পুনরায় যোগ দেওয়ার জন্য",
    "settings.reason_privacy": "গোপনীয়তা উদ্বেগ",
    "settings.reason_feature": "বৈশিষ্ট্য নিয়ে অসন্তুষ্ট",
    "settings.reason_other": "অন্যান্য"
  },
  fi: {
    "settings.withdraw_reason_label": "Poistumisen syy",
    "settings.withdraw_reason_placeholder": "Valitse syy",
    "settings.withdraw_detail_placeholder": "Anna lisätietoja",
    "settings.reason_low_usage": "En käytä usein",
    "settings.reason_rejoin": "Liittyäkseni uudelleen",
    "settings.reason_privacy": "Yksityisyyshuolet",
    "settings.reason_feature": "Tyytymätön ominaisuuksiin",
    "settings.reason_other": "Muu"
  }
};

const files = fs.readdirSync(localesDir);

files.forEach(file => {
  if (!file.endsWith('.json')) return;
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Select translation map or fallback to English
    const newKeys = translations[lang] || translations['en'];

    // Merge new keys
    let updated = false;
    for (const [key, value] of Object.entries(newKeys)) {
      if (!data.settings) data.settings = {}; // ensure settings namespace exists
      
      const parts = key.split('.');
      if (parts.length === 2 && parts[0] === 'settings') {
         if (!data.settings) data.settings = {};
         data.settings[parts[1]] = value;
         updated = true;
      }
    }
    
    if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});
