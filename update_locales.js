
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'ko_add_block.json');

const newKeys = {
  notification: {
    tab_system: {
      ko: '시스템',
      en: 'System',
      ja: 'システム',
      zh: '系统',
      es: 'Sistema',
      fr: 'Système',
      de: 'System',
      ru: 'Система',
      pt: 'Sistema',
      'pt-br': 'Sistema',
      vi: 'Hệ thống',
      th: 'ระบบ',
      ar: 'النظام',
      hi: 'सिस्टम',
      bn: 'সিস্টেম',
      fi: 'Järjestelmä'
    },
    system_notice: {
      ko: '시스템 알림',
      en: 'System Notice',
      ja: 'システム通知',
      zh: '系统通知',
      es: 'Aviso del sistema',
      fr: 'Avis du système',
      de: 'Systembenachrichtigung',
      ru: 'Системное уведомление',
      pt: 'Aviso do sistema',
      'pt-br': 'Aviso do sistema',
      vi: 'Thông báo hệ thống',
      th: 'การแจ้งเตือนระบบ',
      ar: 'إشعار النظام',
      hi: 'सिस्टम सूचना',
      bn: 'সিস্টেম বিজ্ঞপ্তি',
      fi: 'Järjestelmäilmoitus'
    }
  },
  study: {
    meta_title: {
      ko: 'ARA - K-콘텐츠 기반 한국어 학습 플랫폼',
      en: 'ARA - K-Content Based Korean Learning Platform',
      ja: 'ARA - K-コンテンツベースの韓国語学習プラットフォーム'
    },
    meta_desc_scene: {
      ko: 'K-콘텐츠 장면으로 한국어 공부하기: {{contents}} {{episode}} {{scene}}',
      en: 'Learn Korean with K-Content: {{contents}} {{episode}} {{scene}}',
      ja: 'K-コンテンツのシーンで韓国語を学ぶ: {{contents}} {{episode}} {{scene}}'
    },
    aria_prev_episode: {
      ko: '이전 에피소드',
      en: 'Previous Episode',
      ja: '前のエピソード'
    },
    aria_next_episode: {
      ko: '다음 에피소드',
      en: 'Next Episode',
      ja: '次のエピソード'
    }
  },
  common: {
    unknown: {
      ko: '알 수 없음',
      en: 'Unknown',
      ja: '不明',
      zh: '未知',
      es: 'Desconocido',
      fr: 'Inconnu',
      de: 'Unbekannt',
      ru: 'Неизвестно',
      pt: 'Desconhecido',
      'pt-br': 'Desconhecido',
      vi: 'Không xác định',
      th: 'ไม่รู้จัก',
      ar: 'غير معروف',
      hi: 'अज्ञात',
      bn: 'অজানা',
      fi: 'Tuntematon'
    },
    anonymous: {
      ko: '익명',
      en: 'Anonymous',
      ja: '匿名',
      zh: '匿名',
      es: 'Anónimo',
      fr: 'Anonyme',
      de: 'Anonym',
      ru: 'Анонимно',
      pt: 'Anônimo',
      'pt-br': 'Anônimo',
      vi: 'Ẩn danh',
      th: 'ไม่ระบุตัวตน',
      ar: 'مجهول',
      hi: 'अनाम',
      bn: 'বেনামী',
      fi: 'Anonyymi'
    }
  },
  home: {
    greeting_night: { ko: '좋은 새벽이에요', en: 'Good night / dawn', ja: 'こんばんは / 夜明けです' },
    greeting_morning: { ko: '좋은 아침이에요', en: 'Good morning', ja: 'おはようございます' },
    greeting_afternoon: { ko: '좋은 오후예요', en: 'Good afternoon', ja: 'こんにちは' },
    greeting_evening: { ko: '좋은 저녁이에요', en: 'Good evening', ja: 'こんばんは' },
    stats_due: { ko: '오늘 복습 예정', en: 'Review Due', ja: '復習予定' },
    stats_new: { ko: '신규 단어', en: 'New Words', ja: '新規単語' },
    stats_streak: { ko: '연속 학습', en: 'Streak', ja: '連続学習' },
    goal_text: { ko: '오늘 목표 {{count}}개', en: 'Daily Goal {{count}}', ja: '今日の目標 {{count}}個' },
    recent_progress: { ko: '최근 학습 진도', en: 'Recent Progress', ja: '最近の学習進捗' },
    continue_learning: { ko: '계속 학습하기', en: 'Continue Learning', ja: '学習を続ける' },
    today_recommendation: { ko: '오늘의 추천', en: "Today's Recommendations", ja: '今日のおすすめ' },
    more: { ko: '더보기', en: 'More', ja: 'もっと見る' },
    weekly_stats: { ko: '주간 학습 통계', en: 'Weekly Stats', ja: '週間学習統計' },
    field_progress: { ko: '학습 분야별 진행도', en: 'Progress by Field', ja: '分野別進捗' },
    percent_complete: { ko: '{{percent}}% 완료', en: '{{percent}}% Complete', ja: '{{percent}}% 完了' },
    time_left: { ko: '{{time}} 남음', en: '{{time}} Left', ja: 'のこり {{time}}' }
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Fix known issues for ja.json
  if (lang === 'ja') {
    if (data.profile) {
      // Remove redundant keys if any (they will be overwritten or kept as one)
      // JS object parsing naturally handles duplicates by keeping the last one.
      // So re-stringifying will "fix" it.
    }
    if (data.profile && data.profile.tab_replies === '댓글') {
      data.profile.tab_replies = 'コメント';
    }
  }

  // Inject new keys
  Object.keys(newKeys).forEach(section => {
    if (!data[section]) data[section] = {};
    Object.keys(newKeys[section]).forEach(key => {
      const translations = newKeys[section][key];
      // Use specific translation or fallback to English, then Korean
      data[section][key] = translations[lang] || translations['en'] || translations['ko'];
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${file}`);
});
