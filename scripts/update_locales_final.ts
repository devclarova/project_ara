
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, 'src', 'locales');

const languages = [
  'ja', 'zh', 'ru', 'vi', 'bn', 'ar', 
  'hi', 'th', 'es', 'fr', 'pt', 'pt-br', 'de', 'fi', 'ko', 'en'
];

const fullTranslations: Record<string, any> = {
  // 1. Japanese (ja)
  ja: {
    nav: { home: "ホーム", study: "学習", community: "コミュニティ", chat: "チャット", notifications: "通知", more: "その他", settings: "設定", profile: "プロフィール", post: "投稿" },
    notification: { like_feed: "あなたのフィードに「いいね」しました。", user_action: "{{name}}", new: "新規", deleted_post: "削除された投稿です。", deleted_comment: "削除されたコメントです。", comment_feed: "あなたの投稿にコメントしました。", like_comment: "あなたのコメントに「いいね」しました。", follow_msg: "あなたをフォローしました。", repost_msg: "あなたの投稿をリポストしました。", mention_msg: "あなたをメンションしました。" },
    study: { 
        search_placeholder: "検索...", no_content: "コンテンツが見つかりません。", 
        category: { all: "すべて", drama: "ドラマ", movie: "映画", entertainment: "バラエティ", music: "音楽" }, 
        level: { title: "難易度", all: "すべて", beginner: "初級", intermediate: "中級", advanced: "上級" }, 
        formats: { episode: "第{{val}}話", scene: "シーン {{val}}" }, 
        guide: { prev: "前へ", next: "次へ", start: "開始", close: "閉じる", never_show: "今後表示しない" },
        no_title: "タイトルなし", no_episode: "エピソードなし", share_text_prefix: "K-コンテンツで学ぶ: ", meta_desc_default: "ARAで楽しく韓国語を学びましょう",
        study_card_title: "学習カード", vocab_explanation: "単語解説", culture_note: "文化ノート"
    },
    auth: { 
        login: "ログイン", signup: "会員登録", logout: "ログアウト", login_needed: "ログインが必要です", please_login: "ログインしてください", click_to_login: "クリックしてログイン",
        welcome: "ようこそ", email: "メールアドレス", password: "パスワード", logging_in: "ログイン中...", auto_login: "自動ログイン", 
        find_email: "メールを探す", find_password: "パスワードを探す", resend_verification: "認証メール再送", first_time: "初めてですか？",
        login_with_google: "Googleでログイン", login_with_kakao: "Kakaoでログイン", verification_sent: "認証メールを送信しました", email_verification_failed: "メール認証に失敗しました",
        verify_before_login: "ログイン前にメール認証を完了してください", invalid_credentials: "メールまたはパスワードが正しくありません"
    },
    common: { loading: "読み込み中...", save: "保存", cancel: "キャンセル", delete: "削除", edit: "編集", my_profile: "マイプロフィール", my_account: "マイアカウント", view_profile: "プロフィールを見る", settings_desc: "プロフィール/設定", search: "検索", back: "戻る", apply: "適用", error: "エラーが発生しました", close: "閉じる" },
    settings: { languageSelect: "言語選択", system: "システム設定", language: "言語", theme: "テーマ", notifications: "通知設定", alarm_comment: "コメント通知", alarm_like: "いいね通知", alarm_follow: "フォロー通知", privacy: "プライバシー設定", change_password: "パスワード変更", connect_sns: "SNSアカウント連携", withdraw: "アカウント削除", withdraw_phrase: "アカウントを削除します", withdraw_btn_confirm: "削除する", confirm_password: "パスワード確認", support_policy: "サポート＆ポリシー", help_center: "ヘルプセンター", terms: "利用規約", privacy_policy: "プライバシーポリシー", marketing_consent: "マーケティング同意" },
    profile: { edit_profile: "プロフィール編集", following: "フォロー中", followers: "フォロワー", joined: "{{date}}に参加", tabs: { posts: "投稿", replies: "返信", media: "メディア", likes: "いいね" }, no_posts: "投稿がありません", no_replies: "返信がありません" },
    tweets: { placeholder_tweet: "いまどうしてる？", placeholder_reply: "コメントする...", btn_post: "投稿", btn_reply: "返信", add_photo: "画像を追加" },
    tweet: { delete_msg_title: "削除しますか？", delete_msg_desc: "削除すると復元できません。", delete_success: "削除しました。", no_replies: "返信がありません", be_first: "最初のコメントを投稿しましょう！" },
    trending: { title: "トレンド", no_trending: "トレンドがありません" },
    chat: { direct_chat: "ダイレクトメッセージ", select_or_start: "左側からチャットルームを選択するか", start_conversation: "「新規チャット」ボタンを押して会話を開始してください。", me: "自分", search_placeholder: "メッセージを検索", search_btn: "検索", send_first_message: "最初のメッセージを送りましょう！", feature_realtime: "💬 リアルタイム1:1チャット", feature_search: "👥 ユーザー検索と招待", feature_responsive: "📱 レスポンシブデザイン", no_chats: "まだチャットルームがありません。「新規チャット」を押して会話を開始してください。" }
  },
  // 2. Chinese (zh)
  zh: {
     nav: { home: "首页", study: "学习", community: "社区", chat: "聊天", notifications: "通知", more: "更多", settings: "设置", profile: "个人资料", post: "发布" },
     notification: { like_feed: "赞了你的动态。", user_action: "{{name}}", new: "新", deleted_post: "已删除的帖子。", deleted_comment: "已删除的评论。", comment_feed: "评论了你的动态。", like_comment: "赞了你的评论。", follow_msg: "关注了你。", repost_msg: "转发了你的动态。", mention_msg: "提到了你。" },
     study: { 
         search_placeholder: "搜索...", no_content: "未找到内容。", 
         category: { all: "全部", drama: "电视剧", movie: "电影", entertainment: "综艺", music: "音乐" }, 
         level: { title: "难度", all: "全部", beginner: "初级", intermediate: "中级", advanced: "高级" }, 
         formats: { episode: "第{{val}}集", scene: "场景 {{val}}" }, 
         guide: { prev: "上一页", next: "下一页", start: "开始", close: "关闭", never_show: "不再显示" },
         no_title: "无标题", no_episode: "无剧集", share_text_prefix: "学习K-内容: ", meta_desc_default: "在ARA愉快地学习韩语",
         study_card_title: "学习卡片", vocab_explanation: "单词解释", culture_note: "文化笔记"
     },
     auth: { 
         login: "登录", signup: "注册", logout: "退出", login_needed: "需要登录", please_login: "请登录", click_to_login: "点击登录",
         welcome: "欢迎", email: "邮箱", password: "密码", logging_in: "登录中...", auto_login: "自动登录",
         find_email: "找回邮箱", find_password: "找回密码", resend_verification: "重发验证邮件", first_time: "第一次访问？",
         login_with_google: "Google登录", login_with_kakao: "Kakao登录", verification_sent: "验证邮件已发送", email_verification_failed: "邮箱验证失败",
         verify_before_login: "请先验证邮箱", invalid_credentials: "邮箱或密码错误"
     },
     common: { loading: "加载中...", save: "保存", cancel: "取消", delete: "删除", edit: "编辑", my_profile: "我的资料", my_account: "我的账户", view_profile: "查看资料", settings_desc: "设置", search: "搜索", back: "返回", apply: "应用", error: "发生错误", close: "关闭" },
     settings: { languageSelect: "语言选择", system: "系统设置", language: "语言", theme: "主题", notifications: "通知设置", alarm_comment: "评论通知", alarm_like: "点赞通知", alarm_follow: "关注通知", privacy: "隐私设置", change_password: "修改密码", connect_sns: "关联SNS账号", withdraw: "注销账号", withdraw_phrase: "我要注销账号", withdraw_btn_confirm: "注销", confirm_password: "确认密码", support_policy: "支持与政策", help_center: "帮助中心", terms: "服务条款", privacy_policy: "隐私政策", marketing_consent: "营销同意" },
     profile: { edit_profile: "编辑资料", following: "关注中", followers: "粉丝", joined: "加入于 {{date}}", tabs: { posts: "帖子", replies: "回复", media: "媒体", likes: "喜欢" }, no_posts: "暂无帖子", no_replies: "暂无回复" },
     tweets: { placeholder_tweet: "有什么新鲜事？", placeholder_reply: "发布你的回复", btn_post: "发布", btn_reply: "回复", add_photo: "添加图片" },
     tweet: { delete_msg_title: "确定删除吗？", delete_msg_desc: "删除后无法恢复。", delete_success: "已删除。", no_replies: "暂无回复", be_first: "抢占沙发！" },
     trending: { title: "趋势", no_trending: "暂无趋势" },

  },
  // 3. Russian (ru)
  ru: {
     nav: { home: "Главная", study: "Учеба", community: "Сообщество", chat: "Чат", notifications: "Уведомления", more: "Ещё", settings: "Настройки", profile: "Профиль", post: "Пост" },
     notification: { like_feed: "понравился ваш пост.", user_action: "{{name}}", new: "Новое", deleted_post: "Пост удален.", deleted_comment: "Комментарий удален.", comment_feed: "прокомментировал ваш пост.", like_comment: "понравился ваш комментарий.", follow_msg: "подписался на вас.", repost_msg: "репостнул вашу запись.", mention_msg: "упомянул вас." },
     study: { 
         search_placeholder: "Поиск...", no_content: "Контент не найден.", 
         category: { all: "Все", drama: "Дорама", movie: "Фильм", entertainment: "Шоу", music: "Музыка" }, 
         level: { title: "Уровень", all: "Все", beginner: "Начальный", intermediate: "Средний", advanced: "Продвинутый" }, 
         formats: { episode: "Эп {{val}}", scene: "Сцена {{val}}" }, 
         guide: { prev: "Назад", next: "Вперед", start: "Старт", close: "Закрыть", never_show: "Не показывать" },
         no_title: "Без названия", no_episode: "Нет эпизода", share_text_prefix: "Учите с K-Content: ", meta_desc_default: "Учите корейский весело в ARA",
         study_card_title: "Карточка обучения", vocab_explanation: "Словарь", culture_note: "Культурная заметка"
     },
     auth: { 
         login: "Войти", signup: "Регистрация", logout: "Выйти", login_needed: "Требуется вход", please_login: "Пожалуйста, войдите", click_to_login: "Нажмите для входа",
         welcome: "Добро пожаловать", email: "Email", password: "Пароль", logging_in: "Вход...", auto_login: "Авто-вход",
         find_email: "Найти Email", find_password: "Найти пароль", resend_verification: "Отправить повторно", first_time: "Впервые здесь?",
         login_with_google: "Войти через Google", login_with_kakao: "Войти через Kakao", verification_sent: "Письмо отправлено", email_verification_failed: "Ошибка проверки",
         verify_before_login: "Подтвердите Email перед входом", invalid_credentials: "Неверные данные"
     },
     common: { loading: "Загрузка...", save: "Сохранить", cancel: "Отмена", delete: "Удалить", edit: "Изменить", my_profile: "Мой профиль", my_account: "Мой аккаунт", view_profile: "Профиль", settings_desc: "Настройки", search: "Поиск", back: "Назад", apply: "Применить", error: "Ошибка", close: "Закрыть" },
     settings: { languageSelect: "Язык", system: "Система", language: "Язык", theme: "Тема", notifications: "Уведомления", alarm_comment: "Комментарии", alarm_like: "Лайки", alarm_follow: "Подписки", privacy: "Приватность", change_password: "Сменить пароль", connect_sns: "Соцсети", withdraw: "Удалить аккаунт", withdraw_phrase: "Удалить мой аккаунт", withdraw_btn_confirm: "Удалить", confirm_password: "Подтвердите пароль", support_policy: "Поддержка и политика", help_center: "Центр помощи", terms: "Условия использования", privacy_policy: "Политика конфиденциальности", marketing_consent: "Согласие на маркетинг" },
     profile: { edit_profile: "Ред. профиль", following: "Подписки", followers: "Подписчики", joined: "Регистрация {{date}}", tabs: { posts: "Посты", replies: "Ответы", media: "Медиа", likes: "Лайки" }, no_posts: "Нет постов", no_replies: "Нет ответов" },
     tweets: { placeholder_tweet: "Что нового?", placeholder_reply: "Ваш ответ...", btn_post: "Опубликовать", btn_reply: "Ответить", add_photo: "Фото" },
     tweet: { delete_msg_title: "Удалить?", delete_msg_desc: "Это действие необратимо.", delete_success: "Удалено.", no_replies: "Нет ответов", be_first: "Будьте первым!" },
     trending: { title: "Тренды", no_trending: "Нет трендов" },

  },
  // 4. Vietnamese (vi)
  vi: {
     nav: { home: "Trang chủ", study: "Học tập", community: "Cộng đồng", chat: "Trò chuyện", notifications: "Thông báo", more: "Thêm", settings: "Cài đặt", profile: "Hồ sơ", post: "Đăng" },
     notification: { like_feed: "đã thích bài viết của bạn.", user_action: "{{name}}", new: "Mới", deleted_post: "Bài viết đã xóa.", deleted_comment: "Bình luận đã xóa.", comment_feed: "đã bình luận bài viết.", like_comment: "đã thích bình luận.", follow_msg: "đã theo dõi bạn.", repost_msg: "đã đăng lại bài viết.", mention_msg: "đã nhắc đến bạn." },
     study: { 
         search_placeholder: "Tìm kiếm...", no_content: "Không tìm thấy nội dung.", 
         category: { all: "Tất cả", drama: "Phim bộ", movie: "Phim lẻ", entertainment: "Giải trí", music: "Âm nhạc" }, 
         level: { title: "Độ khó", all: "Tất cả", beginner: "Sơ cấp", intermediate: "Trung cấp", advanced: "Cao cấp" }, 
         formats: { episode: "Tập {{val}}", scene: "Cảnh {{val}}" }, 
         guide: { prev: "Trước", next: "Sau", start: "Bắt đầu", close: "Đóng", never_show: "Không hiện lại" },
         no_title: "Không tiêu đề", no_episode: "Không tập", share_text_prefix: "Học cùng K-Content: ", meta_desc_default: "Học tiếng Hàn vui vẻ tại ARA",
         study_card_title: "Thẻ học tập", vocab_explanation: "Giải thích từ vựng", culture_note: "Ghi chú văn hóa"
     },
     auth: { 
         login: "Đăng nhập", signup: "Đăng ký", logout: "Đăng xuất", login_needed: "Cần đăng nhập", please_login: "Vui lòng đăng nhập", click_to_login: "Nhấn để đăng nhập",
         welcome: "Chào mừng", email: "Email", password: "Mật khẩu", logging_in: "Đang đăng nhập...", auto_login: "Tự động đăng nhập",
         find_email: "Tìm Email", find_password: "Tìm mật khẩu", resend_verification: "Gửi lại xác thực", first_time: "Lần đầu tiên?",
         login_with_google: "Đăng nhập Google", login_with_kakao: "Đăng nhập Kakao", verification_sent: "Đã gửi xác thực", email_verification_failed: "Xác thực thất bại",
         verify_before_login: "Vui lòng xác thực email", invalid_credentials: "Thông tin sai lệch"
     },
     common: { loading: "Đang tải...", save: "Lưu", cancel: "Hủy", delete: "Xóa", edit: "Sửa", my_profile: "Hồ sơ của tôi", my_account: "Tài khoản", view_profile: "Xem hồ sơ", settings_desc: "Cài đặt", search: "Tìm kiếm", back: "Quay lại", apply: "Áp dụng", error: "Lỗi", close: "Đóng" },
     settings: { languageSelect: "Ngôn ngữ", system: "Hệ thống", language: "Ngôn ngữ", theme: "Giao diện", notifications: "Thông báo", alarm_comment: "Bình luận", alarm_like: "Lượt thích", alarm_follow: "Theo dõi", privacy: "Riêng tư", change_password: "Đổi mật khẩu", connect_sns: "Liên kết SNS", withdraw: "Xóa tài khoản", withdraw_phrase: "Xóa tài khoản của tôi", withdraw_btn_confirm: "Xóa", confirm_password: "Xác nhận mật khẩu", support_policy: "Hỗ trợ & Chính sách", help_center: "Trung tâm trợ giúp", terms: "Điều khoản dịch vụ", privacy_policy: "Chính sách bảo mật", marketing_consent: "Đồng ý tiếp thị" },
     profile: { edit_profile: "Sửa hồ sơ", following: "Đang theo dõi", followers: "Người theo dõi", joined: "Tham gia {{date}}", tabs: { posts: "Bài viết", replies: "Trả lời", media: "Media", likes: "Thích" }, no_posts: "Chưa có bài viết", no_replies: "Chưa có trả lời" },
     tweets: { placeholder_tweet: "Đang xảy ra chuyện gì?", placeholder_reply: "Đăng trả lời...", btn_post: "Đăng", btn_reply: "Trả lời", add_photo: "Thêm ảnh" },
     tweet: { delete_msg_title: "Xóa?", delete_msg_desc: "Không thể khôi phục.", delete_success: "Đã xóa.", no_replies: "Chưa có trả lời", be_first: "Hãy là người đầu tiên!" },
     trending: { title: "Xu hướng", no_trending: "Không có xu hướng" },

  },
  // 5. Bengali (bn)
  bn: {
     nav: { home: "হোম", study: "পড়া", community: "কমিউনিটি", chat: "চ্যাট", notifications: "বিজ্ঞপ্তি", more: "আরও", settings: "সেটিংস", profile: "প্রোফাইল", post: "পোস্ট" },
     study: { 
         search_placeholder: "অনুসন্ধান...", no_content: "কোন বিষয়বস্তু নেই।", 
         category: { all: "সব", drama: "নাটক", movie: "সিনেমা", entertainment: "বিনোদন", music: "গান" }, 
         level: { title: "স্তর", all: "সব", beginner: "নতুন", intermediate: "মাঝারি", advanced: "উন্নত" }, 
         formats: { episode: "পর্ব {{val}}", scene: "দৃশ্য {{val}}" }, 
         guide: { prev: "পূর্ববর্তী", next: "পরবর্তী", start: "শুরু", close: "বন্ধ", never_show: "আর দেখাবেন না" },
         no_title: "শিরোনামহীন", no_episode: "পর্ব নেই", share_text_prefix: "K-Content দিয়ে শিখুন: ", meta_desc_default: "ARA তে কোরিয়ান শিখুন",
         study_card_title: "স্টাডি কার্ড", vocab_explanation: "শব্দার্থ", culture_note: "সংস্কৃতি নোট"
     },
     auth: { 
         login: "লগইন", signup: "সাইন আপ", logout: "লগআউট", login_needed: "লগইন প্রয়োজন", please_login: "অনুগ্রহ করে লগইন করুন", click_to_login: "লগইন করতে ক্লিক করুন",
         welcome: "স্বাগতম", email: "ইমেল", password: "পাসওয়ার্ড", logging_in: "লগইন হচ্ছে...", auto_login: "অটো লগইন",
         find_email: "ইমেল খুঁজুন", find_password: "পাসওয়ার্ড খুঁজুন", resend_verification: "পুনরায় পাঠান", first_time: "প্রথমবার?",
         login_with_google: "Google দিয়ে লগইন", login_with_kakao: "Kakao দিয়ে লগইন", verification_sent: "যাচাইকরণ পাঠানো হয়েছে", email_verification_failed: "ব্যর্থ হয়েছে",
         verify_before_login: "ইমেল যাচাই করুন", invalid_credentials: "ভুল তথ্য"
     },
     common: { loading: "লোড হচ্ছে...", save: "সংরক্ষণ", cancel: "বাতিল", delete: "মুছুন", edit: "সম্পাদনা", my_profile: "আমার প্রোফাইল", my_account: "আমার অ্যাকাউন্ট", view_profile: "প্রোফাইল দেখুন", settings_desc: "সেটিংস", search: "অনুসন্ধান", back: "ফিরে যান", apply: "প্রয়োগ", error: "ত্রুটি" },
     notification: { like_feed: "আপনার পোস্ট পছন্দ করেছেন।", user_action: "{{name}}", new: "নতুন", deleted_post: "পোস্ট মুছে ফেলা হয়েছে।", deleted_comment: "মন্তব্য মুছে ফেলা হয়েছে।", comment_feed: "আপনার পোস্টে মন্তব্য করেছেন।", like_comment: "আপনার মন্তব্য পছন্দ করেছেন।", follow_msg: "আপনাকে অনুসরণ করছেন।", repost_msg: "আপনার পোস্ট রিপোস্ট করেছেন।", mention_msg: "আপনাকে উল্লেখ করেছেন।" },
     settings: { languageSelect: "ভাষা নির্বাচন", system: "সিস্টেম সেটিংস", language: "ভাষা", theme: "থিম", notifications: "বিজ্ঞপ্তি সেটিংস", alarm_comment: "মন্তব্য বিজ্ঞপ্তি", alarm_like: "লাইক বিজ্ঞপ্তি", alarm_follow: "ফলো বিজ্ঞপ্তি", privacy: "গোপনীয়তা সেটিংস", change_password: "পাসওয়ার্ড পরিবর্তন", connect_sns: "SNS অ্যাকাউন্ট সংযুক্ত করুন", withdraw: "অ্যাকাউন্ট মুছুন", withdraw_phrase: "আমার অ্যাকাউন্ট মুছুন", withdraw_btn_confirm: "মুছুন", confirm_password: "পাসওয়ার্ড নিশ্চিত করুন", support_policy: "সাপোর্ট এবং নীতি", help_center: "সাহায্য কেন্দ্র", terms: "সেবার শর্তাবলী", privacy_policy: "গোপনীয়তা নীতি", marketing_consent: "মার্কেটিং সম্মতি" },
     profile: { edit_profile: "প্রোফাইল সম্পাদনা", following: "অনুসরণ করছেন", followers: "অনুসারী", joined: "{{date}}-এ যোগ দিয়েছেন", tabs: { posts: "পোস্ট", replies: "উত্তর", media: "মিডিয়া", likes: "পছন্দ" }, no_posts: "এখনও কোনও পোস্ট নেই", no_replies: "এখনও কোনও উত্তর নেই" },
     tweets: { placeholder_tweet: "কী হচ্ছে?", placeholder_reply: "আপনার উত্তর পোস্ট করুন", btn_post: "পোস্ট", btn_reply: "উত্তর", add_photo: "ছবি যোগ করুন" },
     tweet: { delete_msg_title: "পোস্ট মুছবেন?", delete_msg_desc: "এটি পূর্বাবস্থায় ফেরানো যাবে না।", delete_success: "মুছে ফেলা হয়েছে।", no_replies: "এখনও কোনও উত্তর নেই", be_first: "প্রথমে উত্তর দিন!" },
     trending: { title: "আপনার জন্য ট্রেন্ডিং", no_trending: "কোন ট্রেন্ড নেই" },
     chat: { direct_chat: "বার্তা", select_or_start: "বাম দিক থেকে চ্যাটরুম নির্বাচন করুন বা", start_conversation: "নতুন চ্যাট বাটন টিপে কথোপকথন শুরু করুন।", me: "আমি", search_placeholder: "বার্তা অনুসন্ধান", search_btn: "অনুসন্ধান", send_first_message: "আপনার প্রথম বার্তা পাঠান!", feature_realtime: "💬 রিয়েল-টাইম ১:১ মেসেজিং", feature_search: "👥 অনুসন্ধান এবং আমন্ত্রণ", feature_responsive: "📱 রেসপন্সিভ ডিজাইন", no_chats: "অভী কোনো চ্যাটরুম নেই। নতুন চ্যাট টিপে কথোপকথন শুরু করুন।" }
  },
  // 6. Arabic (ar)
  ar: {
     nav: { home: "الرئيسية", study: "دراسة", community: "مجتمع", chat: "دردشة", notifications: "إشعارات", more: "المزيد", settings: "إعدادات", profile: "ملف الشخصي", post: "نشر" },
     study: { 
         search_placeholder: "بحث...", no_content: "لا يوجد محتوى.", 
         category: { all: "الكل", drama: "دراما", movie: "أفلام", entertainment: "ترفيه", music: "موسيقى" }, 
         level: { title: "مستوى", all: "الكل", beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" }, 
         formats: { episode: "حلقة {{val}}", scene: "مشهد {{val}}" }, 
         guide: { prev: "سابق", next: "تالية", start: "بدء", close: "إغلاق", never_show: "لا تظهر مرة أخرى" },
         no_title: "بلا عنوان", no_episode: "بلا حلقة", share_text_prefix: "تعلم مع المحتوى الكوري: ", meta_desc_default: "تعلم الكورية مع ARA",
         study_card_title: "بطاقة الدراسة", vocab_explanation: "شرح المفردات", culture_note: "ملاحظة ثقافية"
     },
     auth: { 
         login: "دخول", signup: "تسجيل", logout: "خروج", login_needed: "يجب تسجيل الدخول", please_login: "يرجى تسجيل الدخول", click_to_login: "انقر للدخول",
         welcome: "مرحباً", email: "بريد إلكتروني", password: "كلمة المرور", logging_in: "جاري الدخول...", auto_login: "دخول تلقائي",
         find_email: "بحث عن بريد", find_password: "استعادة كلمة المرور", resend_verification: "إعادة إرسال", first_time: "لأول مرة؟",
         login_with_google: "دخول بـ Google", login_with_kakao: "دخول بـ Kakao", verification_sent: "تم إرسال التحقق", email_verification_failed: "فشل التحقق",
         verify_before_login: "تحقق من بريدك", invalid_credentials: "بيانات غير صالحة"
     },
     common: { loading: "تحميل...", save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", my_profile: "ملفي", my_account: "حسابي", view_profile: "عرض الملف", settings_desc: "إعدادات", search: "بحث", back: "عودة", apply: "تطبيق", error: "خطأ" },
     notification: { like_feed: "أعجب بمنشورك.", user_action: "{{name}}", new: "جديد", deleted_post: "تم حذف المنشور.", deleted_comment: "تم حذف التعليق.", comment_feed: "علق على منشورك.", like_comment: "أعجب بتعليقك.", follow_msg: "بدأ بمتابعتك.", repost_msg: "أعاد نشر منشورك.", mention_msg: "أشار إليك." },
     settings: { languageSelect: "اختيار اللغة", system: "إعدادات النظام", language: "اللغة", theme: "السمة", notifications: "إعدادات الإشعارات", alarm_comment: "إشعارات التعليقات", alarm_like: "إشعارات الإعجاب", alarm_follow: "إشعارات المتابعة", privacy: "إعدادات الخصوصية", change_password: "تغيير كلمة المرور", connect_sns: "ربط حساب SNS", withdraw: "حذف الحساب", withdraw_phrase: "حذف حسابي", withdraw_btn_confirm: "حذف", confirm_password: "تأكيد كلمة المرور", support_policy: "الدعم والسياسة", help_center: "مركز المساعدة", terms: "شروط الخدمة", privacy_policy: "سياسة الخصوصية", marketing_consent: "موافقة التسويق" },
     profile: { edit_profile: "تعديل الملف الشخصي", following: "أتابع", followers: "المتابعون", joined: "انضم في {{date}}", tabs: { posts: "المنشورات", replies: "الردود", media: "الوسائط", likes: "الإعجابات" }, no_posts: "لا توجد منشورات حتى الآن", no_replies: "لا توجد ردود حتى الآن" },
     tweets: { placeholder_tweet: "ماذا يحدث؟", placeholder_reply: "انشر ردك", btn_post: "نشر", btn_reply: "رد", add_photo: "إضافة صورة" },
     tweet: { delete_msg_title: "حذف المنشور؟", delete_msg_desc: "لا يمكن التراجع عن هذا.", delete_success: "تم الحذف.", no_replies: "لا توجد ردود حتى الآن", be_first: "كن أول من يرد!" },
     trending: { title: "المتداول لك", no_trending: "لا توجد اتجاهات متاحة" },
     chat: { direct_chat: "الرسائل", select_or_start: "حدد غرفة دردشة من اليسار أو", start_conversation: "اضغط على زر \"New Chat\" لبدء محادثة.", me: "أنا", search_placeholder: "بحث في الرسائل", search_btn: "بحث", send_first_message: "أرسل رسالتك الأولى!", feature_realtime: "💬 مراسلة 1:1 فورية", feature_search: "👥 بحث ودعوة", feature_responsive: "📱 تصميم متجاوب", no_chats: "لا توجد غرف دردشة بعد. اضغط على زر \"New Chat\" لبدء محادثة." }
  },
  // 7. Hindi (hi)
  hi: {
     nav: { home: "होम", study: "अध्ययन", community: "समुदाय", chat: "चैट", notifications: "सूचना", more: "अधिक", settings: "सेटिंग्स", profile: "प्रोफाइल", post: "पोस्ट" },
     study: { 
         search_placeholder: "खोजें...", no_content: "कोई सामग्री नहीं।", 
         category: { all: "सभी", drama: "ड्रामा", movie: "फिल्म", entertainment: "मनोरंजन", music: "संगीत" }, 
         level: { title: "स्तर", all: "सभी", beginner: "शुरुआती", intermediate: "मध्यम", advanced: "उन्नत" }, 
         formats: { episode: "एपिसोड {{val}}", scene: "दृश्य {{val}}" }, 
         guide: { prev: "पिछला", next: "अगला", start: "शुरू", close: "बंद", never_show: "फिर न दिखाएं" },
         no_title: "शीर्षकहीन", no_episode: "कोई एपिसोड नहीं", share_text_prefix: "K-Content से सीखें: ", meta_desc_default: "ARA पर कोरियाई सीखें",
         study_card_title: "स्टडी कार्ड", vocab_explanation: "शब्दावली", culture_note: "संस्कृति नोट"
     },
     auth: { 
         login: "लॉगिन", signup: "साइन अप", logout: "लॉगआउट", login_needed: "लॉगिन आवश्यक", please_login: "कृपया लॉगिन करें", click_to_login: "लॉगिन के लिए क्लिक करें",
         welcome: "स्वागत है", email: "ईमेल", password: "पासवर्ड", logging_in: "लॉगिन हो रहा है...", auto_login: "ऑटो लॉगिन",
         find_email: "ईमेल खोजें", find_password: "पासवर्ड खोजें", resend_verification: "पुनः भेजें", first_time: "पहली बार?",
         login_with_google: "Google से लॉगिन", login_with_kakao: "Kakao से लॉगिन", verification_sent: "सत्यापन भेजा गया", email_verification_failed: "सत्यापन विफल",
         verify_before_login: "ईमेल सत्यापित करें", invalid_credentials: "अमान्य जानकारी"
     },
     common: { loading: "लोड हो रहा है...", save: "सहेजें", cancel: "रद्द", delete: "हटाएं", edit: "संपादित करें", my_profile: "मेरी प्रोफाइल", my_account: "मेरा खाता", view_profile: "प्रोफाइल देखें", settings_desc: "सेटिंग्स", search: "खोजें", back: "वापस", apply: "लागू करें", error: "त्रुटि" },
     notification: { like_feed: "ने आपकी पोस्ट पसंद की।", user_action: "{{name}}", new: "नया", deleted_post: "पोस्ट हटा दी गई।", deleted_comment: "टिप्पणी हटा दी गई।", comment_feed: "ने आपकी पोस्ट पर टिप्पणी की।", like_comment: "ने आपकी टिप्पणी पसंद की।", follow_msg: "ने आपको फॉलो किया।", repost_msg: "ने आपकी पोस्ट रीपोस्ट की।", mention_msg: "ने आपका उल्लेख किया।" },
     settings: { languageSelect: "भाषा चुनें", system: "सिस्टम सेटिंग्स", language: "भाषा", theme: "थीम", notifications: "सूचना सेटिंग्स", alarm_comment: "टिप्पणी सूचनाएं", alarm_like: "लाइक सूचनाएं", alarm_follow: "फॉलो सूचनाएं", privacy: "गोपनीयता सेटिंग्स", change_password: "पासवर्ड बदलें", connect_sns: "SNS खाता जोड़ें", withdraw: "खाता हटाएं", withdraw_phrase: "मेरा खाता हटाएं", withdraw_btn_confirm: "हटाएं", confirm_password: "पासवर्ड की पुष्टि करें", support_policy: "समर्थन और नीति", help_center: "सहायता केंद्र", terms: "सेवा की शर्तें", privacy_policy: "गोपनीयता नीति", marketing_consent: "मार्केटिंग सहमति" },
     profile: { edit_profile: "प्रोफाइल संपादित करें", following: "फॉलो कर रहे हैं", followers: "फॉलोअर्स", joined: "{{date}} को शामिल हुए", tabs: { posts: "पोस्ट", replies: "उत्तर", media: "मीडिया", likes: "पसंद" }, no_posts: "कोई पोस्ट नहीं", no_replies: "कोई उत्तर नहीं" },
     tweets: { placeholder_tweet: "क्या हो रहा है?", placeholder_reply: "अपना उत्तर पोस्ट करें", btn_post: "पोस्ट", btn_reply: "उत्तर", add_photo: "फोटो जोड़ें" },
     tweet: { delete_msg_title: "पोस्ट हटाएं?", delete_msg_desc: "इसे पूर्ववत नहीं किया जा सकता।", delete_success: "हटा दिया गया।", no_replies: "कोई उत्तर नहीं", be_first: "उत्तर देने वाले पहले व्यक्ति बनें!" },
     trending: { title: "आपके लिए ट्रेंडिंग", no_trending: "कोई ट्रेंड उपलब्ध नहीं" },
     chat: { direct_chat: "संदेश", select_or_start: "बाएं से चैटरूम चुनें या", start_conversation: "बातचीत शुरू करने के लिए \"New Chat\" बटन दबाएं।", me: "मैं", search_placeholder: "संदेश खोजें", search_btn: "खोजें", send_first_message: "अपना पहला संदेश भेजें!", feature_realtime: "💬 रीयल-टाइम 1:1 मैसेजिंग", feature_search: "👥 खोज और आमंत्रण", feature_responsive: "📱 रिस्पॉन्सिव डिज़ाइन", no_chats: "अभी कोई चैटरूम नहीं है। बातचीत शुरू करने के लिए \"New Chat\" दबाएं।" }
  },
  // 8. Thai (th)
  th: {
     nav: { home: "หน้าหลัก", study: "เรียนรู้", community: "ชุมชน", chat: "แชท", notifications: "แจ้งเตือน", more: "เพิ่มเติม", settings: "ตั้งค่า", profile: "โปรไฟล์", post: "โพสต์" },
     study: { 
         search_placeholder: "ค้นหา...", no_content: "ไม่พบเนื้อหา", 
         category: { all: "ทั้งหมด", drama: "ละคร", movie: "ภาพยนตร์", entertainment: "บันเทิง", music: "เพลง" }, 
         level: { title: "ระดับ", all: "ทั้งหมด", beginner: "ต้น", intermediate: "กลาง", advanced: "สูง" }, 
         formats: { episode: "ตอนที่ {{val}}", scene: "ฉาก {{val}}" }, 
         guide: { prev: "ก่อนหน้า", next: "ถัดไป", start: "เริ่ม", close: "ปิด", never_show: "ไม่แสดงอีก" },
         no_title: "ไม่มีชื่อ", no_episode: "ไม่มีตอน", share_text_prefix: "เรียนกับ K-Content: ", meta_desc_default: "เรียนภาษาเกาหลีที่ ARA",
         study_card_title: "การ์ดเรียนรู้", vocab_explanation: "คำศัพท์", culture_note: "วัฒนธรรม"
     },
     auth: { 
         login: "เข้าสู่ระบบ", signup: "สมัครสมาชิก", logout: "ออกจากระบบ", login_needed: "ต้องเข้าสู่ระบบ", please_login: "กรุณาเข้าสู่ระบบ", click_to_login: "คลิกเพื่อเข้าสู่ระบบ",
         welcome: "ยินดีต้อนรับ", email: "อีเมล", password: "รหัสผ่าน", logging_in: "กำลังเข้า...", auto_login: "เข้าสู่อัตโนมัติ",
         find_email: "หาอีเมล", find_password: "หารหัสผ่าน", resend_verification: "ส่งซ้ำ", first_time: "ครั้งแรก?",
         login_with_google: "เข้าด้วย Google", login_with_kakao: "เข้าด้วย Kakao", verification_sent: "ส่งยืนยันแล้ว", email_verification_failed: "ยืนยันล้มเหลว",
         verify_before_login: "ตรวจสอบอีเมล", invalid_credentials: "ข้อมูลไม่ถูกต้อง"
     },
     common: { loading: "กำลังโหลด...", save: "บันทึก", cancel: "ยกเลิก", delete: "ลบ", edit: "แก้ไข", my_profile: "โปรไฟล์ของฉัน", my_account: "บัญชีของฉัน", view_profile: "ดูโปรไฟล์", settings_desc: "การตั้งค่า", search: "ค้นหา", back: "กลับ", apply: "นำไปใช้", error: "ข้อผิดพลาด" },
     notification: { like_feed: "ถูกใจโพสต์ของคุณ", user_action: "{{name}}", new: "ใหม่", deleted_post: "โพสต์ถูกลบ", deleted_comment: "ความคิดเห็นถูกลบ", comment_feed: "แสดงความคิดเห็นบนโพสต์ของคุณ", like_comment: "ถูกใจความคิดเห็นของคุณ", follow_msg: "เริ่มติดตามคุณ", repost_msg: "รีโพสต์โพสต์ของคุณ", mention_msg: "กล่าวถึงคุณ" },
     settings: { languageSelect: "เลือกภาษา", system: "ตั้งค่าระบบ", language: "ภาษา", theme: "ธีม", notifications: "ตั้งค่าการแจ้งเตือน", alarm_comment: "แจ้งเตือนความคิดเห็น", alarm_like: "แจ้งเตือนการถูกใจ", alarm_follow: "แจ้งเตือนการติดตาม", privacy: "ความเป็นส่วนตัว", change_password: "เปลี่ยนรหัสผ่าน", connect_sns: "เชื่อมต่อบัญชีโซเชียล", withdraw: "ลบบัญชี", withdraw_phrase: "ฉันต้องการลบบัญชี", withdraw_btn_confirm: "ลบบัญชี", confirm_password: "ยืนยันรหัสผ่าน", support_policy: "การสนับสนุนและนโยบาย", help_center: "ศูนย์ช่วยเหลือ", terms: "ข้อกำหนดการบริการ", privacy_policy: "นโยบายความเป็นส่วนตัว", marketing_consent: "การยินยอมการตลาด" },
     profile: { edit_profile: "แก้ไขโปรไฟล์", following: "กำลังติดตาม", followers: "ผู้ติดตาม", joined: "เข้าร่วมเมื่อ {{date}}", tabs: { posts: "โพสต์", replies: "การตอบกลับ", media: "สื่อ", likes: "ถูกใจ" }, no_posts: "ไม่มีโพสต์", no_replies: "ไม่มีการตอบกลับ" },
     tweets: { placeholder_tweet: "เกิดอะไรขึ้นบ้าง?", placeholder_reply: "โพสต์คำตอบ...", btn_post: "โพสต์", btn_reply: "ตอบกลับ", add_photo: "เพิ่มรูปภาพ" },
     tweet: { delete_msg_title: "ลบโพสต์?", delete_msg_desc: "การกระทำนี้ไม่สามารถยกเลิกได้", delete_success: "ลบแล้ว", no_replies: "ยังไม่มีการตอบกลับ", be_first: "เป็นคนแรกที่ตอบกลับ!" },
     trending: { title: "เทรนด์สำหรับคุณ", no_trending: "ไม่มีเทรนด์" },
     chat: { direct_chat: "ข้อความ", select_or_start: "ซ้ายจากเลือกห้องแชทหรือ", start_conversation: "กดปุ่ม \"New Chat\" เพื่อเริ่มสนทนา", me: "ฉัน", search_placeholder: "ค้นหาข้อความ", search_btn: "ค้นหา", send_first_message: "ส่งข้อความแรก!", feature_realtime: "💬 แชท 1:1 แบบเรียลไทม์", feature_search: "👥 ค้นหาและเชิญ", feature_responsive: "📱 รองรับทุกอุปกรณ์", no_chats: "ยังไม่มีห้องแชท กด \"New Chat\" เพื่อเริ่มสนทนา" }
  },
  // 9. German (de)
  de: {
     nav: { home: "Start", study: "Lernen", community: "Community", chat: "Chat", notifications: "Benachr.", more: "Mehr", settings: "Einst.", profile: "Profil", post: "Posten" },
     study: { 
         search_placeholder: "Suchen...", no_content: "Kein Inhalt.", 
         category: { all: "Alle", drama: "Drama", movie: "Film", entertainment: "Unterhaltung", music: "Musik" }, 
         level: { title: "Stufe", all: "Alle", beginner: "Anfänger", intermediate: "Mittelstufe", advanced: "Fortgeschritten" }, 
         formats: { episode: "Ep {{val}}", scene: "Szene {{val}}" }, 
         guide: { prev: "Zurück", next: "Weiter", start: "Start", close: "Schließen", never_show: "Nicht mehr anzeigen" },
         no_title: "Kein Titel", no_episode: "Keine Episode", share_text_prefix: "Lerne mit K-Content: ", meta_desc_default: "Lerne Koreanisch bei ARA",
         study_card_title: "Lernkarte", vocab_explanation: "Wortschatz", culture_note: "Kulturhinweis"
     },
     auth: { 
         login: "Anmelden", signup: "Registrieren", logout: "Abmelden", login_needed: "Anmeldung erforderlich", please_login: "Bitte anmelden", click_to_login: "Klicken zum Anmelden",
         welcome: "Willkommen", email: "E-Mail", password: "Passwort", logging_in: "Anmelden...", auto_login: "Auto-Login",
         find_email: "E-Mail suchen", find_password: "Passwort vergessen", resend_verification: "Erneut senden", first_time: "Neu hier?",
         login_with_google: "Mit Google", login_with_kakao: "Mit Kakao", verification_sent: "Verifizierung gesendet", email_verification_failed: "Verifizierung fehlgeschlagen",
         verify_before_login: "Bitte E-Mail bestätigen", invalid_credentials: "Daten ungültig"
     },
     common: { loading: "Laden...", save: "Speichern", cancel: "Abbrechen", delete: "Löschen", edit: "Bearbeiten", my_profile: "Mein Profil", my_account: "Mein Konto", view_profile: "Profil ansehen", settings_desc: "Einstellungen", search: "Suchen", back: "Zurück", apply: "Anwenden", error: "Fehler" },
     notification: { like_feed: "hat deinen Beitrag geliked.", user_action: "{{name}}", new: "Neu", deleted_post: "Beitrag gelöscht.", deleted_comment: "Kommentar gelöscht.", comment_feed: "hat deinen Beitrag kommentiert.", like_comment: "hat deinen Kommentar geliked.", follow_msg: "folgt dir jetzt.", repost_msg: "hat deinen Beitrag geteilt.", mention_msg: "hat dich erwähnt." },
     settings: { languageSelect: "Sprache wählen", system: "System", language: "Sprache", theme: "Design", notifications: "Benachrichtigungen", alarm_comment: "Kommentare", alarm_like: "Likes", alarm_follow: "Follower", privacy: "Datenschutz", change_password: "Passwort ändern", connect_sns: "Social Media verbinden", withdraw: "Konto löschen", withdraw_phrase: "Mein Konto löschen", withdraw_btn_confirm: "Löschen", confirm_password: "Passwort bestätigen", support_policy: "Support & Richtlinien", help_center: "Hilfe-Center", terms: "Nutzungsbedingungen", privacy_policy: "Datenschutzrichtlinie", marketing_consent: "Marketing-Zustimmung" },
     profile: { edit_profile: "Profil bearbeiten", following: "Folge ich", followers: "Follower", joined: "Beigetreten {{date}}", tabs: { posts: "Beiträge", replies: "Antworten", media: "Medien", likes: "Gefällt mir" }, no_posts: "Keine Beiträge", no_replies: "Keine Antworten" },
     tweets: { placeholder_tweet: "Was gibt's Neues?", placeholder_reply: "Deine Antwort posten", btn_post: "Posten", btn_reply: "Antworten", add_photo: "Foto hinzufügen" },
     tweet: { delete_msg_title: "Beitrag löschen?", delete_msg_desc: "Kann nicht rückgängig gemacht werden.", delete_success: "Gelöscht.", no_replies: "Keine Antworten", be_first: "Sei der Erste!" },
     trending: { title: "Trends für dich", no_trending: "Keine Trends" },
     chat: { direct_chat: "Nachrichten", select_or_start: "Wähle eine Nachricht", start_conversation: "Neue Konversation", me: "Ich", search_placeholder: "Nachrichten suchen", send_first_message: "Schreib die erste Nachricht!", feature_realtime: "💬 Echtzeit-Chat", feature_search: "👥 Suchen & Einladen", feature_responsive: "📱 Responsives Design" }
  },
  // 10. Finnish (fi)
  fi: {
     nav: { home: "Koti", study: "Opiskelu", community: "Yhteisö", chat: "Chat", notifications: "Ilmoit.", more: "Lisää", settings: "Asetukset", profile: "Profiili", post: "Julkaise" },
     study: { 
         search_placeholder: "Hae...", no_content: "Ei sisältöä.", 
         category: { all: "Kaikki", drama: "Draama", movie: "Elokuva", entertainment: "Viihde", music: "Musiikki" }, 
         level: { title: "Taso", all: "Kaikki", beginner: "Aloittelija", intermediate: "Keskitaso", advanced: "Edistynyt" }, 
         formats: { episode: "Jakso {{val}}", scene: "Kohtaus {{val}}" }, 
         guide: { prev: "Edel", next: "Seur", start: "Aloita", close: "Sulje", never_show: "Älä näytä" },
         no_title: "Ei otsikkoa", no_episode: "Ei jaksoa", share_text_prefix: "Opi K-Contentin avulla: ", meta_desc_default: "Opi koreaa ARA:ssa",
         study_card_title: "Opiskelukortti", vocab_explanation: "Sanasto", culture_note: "Kulttuuri"
     },
     auth: { 
         login: "Kirjaudu", signup: "Rekisteröidy", logout: "Ulos", login_needed: "Kirjautuminen vaaditaan", please_login: "Kirjaudu sisään", click_to_login: "Klikkaa kirjautuaksesi",
         welcome: "Tervetuloa", email: "Sähköposti", password: "Salasana", logging_in: "Kirjaudutaan...", auto_login: "Automaattinen",
         find_email: "Etsi sähköposti", find_password: "Etsi salasana", resend_verification: "Lähetä uudelleen", first_time: "Ensimmäistä kertaa?",
         login_with_google: "Google-kirjautuminen", login_with_kakao: "Kakao-kirjautuminen", verification_sent: "Vahvistus lähetetty", email_verification_failed: "Vahvistus epäonnistui",
         verify_before_login: "Vahvista sähköpostisi", invalid_credentials: "Virheelliset tiedot"
     },
     common: { loading: "Ladataan...", save: "Tallenna", cancel: "Peruuta", delete: "Poista", edit: "Muokkaa", my_profile: "Oma profiili", my_account: "Oma tili", view_profile: "Katso profiili", settings_desc: "Asetukset", search: "Hae", back: "Takaisin", apply: "Käytä", error: "Virhe" },
     notification: { like_feed: "tykkäsi julkaisustasi.", user_action: "{{name}}", new: "Uusi", deleted_post: "Julkaisu poistettu.", deleted_comment: "Kommentti poistettu.", comment_feed: "kommentoi julkaisuasi.", like_comment: "tykkäsi kommentistasi.", follow_msg: "alkoi seurata sinua.", repost_msg: "jakoi julkaisusi.", mention_msg: "mainitsi sinut." },
     settings: { languageSelect: "Valitse kieli", system: "Järjestelmä", language: "Kieli", theme: "Teema", notifications: "Ilmoitusasetukset", alarm_comment: "Kommentit", alarm_like: "Tykkäykset", alarm_follow: "Seuraajat", privacy: "Yksityisyys", change_password: "Vaihda salasana", connect_sns: "Yhdistä sometili", withdraw: "Poista tili", withdraw_phrase: "Poista tilini", withdraw_btn_confirm: "Poista", confirm_password: "Vahvista salasana", support_policy: "Tuki ja käytännöt", help_center: "Ohje", terms: "Käyttöehdot", privacy_policy: "Tietosuojakäytäntö", marketing_consent: "Markkinointi" },
     profile: { edit_profile: "Muokkaa profiilia", following: "Seurataan", followers: "Seuraajia", joined: "Liittyi {{date}}", tabs: { posts: "Julkaisut", replies: "Vastaukset", media: "Media", likes: "Tykkäykset" }, no_posts: "Ei julkaisuja", no_replies: "Ei vastauksia" },
     tweets: { placeholder_tweet: "Mitä kuuluu?", placeholder_reply: "Lähetä vastaus", btn_post: "Julkaise", btn_reply: "Vastaa", add_photo: "Lisää kuva" },
     tweet: { delete_msg_title: "Poista julkaisu?", delete_msg_desc: "Toimintoa ei voi kumota.", delete_success: "Poistettu.", no_replies: "Ei vastauksia", be_first: "Ole ensimmäinen!" },
     trending: { title: "Trendaavat", no_trending: "Ei trendejä" },
     chat: { direct_chat: "Viestit", select_or_start: "Valitse viesti", start_conversation: "Aloita keskustelu", me: "Minä", search_placeholder: "Hae viestejä", send_first_message: "Lähetä ensimmäinen viesti!", feature_realtime: "💬 Reaaliaikainen chat", feature_search: "👥 Haku ja kutsu", feature_responsive: "📱 Responsiivinen" }
  },
  // 11. Spanish (es) - Re-inserting in correct order if not already
  // Actually Batch 1/2 covered up to TH. 
  // Batch 3 placeholders need to cover ES, FR, PT, PT-BR
  // Wait, I put ES, FR, PT, PT-BR in Batch 3?
  // Let me check my thought process.
  // Batch 1: JA, ZH, RU, VI
  // Batch 2: BN, AR, HI, TH
  // Batch 3: ES, FR, PT, PT-BR (Plan)
  // But in Step 1698 prompt I requested Batch 3 placeholder replacement.
  // Ah, the previous step REPLACED Batch 1 and 2 placeholders.
  // So now I only have Batch 3 and 4 placeholders left.
  
  // 12. French (fr)
  fr: {
     nav: { home: "Accueil", study: "Étudier", community: "Communauté", chat: "Chat", notifications: "Notifs", more: "Plus", settings: "Paramètres", profile: "Profil", post: "Publier" },
     notification: { like_feed: "a aimé votre post.", user_action: "{{name}}", new: "Nouveau", deleted_post: "Post supprimé.", deleted_comment: "Commentaire supprimé.", comment_feed: "a commenté votre post.", like_comment: "a aimé votre commentaire.", follow_msg: "vous a suivi.", repost_msg: "a reposté.", mention_msg: "vous a mentionné." },
     study: { 
         search_placeholder: "Rechercher...", no_content: "Aucun contenu.", 
         category: { all: "Tout", drama: "Drame", movie: "Film", entertainment: "Divertissement", music: "Musique" }, 
         level: { title: "Niveau", all: "Tout", beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" }, 
         formats: { episode: "Ép {{val}}", scene: "Scène {{val}}" }, 
         guide: { prev: "Préc", next: "Suiv", start: "Début", close: "Fermer", never_show: "Ne plus afficher" },
         no_title: "Sans titre", no_episode: "Sans épisode", share_text_prefix: "Apprendre avec K-Content: ", meta_desc_default: "Apprenez le coréen sur ARA",
         study_card_title: "Carte d'étude", vocab_explanation: "Vocabulaire", culture_note: "Note culturelle"
     },
     auth: { 
         login: "Connexion", signup: "S'inscrire", logout: "Déconnexion", login_needed: "Connexion requise", please_login: "Veuillez vous connecter", click_to_login: "Cliquer pour connecter",
         welcome: "Bienvenue", email: "Email", password: "Mot de passe", logging_in: "Connexion...", auto_login: "Connexion auto",
         find_email: "Trouver email", find_password: "Mot de passe oublié", resend_verification: "Renvoyer", first_time: "Nouveau ?",
         login_with_google: "Connexion Google", login_with_kakao: "Connexion Kakao", verification_sent: "Vérification envoyée", email_verification_failed: "Echec vérification",
         verify_before_login: "Vérifiez votre email", invalid_credentials: "Identifiants invalides"
     },
     common: { loading: "Chargement...", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier", my_profile: "Mon Profil", my_account: "Mon Compte", view_profile: "Voir Profil", settings_desc: "Paramètres", search: "Rechercher", back: "Retour", apply: "Appliquer", error: "Erreur" },
     settings: { languageSelect: "Langue", system: "Système", language: "Langue", theme: "Thème", notifications: "Notifications", alarm_comment: "Commentaires", alarm_like: "J'aime", alarm_follow: "Abonnés", privacy: "Confidentialité", change_password: "Changer mot de passe", connect_sns: "Lier réseaux", withdraw: "Supprimer compte", withdraw_phrase: "Supprimer mon compte", withdraw_btn_confirm: "Supprimer", confirm_password: "Confirmer mot de passe", support_policy: "Assistance et Politique", help_center: "Centre d'aide", terms: "Conditions d'utilisation", privacy_policy: "Politique de confidentialité", marketing_consent: "Consentement marketing" },
     profile: { edit_profile: "Éditer profil", following: "Abonnements", followers: "Abonnés", joined: "Rejoint le {{date}}", tabs: { posts: "Posts", replies: "Réponses", media: "Média", likes: "J'aime" }, no_posts: "Aucun post", no_replies: "Aucune réponse" },
     tweets: { placeholder_tweet: "Quoi de neuf ?", placeholder_reply: "Votre réponse...", btn_post: "Publier", btn_reply: "Répondre", add_photo: "Ajouter photo" },
     tweet: { delete_msg_title: "Supprimer ?", delete_msg_desc: "Irréversible.", delete_success: "Supprimé.", no_replies: "Aucune réponse", be_first: "Soyez le premier !" },
     trending: { title: "Tendances", no_trending: "Aucune tendance" },
     chat: { direct_chat: "Messages", select_or_start: "Sélectionner ou démarrer", start_conversation: "Démarrer conversation", me: "Moi", search_placeholder: "Chercher...", send_first_message: "Envoyez le premier message !", feature_realtime: "💬 Messagerie temps réel", feature_search: "👥 Trouver et inviter", feature_responsive: "📱 Design réactif" }
  },
  // 13. Spanish (es)
  es: {
     nav: { home: "Inicio", study: "Estudio", community: "Comunidad", chat: "Chat", notifications: "Notificaciones", more: "Más", settings: "Ajustes", profile: "Perfil", post: "Publicar" },
     notification: { like_feed: "le gustó tu publicación.", user_action: "{{name}}", new: "Nuevo", deleted_post: "Publicación eliminada.", deleted_comment: "Comentario eliminado.", comment_feed: "comentó tu publicación.", like_comment: "le gustó tu comentario.", follow_msg: "te siguió.", repost_msg: "republicó tu post.", mention_msg: "te mencionó." },
     study: { 
         search_placeholder: "Buscar...", no_content: "No se encontró contenido.", 
         category: { all: "Todo", drama: "Drama", movie: "Película", entertainment: "Entretenimiento", music: "Música" }, 
         level: { title: "Dificultad", all: "Todo", beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" }, 
         formats: { episode: "Ep {{val}}", scene: "Escena {{val}}" }, 
         guide: { prev: "Ant", next: "Sig", start: "Inicio", close: "Cerrar", never_show: "No mostrar más" },
         no_title: "Sin título", no_episode: "Sin episodio", share_text_prefix: "Aprende con K-Content: ", meta_desc_default: "Aprende coreano en ARA",
         study_card_title: "Tarjeta de estudio", vocab_explanation: "Vocabulario", culture_note: "Nota cultural"
     },
     auth: { 
         login: "Entrar", signup: "Registro", logout: "Salir", login_needed: "Inicio de sesión requerido", please_login: "Por favor inicia sesión", click_to_login: "Click para entrar",
         welcome: "Bienvenido", email: "Correo", password: "Password", logging_in: "Entrando...", auto_login: "Auto login",
         find_email: "Buscar correo", find_password: "Reset password", resend_verification: "Reenviar verificación", first_time: "¿Primera vez?",
         login_with_google: "Entrar con Google", login_with_kakao: "Entrar con Kakao", verification_sent: "Verificación enviada", email_verification_failed: "Falló verificación",
         verify_before_login: "Verifica tu correo antes de entrar", invalid_credentials: "Credenciales inválidas"
     },
     common: { loading: "Cargando...", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", my_profile: "Mi Perfil", my_account: "Mi Cuenta", view_profile: "Ver Perfil", settings_desc: "Ajustes", search: "Buscar", back: "Atrás", apply: "Aplicar", error: "Error" },
     settings: { languageSelect: "Idioma", system: "Sistema", language: "Idioma", theme: "Tema", notifications: "Notificaciones", alarm_comment: "Comentarios", alarm_like: "Megustas", alarm_follow: "Seguidores", privacy: "Privacidad", change_password: "Cambiar contraseña", connect_sns: "Conectar SNS", withdraw: "Eliminar cuenta", withdraw_phrase: "Eliminar mi cuenta", withdraw_btn_confirm: "Eliminar", confirm_password: "Confirmar contraseña", support_policy: "Soporte y Política", help_center: "Centro de ayuda", terms: "Términos de servicio", privacy_policy: "Política de privacidad", marketing_consent: "Consentimiento de marketing" },
     profile: { edit_profile: "Editar perfil", following: "Siguiendo", followers: "Seguidores", joined: "Unido en {{date}}", tabs: { posts: "Posts", replies: "Respuestas", media: "Media", likes: "Megustas" }, no_posts: "Sin posts", no_replies: "Sin respuestas" },
     tweets: { placeholder_tweet: "¿Qué está pasando?", placeholder_reply: "Postear respuesta...", btn_post: "Postear", btn_reply: "Responder", add_photo: "Añadir foto" },
     tweet: { delete_msg_title: "¿Eliminar?", delete_msg_desc: "No se puede deshacer.", delete_success: "Eliminado.", no_replies: "Sin respuestas", be_first: "¡Sé el primero!" },
     trending: { title: "Tendencias", no_trending: "Sin tendencias" },
     chat: { direct_chat: "Mensajes", select_or_start: "Selecciona o empieza", start_conversation: "Empezar conversación", me: "Yo", search_placeholder: "Buscar...", send_first_message: "¡Envía el primer mensaje!", feature_realtime: "💬 Chat en tiempo real", feature_search: "👥 Buscar e invitar", feature_responsive: "📱 Diseño adaptativo" }
  },
  // 14. Portuguese (pt)
  pt: {
     nav: { home: "Início", study: "Estudo", community: "Comunidade", chat: "Chat", notifications: "Notificações", more: "Mais", settings: "Definições", profile: "Perfil", post: "Publicar" },
     study: { 
         search_placeholder: "Pesquisar...", no_content: "Nenhum conteúdo.", 
         category: { all: "Tudo", drama: "Drama", movie: "Filme", entertainment: "Entretenimento", music: "Música" }, 
         level: { title: "Nível", all: "Tudo", beginner: "Iniciante", intermediate: "Intermédio", advanced: "Avançado" }, 
         formats: { episode: "Ep {{val}}", scene: "Cena {{val}}" }, 
         guide: { prev: "Ant", next: "Seg", start: "Iniciar", close: "Fechar", never_show: "Não mostrar" },
         no_title: "Sem título", no_episode: "Sem episódio", share_text_prefix: "Aprenda com K-Content: ", meta_desc_default: "Aprenda coreano na ARA",
         study_card_title: "Cartão de Estudo", vocab_explanation: "Vocabulário", culture_note: "Nota Cultural"
     },
     auth: { 
         login: "Entrar", signup: "Registar", logout: "Sair", login_needed: "Login necessário", please_login: "Por favor entre", click_to_login: "Clique para entrar",
         welcome: "Bem-vindo", email: "Email", password: "Password", logging_in: "A entrar...", auto_login: "Login auto",
         find_email: "Procurar email", find_password: "Reset password", resend_verification: "Reenviar", first_time: "Primeira vez?",
         login_with_google: "Entrar com Google", login_with_kakao: "Entrar com Kakao", verification_sent: "Verificação enviada", email_verification_failed: "Falha na verificação",
         verify_before_login: "Verifique o email", invalid_credentials: "Credenciais inválidas"
     },
     common: { loading: "A carregar...", save: "Guardar", cancel: "Cancelar", delete: "Apagar", edit: "Editar", my_profile: "Meu Perfil", my_account: "Minha Conta", view_profile: "Ver Perfil", settings_desc: "Definições", search: "Pesquisar", back: "Voltar", apply: "Aplicar", error: "Erro" },
     notification: { like_feed: "gostou da sua publicação.", user_action: "{{name}}", new: "Novo", deleted_post: "Publicação apagada.", deleted_comment: "Comentário apagado.", comment_feed: "comentou a sua publicação.", like_comment: "gostou do seu comentário.", follow_msg: "começou a seguir-te.", repost_msg: "republicou o teu post.", mention_msg: "mencionou-te." },
     settings: { languageSelect: "Idioma", system: "Sistema", language: "Idioma", theme: "Tema", notifications: "Notificações", alarm_comment: "Comentários", alarm_like: "Gostos", alarm_follow: "Seguidores", privacy: "Privacidade", change_password: "Mudar palavra-passe", connect_sns: "Ligar SNS", withdraw: "Apagar conta", withdraw_phrase: "Apagar minha conta", withdraw_btn_confirm: "Apagar", confirm_password: "Confirmar palavra-passe", support_policy: "Apoio e Política", help_center: "Centro de ajuda", terms: "Termos de serviço", privacy_policy: "Política de privacidade", marketing_consent: "Consentimento de marketing" },
     profile: { edit_profile: "Editar perfil", following: "A seguir", followers: "Seguidores", joined: "Aderiu em {{date}}", tabs: { posts: "Publicações", replies: "Respostas", media: "Multimédia", likes: "Gostos" }, no_posts: "Sem publicações", no_replies: "Sem respostas" },
     tweets: { placeholder_tweet: "O que se passa?", placeholder_reply: "Publicar resposta...", btn_post: "Publicar", btn_reply: "Responder", add_photo: "Adicionar foto" },
     tweet: { delete_msg_title: "Apagar publicação?", delete_msg_desc: "Não pode ser desfeito.", delete_success: "Apagado.", no_replies: "Sem respostas", be_first: "Sê o primeiro!" },
     trending: { title: "Tendências para ti", no_trending: "Sem tendências" },
     chat: { direct_chat: "Mensagens", select_or_start: "Seleciona uma mensagem", start_conversation: "Começar conversa", me: "Eu", search_placeholder: "Procurar mensagens", send_first_message: "Envia a primeira mensagem!", feature_realtime: "💬 Chat em tempo real", feature_search: "👥 Pesquisar e convidar", feature_responsive: "📱 Design responsivo" }
  },
  // 15. Portuguese Brazil (pt-br)
  'pt-br': {
     nav: { home: "Início", study: "Estudo", community: "Comunidade", chat: "Chat", notifications: "Notificações", more: "Mais", settings: "Configurações", profile: "Perfil", post: "Postar" },
     study: { 
         search_placeholder: "Buscar...", no_content: "Nenhum conteúdo.", 
         category: { all: "Tudo", drama: "Drama", movie: "Filme", entertainment: "Entretenimento", music: "Música" }, 
         level: { title: "Nível", all: "Tudo", beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" }, 
         formats: { episode: "Ep {{val}}", scene: "Cena {{val}}" }, 
         guide: { prev: "Ant", next: "Prox", start: "Iniciar", close: "Fechar", never_show: "Não mostrar" },
         no_title: "Sem título", no_episode: "Sem episódio", share_text_prefix: "Aprenda com K-Content: ", meta_desc_default: "Aprenda coreano na ARA",
         study_card_title: "Cartão de Estudo", vocab_explanation: "Vocabulário", culture_note: "Nota Cultural"
     },
     auth: { 
         login: "Entrar", signup: "Cadastrar", logout: "Sair", login_needed: "Login necessário", please_login: "Por favor entre", click_to_login: "Entre agora",
         welcome: "Bem-vindo", email: "Email", password: "Senha", logging_in: "Entrando...", auto_login: "Login auto",
         find_email: "Buscar email", find_password: "Nova senha", resend_verification: "Reenviar", first_time: "Primeira vez?",
         login_with_google: "Entrar com Google", login_with_kakao: "Entrar com Kakao", verification_sent: "Verificação enviada", email_verification_failed: "Falha na verificação",
         verify_before_login: "Verifique seu email", invalid_credentials: "Dados inválidos"
     },
     common: { loading: "Carregando...", save: "Salvar", cancel: "Cancelar", delete: "Excluir", edit: "Editar", my_profile: "Meu Perfil", my_account: "Minha Conta", view_profile: "Ver Perfil", settings_desc: "Configurações", search: "Buscar", back: "Voltar", apply: "Aplicar", error: "Erro" },
     notification: { like_feed: "curtiu sua publicação.", user_action: "{{name}}", new: "Novo", deleted_post: "Publicação excluída.", deleted_comment: "Comentário excluído.", comment_feed: "comentou sua publicação.", like_comment: "curtiu seu comentário.", follow_msg: "começou a seguir você.", repost_msg: "repostou seu post.", mention_msg: "mencionou você." },
     settings: { languageSelect: "Idioma", system: "Sistema", language: "Idioma", theme: "Tema", notifications: "Notificações", alarm_comment: "Comentários", alarm_like: "Curtidas", alarm_follow: "Seguidores", privacy: "Privacidade", change_password: "Mudar senha", connect_sns: "Conectar SNS", withdraw: "Excluir conta", withdraw_phrase: "Excluir minha conta", withdraw_btn_confirm: "Excluir", confirm_password: "Confirmar senha", support_policy: "Suporte e Política", help_center: "Central de ajuda", terms: "Termos de serviço", privacy_policy: "Política de privacidade", marketing_consent: "Consentimento de marketing" },
     profile: { edit_profile: "Editar perfil", following: "Seguindo", followers: "Seguidores", joined: "Entrou em {{date}}", tabs: { posts: "Publicações", replies: "Respostas", media: "Mídia", likes: "Curtidas" }, no_posts: "Nenhuma publicação", no_replies: "Nenhuma resposta" },
     tweets: { placeholder_tweet: "O que está acontecendo?", placeholder_reply: "Postar resposta...", btn_post: "Postar", btn_reply: "Responder", add_photo: "Adicionar foto" },
     tweet: { delete_msg_title: "Excluir publicação?", delete_msg_desc: "Não pode ser desfeito.", delete_success: "Excluído.", no_replies: "Nenhuma resposta", be_first: "Seja o primeiro!" },
     trending: { title: "Tendências para você", no_trending: "Sem tendências" },
     chat: { direct_chat: "Mensagens", select_or_start: "Selecione uma mensagem", start_conversation: "Nova conversa", me: "Eu", search_placeholder: "Buscar mensagens", send_first_message: "Envie a primeira mensagem!", feature_realtime: "💬 Chat em tempo real", feature_search: "👥 Pesquisar e convidar", feature_responsive: "📱 Design responsivo" }
  },
  // 16. Korean (ko) - Already populated in most part but ensuring it's right.
  // Actually, I already added ko in Batch 4 placeholder?
  // Let's add KO and EN here.
  ko: {
      nav: { home: "홈", study: "학습", community: "커뮤니티", chat: "채팅", notifications: "알림", more: "더보기", settings: "설정", profile: "프로필", post: "게시하기" },
      notification: { like_feed: "님이 회원님의 게시물을 좋아합니다.", user_action: "{{name}}", new: "신규", deleted_post: "삭제된 게시물입니다.", deleted_comment: "삭제된 댓글입니다.", comment_feed: "님이 회원님의 게시물에 댓글을 남겼습니다.", like_comment: "님이 회원님의 댓글을 좋아합니다.", follow_msg: "님이 회원님을 팔로우합니다.", repost_msg: "님이 회원님의 게시물을 리포스트했습니다.", mention_msg: "님이 회원님을 언급했습니다." },
      study: { 
          search_placeholder: "검색...", no_content: "콘텐츠가 없습니다.", 
          category: { all: "전체", drama: "드라마", movie: "영화", entertainment: "예능", music: "음악" }, 
          level: { title: "난이도", all: "전체", beginner: "초급", intermediate: "중급", advanced: "고급" }, 
          formats: { episode: "제{{val}}화", scene: "장면 {{val}}" }, 
          guide: { prev: "이전", next: "다음", start: "시작", close: "닫기", never_show: "다시 보지 않기" },
          no_title: "제목 없음", no_episode: "에피소드 없음", share_text_prefix: "K-콘텐츠로 배우기: ", meta_desc_default: "ARA에서 즐겁게 한국어를 배워보세요",
          study_card_title: "학습 카드", vocab_explanation: "단어 설명", culture_note: "문화 노트"
      },
      auth: { 
          login: "로그인", signup: "회원가입", logout: "로그아웃", login_needed: "로그인이 필요합니다", please_login: "로그인 해주세요", click_to_login: "눌러서 로그인",
          welcome: "환영합니다", email: "이메일", password: "비밀번호", logging_in: "로그인 중...", auto_login: "자동 로그인", 
          find_email: "이메일 찾기", find_password: "비밀번호 찾기", resend_verification: "인증 메일 재발송", first_time: "처음이신가요?",
          login_with_google: "Google로 로그인", login_with_kakao: "Kakao로 로그인", verification_sent: "인증 메일이 전송되었습니다", email_verification_failed: "이메일 인증에 실패했습니다",
          verify_before_login: "로그인 전 이메일 인증을 완료해주세요", invalid_credentials: "아이디 또는 비밀번호가 잘못되었습니다"
      },
      common: { loading: "로딩 중...", save: "저장", cancel: "취소", delete: "삭제", edit: "수정", my_profile: "내 프로필", my_account: "내 계정", view_profile: "내 프로필 보기", settings_desc: "프로필/설정", search: "검색", back: "뒤로가기", apply: "적용하기", error: "오류가 발생했습니다", close: "닫기" },
      settings: { languageSelect: "언어 선택", system: "시스템 설정", language: "언어", theme: "테마", notifications: "알림 설정", alarm_comment: "댓글 알림", alarm_like: "좋아요 알림", alarm_follow: "팔로우 알림", privacy: "개인정보 설정", change_password: "비밀번호 변경", connect_sns: "SNS 계정 연결", withdraw: "회원 탈퇴", withdraw_phrase: "탈퇴하겠습니다.", withdraw_btn_confirm: "삭제하는", confirm_password: "비밀번호 확인", support_policy: "지원 및 정책", help_center: "도움말 센터", terms: "이용약관", privacy_policy: "개인정보 처리방침", marketing_consent: "마케팅 동의" },
      profile: { edit_profile: "프로필 편집", following: "팔로잉", followers: "팔로워", joined: "{{date}}에 가입", tabs: { posts: "게시물", replies: "답글", media: "미디어", likes: "마음에 들어요" }, no_posts: "게시물이 없습니다", no_replies: "답글이 없습니다" },
      tweets: { placeholder_tweet: "무슨 일이 일어나고 있나요?", placeholder_reply: "답글을 게시하세요", btn_post: "게시하기", btn_reply: "답글", add_photo: "사진 추가" },
      tweet: { delete_msg_title: "삭제하시겠습니까?", delete_msg_desc: "이 동작은 되돌릴 수 없습니다.", delete_success: "삭제되었습니다.", no_replies: "답글이 없습니다", be_first: "가장 먼저 답글을 남겨보세요!" },
      trending: { title: "나를 위한 트렌드", no_trending: "트렌드가 없습니다" },
      chat: { direct_chat: "쪽지", select_or_start: "좌제에서 채팅방을 선택하거나", start_conversation: "새 채팅 버튼을 눌러 대화를 시작하세요.", me: "나", search_placeholder: "쪽지 검색", search_btn: "검색", send_first_message: "첫 번째 메시지를 보내보세요!", feature_realtime: "💬 실시간 1:1 채팅", feature_search: "👥 유저 검색 및 초대", feature_responsive: "📱 반응형 디자인", no_chats: "아직 채팅방이 없습니다. 새 채팅을 눌러서 대화를 시작해보세요." }
  },
  // 17. English (en)
  en: {
      nav: { home: "Home", study: "Study", community: "Community", chat: "Chat", notifications: "Notifications", more: "More", settings: "Settings", profile: "Profile", post: "Post" },
      notification: { like_feed: "liked your post.", user_action: "{{name}}", new: "New", deleted_post: "Post deleted.", deleted_comment: "Comment deleted.", comment_feed: "commented on your post.", like_comment: "liked your comment.", follow_msg: "followed you.", repost_msg: "reposted your post.", mention_msg: "mentioned you." },
      study: { 
          search_placeholder: "Search...", no_content: "No content found.", 
          category: { all: "All", drama: "Drama", movie: "Movie", entertainment: "Entertainment", music: "Music" }, 
         level: { title: "Difficulty", all: "All", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }, 
         formats: { episode: "Ep {{val}}", scene: "Scene {{val}}" }, 
         guide: { prev: "Prev", next: "Next", start: "Start", close: "Close", never_show: "Don't show again" },
         no_title: "No Title", no_episode: "No Episode", share_text_prefix: "Learn with K-Content: ", meta_desc_default: "Learn Korean with ARA",
         study_card_title: "Study Card", vocab_explanation: "Vocabulary", culture_note: "Culture Note"
     },
     auth: { 
         login: "Log in", signup: "Sign up", logout: "Log out", login_needed: "Login needed", please_login: "Please log in", click_to_login: "Click to log in",
         welcome: "Welcome", email: "Email", password: "Password", logging_in: "Logging in...", auto_login: "Auto login",
         find_email: "Find Email", find_password: "Find Password", resend_verification: "Resend", first_time: "First time?",
         login_with_google: "Log in with Google", login_with_kakao: "Log in with Kakao", verification_sent: "Verification sent", email_verification_failed: "Verification failed",
         verify_before_login: "Please verify your email", invalid_credentials: "Invalid credentials"
     },
     common: { loading: "Loading...", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", my_profile: "My Profile", my_account: "My Account", view_profile: "View Profile", settings_desc: "Settings", search: "Search", back: "Back", apply: "Apply", error: "Error", close: "Close" },
     settings: { languageSelect: "Language", system: "System", language: "Language", theme: "Theme", notifications: "Notifications", alarm_comment: "Comments", alarm_like: "Likes", alarm_follow: "Follows", privacy: "Privacy", change_password: "Change Password", connect_sns: "Connect SNS", withdraw: "Delete Account", withdraw_phrase: "Delete my account", withdraw_btn_confirm: "Delete", confirm_password: "Confirm Password" },
     profile: { edit_profile: "Edit Profile", following: "Following", followers: "Followers", joined: "Joined {{date}}", tabs: { posts: "Posts", replies: "Replies", media: "Media", likes: "Likes" }, no_posts: "No posts yet", no_replies: "No replies yet" },
     tweets: { placeholder_tweet: "What is happening?", placeholder_reply: "Post your reply", btn_post: "Post", btn_reply: "Reply", add_photo: "Add Photo" },
     tweet: { delete_msg_title: "Delete post?", delete_msg_desc: "This can't be undone.", delete_success: "Deleted.", no_replies: "No replies yet", be_first: "Be the first to reply!" },
     trending: { title: "Trends for you", no_trending: "No trends available" },
     chat: { direct_chat: "Messages", select_or_start: "Select a chat room from the left or", start_conversation: "press the \"New Chat\" button to start a conversation.", me: "Me", search_placeholder: "Search messages", search_btn: "Search", send_first_message: "Send your first message!", feature_realtime: "💬 Real-time 1:1 messaging", feature_search: "👥 User search and invite", feature_responsive: "📱 Responsive design", no_chats: "No chat rooms yet. Press \"New Chat\" to start a conversation." }
  }
};

function loadJson(lang: string) {
  const p = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return {};
}

const en = loadJson('en');

// Recursive merge
function deepMerge(target: any, source: any) {
    if (typeof source !== 'object' || source === null) return source;
    if (typeof target !== 'object' || target === null) return source;
    
    const out = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                out[key] = deepMerge(target[key], source[key]);
            } else {
                out[key] = source[key];
            }
        }
    }
    return out;
}

console.log("Starting Global Translation Rollout...");

for (const lang of languages) {
  const data = loadJson(lang);
  let dict = fullTranslations[lang];
  
  // If we have a dictionary, merge it ON TOP of existing data + EN structure
  // 1. Start with EN structure (to ensure keys exist)
  // 2. Merge existing data (to keep manual edits if any)
  // 3. Merge dict (to enforce our specific translations)
  
  // Actually, standard hierarchy:
  // 1. EN (base)
  // 2. Existing Data (current state)
  // 3. Our New Dict (overwrite)
  
  let merged = deepMerge(en, data); 
  if (dict) {
      merged = deepMerge(merged, dict);
  } else {
      // If we missed a language in dict, at least we have EN+Data
  }

  const filePath = path.join(localesDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
}

console.log("Global update complete.");
