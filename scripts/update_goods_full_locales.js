import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, 'src', 'locales');

// 16 Languages: ar, bn, de, en, es, fi, fr, hi, ja, ko, pt, pt-br, ru, th, vi, zh

const itemTranslations = {
  hoodie: {
    en: { title: "Signature Hoodie", desc: "Premium cotton hoodie with signature logo. Comfortable fit for daily wear." },
    ko: { title: "시그니처 후드티", desc: "시그니처 로고가 새겨진 프리미엄 코튼 후드티입니다. 데일리로 입기 좋은 편안한 핏입니다." },
    ja: { title: "シグネチャーパーカー", desc: "シグネチャーロゴ入りのプレミアムコットンパーカー。日常着として快適なフィット感。" },
    zh: { title: "签名款连帽衫", desc: "带有标志性 Logo 的优质纯棉连帽衫。适合日常穿着的舒适版型。" },
    es: { title: "Sudadera con Capucha", desc: "Sudadera de algodón premium con logo distintivo. Ajuste cómodo para uso diario." },
    fr: { title: "Sweat à Capuche Signature", desc: "Sweat à capuche en coton premium avec logo signature. Coupe confortable pour un usage quotidien." },
    de: { title: "Signature Hoodie", desc: "Premium-Baumwoll-Hoodie mit Signature-Logo. Bequeme Passform für den täglichen Gebrauch." },
    ru: { title: "Фирменное Худи", desc: "Премиальное хлопковое худи с фирменным логотипом. Удобная посадка на каждый день." },
    pt: { title: "Moletom com Capuz Assinado", desc: "Moletom de algodão premium com logotipo exclusivo. Ajuste confortável para uso diário." },
    "pt-br": { title: "Moletom Signature", desc: "Moletom de algodão premium com logo exclusivo. Caimento confortável para o dia a dia." },
    vi: { title: "Áo Hoodie Chữ Ký", desc: "Áo hoodie cotton cao cấp với logo chữ ký. Phom dáng thoải mái thích hợp mặc hàng ngày." },
    th: { title: "เสื้อฮู้ดลายเซ็น", desc: "เสื้อฮู้ดผ้าฝ้ายพรีเมียมพร้อมโลโก้ลายเซ็น ทรงใส่สบายเหมาะสำหรับสวมใส่ทุกวัน" },
    id: { title: "Hoodie Tanda Tangan", desc: "Hoodie katun premium dengan logo tanda tangan. Fit nyaman untuk pemakaian sehari-hari." },
    ar: { title: "هودي التوقيع", desc: "هودي قطني فاخر مع شعار التوقيع. مقاس مريح للارتداء اليومي." },
    hi: { title: "सिग्नेचर हुडी", desc: "सिग्नेचर लोगो के साथ प्रीमियम कॉटन हूडि। दैनिक पहनने के लिए आरामदायक फिट।" },
    bn: { title: "সিগনেচার হুডি", desc: "সিগনেচার লোগো সহ প্রিমিয়াম সুতির হুডি। প্রতিদিন পরার জন্য আরামদায়ক ফিট।" },
    fi: { title: "Signature Huppari", desc: "Premium-puuvillahuppari signature-logolla. Mukava istuvuus päivittäiseen käyttöön." }
  },
  tote_bag: {
    en: { title: "Eco Tote Bag", desc: "Eco-friendly canvas tote bag. Durable and spacious for your essentials." },
    ko: { title: "에코 토트백", desc: "환경을 생각한 캔버스 토트백입니다. 튼튼하고 수납공간이 넉넉합니다." },
    ja: { title: "エコトートバッグ", desc: "環境に優しいキャンバストートバッグ。丈夫で必需品を入れるのに十分な広さ。" },
    zh: { title: "环保托特包", desc: "环保帆布托特包。结实耐用，空间宽敞，适合装载日常必需品。" },
    es: { title: "Bolsa de Tela Ecológica", desc: "Bolsa de lona ecológica. Duradera y espaciosa para tus esenciales." },
    fr: { title: "Sac Tote Écologique", desc: "Sac fourre-tout en toile écologique. Durable et spacieux pour vos essentiels." },
    de: { title: "Öko-Tragetasche", desc: "Umweltfreundliche Canvas-Tragetasche. Langlebig und geräumig für Ihre Essentials." },
    ru: { title: "Эко-сумка шоппер", desc: "Экологичная холщовая сумка-шоппер. Прочная и вместительная для ваших вещей." },
    pt: { title: "Bolsa Ecológica", desc: "Bolsa de lona ecológica. Durável e espaçosa para seus itens essenciais." },
    "pt-br": { title: "Ecobag", desc: "Ecobag de lona sustentável. Durável e espaçosa para seus itens essenciais." },
    vi: { title: "Túi Tote Eco", desc: "Túi vải canvas thân thiện môi trường. Bền và rộng rãi cho các vật dụng cần thiết." },
    th: { title: "ถุงผ้าลดโลกร้อน", desc: "ถุงผ้าแคนวาสเป็นมิตรต่อสิ่งแวดล้อม ทนทานและกว้างขวางสำหรับของใช้จำเป็นของคุณ" },
    id: { title: "Tas Tote Ramah Lingkungan", desc: "Tas tote kanvas ramah lingkungan. Tahan lama dan luas untuk barang-barang Anda." },
    ar: { title: "حقيبة صديقة للبيئة", desc: "حقيبة قماشية صديقة للبيئة. متينة وواسعة لأساسياتك." },
    hi: { title: "इको टोट बैग", desc: "पर्यावरण के अनुकूल कैनवास टोट बैग। आपकी आवश्यक वस्तुओं के लिए टिकाऊ और विशाल।" },
    bn: { title: "ইকো টোট ব্যাগ", desc: "পরিবেশ-বান্ধব ক্যানভাস টোট ব্যাগ। আপনার প্রয়োজনীয় জিনিসগুলির জন্য টেকসই এবং প্রশস্ত।" },
    fi: { title: "Ekologinen Kangaskassi", desc: "Ympäristöystävällinen kangaskassi. Kestävä ja tilava tärkeimmille tavaroillesi." }
  },
  note_set: {
    en: { title: "Premium Note Set", desc: "High-quality paper notebook set. Perfect for studying and journaling." },
    ko: { title: "프리미엄 노트 세트", desc: "고품질 종이로 제작된 노트 세트입니다. 공부와 저널링에 완벽합니다." },
    ja: { title: "プレミアムノートセット", desc: "高品質の紙を使用したノートセット。勉強や日記に最適。" },
    zh: { title: "高级笔记本套装", desc: "高品质纸张笔记本套装。非常适合学习和记日记。" },
    es: { title: "Set de Notas Premium", desc: "Juego de cuadernos de papel de alta calidad. Perfecto para estudiar y escribir un diario." },
    fr: { title: "Ensemble de Notes Premium", desc: "Ensemble de cahiers en papier de haute qualité. Parfait pour étudier et tenir un journal." },
    de: { title: "Premium Notizbuch-Set", desc: "Hochwertiges Notizbuch-Set aus Papier. Perfekt zum Lernen und Tagebuchschreiben." },
    ru: { title: "Набор блокнотов премиум", desc: "Набор блокнотов из высококачественной бумаги. Идеально подходит для учебы и записей." },
    pt: { title: "Conjunto de Notas Premium", desc: "Conjunto de cadernos de papel de alta qualidade. Perfeito para estudar e manter um diário." },
    "pt-br": { title: "Kit de Cadernos Premium", desc: "Kit de cadernos com papel de alta qualidade. Perfeito para estudos e anotações." },
    vi: { title: "Bộ Sổ Tay Cao Cấp", desc: "Bộ sổ tay giấy chất lượng cao. Hoàn hảo cho việc học tập và ghi chép." },
    th: { title: "ชุดสมุดบันทึกพรีเมียม", desc: "ชุดสมุดโน้ตกระดาษคุณภาพสูง เหมาะสำหรับการเรียนและจดบันทึก" },
    id: { title: "Set Catatan Premium", desc: "Set buku catatan kertas berkualitas tinggi. Sempurna untuk belajar dan membuat jurnal." },
    ar: { title: "مجموعة مذكرات مميزة", desc: "مجموعة دفاتر ورقية عالية الجودة. مثالية للدراسة وتدوين اليوميات." },
    hi: { title: "प्रीमियम नोट सेट", desc: "उच्च गुणवत्ता वाले कागज नोट सेट। पढ़ाई और जर्नलिंग के लिए उत्तम।" },
    bn: { title: "প্রিমিয়াম নোট সেট", desc: "উচ্চ মানের কাগজের নোটবুক সেট। পড়াশোনা এবং জার্নালিংয়ের জন্য নিখুঁত।" },
    fi: { title: "Premium Muistivihkosetti", desc: "Laadukas paperimuistivihkosetti. Täydellinen opiskeluun ja päiväkirjan pitoon." }
  },
  planner: {
    en: { title: "Digital Planner 2026", desc: "All-in-one digital planner for iPad/Tablet. Organize your 2026 efficiently." },
    ko: { title: "2026 디지털 플래너", desc: "iPad/태블릿용 올인원 디지털 플래너. 2026년을 효율적으로 계획하세요." },
    ja: { title: "2026 デジタルプランナー", desc: "iPad/タブレット用オールインワンデジタルプランナー。2026年を効率的に整理しましょう。" },
    zh: { title: "2026 数字计划表", desc: "适用于 iPad/平板电脑的多合一数字计划表。高效规划您的 2026 年。" },
    es: { title: "Planificador Digital 2026", desc: "Planificador digital todo en uno para iPad/Tablet. Organiza tu 2026 eficientemente." },
    fr: { title: "Planning Numérique 2026", desc: "Planning numérique tout-en-un pour iPad/Tablette. Organisez votre année 2026 efficacement." },
    de: { title: "Digitaler Planer 2026", desc: "All-in-One Digitaler Planer für iPad/Tablet. Organisieren Sie Ihr Jahr 2026 effizient." },
    ru: { title: "Цифровой планировщик 2026", desc: "Универсальный цифровой планировщик для iPad/планшета. Эффективно организуйте свой 2026 год." },
    pt: { title: "Planejador Digital 2026", desc: "Planejador digital tudo-em-um para iPad/Tablet. Organize seu 2026 com eficiência." },
    "pt-br": { title: "Planner Digital 2026", desc: "Planner digital completo para iPad/Tablet. Organize seu 2026 com eficiência." },
    vi: { title: "Sổ Kế Hoạch Kỹ Thuật Số 2026", desc: "Sổ kế hoạch kỹ thuật số tất cả trong một cho iPad/Máy tính bảng. Sắp xếp năm 2026 của bạn hiệu quả." },
    th: { title: "แพลนเนอร์ดิจิทัล 2026", desc: "แพลนเนอร์ดิจิทัลครบวงจรสำหรับ iPad/แท็บเล็ต จัดระเบียบปี 2026 ของคุณอย่างมีประสิทธิภาพ" },
    id: { title: "Perencana Digital 2026", desc: "Perencana digital all-in-one untuk iPad/Tablet. Atur tahun 2026 Anda secara efisien." },
    ar: { title: "المخطط الرقمي 2026", desc: "مخطط رقمي الكل في واحد لأجهزة iPad / اللوحية. نظم عام 2026 بكفاءة." },
    hi: { title: "डिजिटल प्लानर 2026", desc: "iPad/टै टैबलेट के लिए ऑल-इन-वन डिजिटल प्लानर। अपने 2026 को कुशलतापूर्वक व्यवस्थित करें।" },
    bn: { title: "ডিজিটাল প্ল্যানার 2026", desc: "আইপ্যাড/ট্যাবলেটের জন্য অল-ইন-ওয়ান ডিজিটাল প্ল্যানার। আপনার 2026 সালকে দক্ষতার সাথে সংগঠিত করুন।" },
    fi: { title: "Digitaalinen Kalenteri 2026", desc: "Kaikki yhdessä digitaalinen kalenteri iPadille/tabletille. Järjestä vuotesi 2026 tehokkaasti." }
  },
  cap: {
    en: { title: "Logo Cap", desc: "Stylish ball cap with embroidered logo. Adjustable strap for custom fit." },
    ko: { title: "로고 볼캡", desc: "자수 로고가 들어간 스타일리시한 볼캡입니다. 조절 가능한 스트랩으로 핏을 맞추세요." },
    ja: { title: "ロゴキャップ", desc: "刺繍ロゴ入りのスタイリッシュなボールキャップ。調節可能なストラップでカスタムフィット。" },
    zh: { title: "Logo 棒球帽", desc: "带有刺绣 Logo 的时尚棒球帽。可调节带子，贴合头型。" },
    es: { title: "Gorra con Logo", desc: "Gorra elegante con logo bordado. Correa ajustable para un ajuste personalizado." },
    fr: { title: "Casquette Logo", desc: "Casquette élégante avec logo brodé. Sangle réglable pour un ajustement personnalisé." },
    de: { title: "Logo Kappe", desc: "Stylische Basecap mit gesticktem Logo. Verstellbarer Riemen für individuelle Passform." },
    ru: { title: "Кепка с логотипом", desc: "Стильная кепка с вышитым логотипом. Регулируемый ремешок для удобной посадки." },
    pt: { title: "Boné com Logo", desc: "Boné elegante com logotipo bordado. Alça ajustável para ajuste personalizado." },
    "pt-br": { title: "Boné com Logo", desc: "Boné estiloso com logo bordado. Alça ajustável para um ajuste personalizado." },
    vi: { title: "Mũ Lưỡi Trai Logo", desc: "Mũ lưỡi trai thời trang với logo thêu. Dây đeo có thể điều chỉnh cho vừa vặn." },
    th: { title: "หมวกแก๊ปโลโก้", desc: "หมวกแก๊ปสไตล์หรูพร้อมโลโก้ปัก สายปรับได้เพื่อความกระชับ" },
    id: { title: "Topi Logo", desc: "Topi bola bergaya dengan logo bordir. Tali yang dapat disesuaikan untuk kesesuaian khusus." },
    ar: { title: "قبعة مع شعار", desc: "قبعة أنيقة مع شعار مطرز. حزام قابل للتعديل لمقاس مخصص." },
    hi: { title: "लोगो कैप", desc: "कढ़ाई वाले लोगो के साथ स्टाइलिश बॉल कैप। कस्टम फिट के लिए एडजस्टेबल स्ट्रैप।" },
    bn: { title: "লোগো ক্যাপ", desc: "এমব্রয়ডারি করা লোগো সহ স্টাইলিশ বল ক্যাপ। কাস্টম ফিটের জন্য সামঞ্জস্যযোগ্য স্ট্র্যাপ।" },
    fi: { title: "Logo lippis", desc: "Tyylikäs lippis brodeeratulla logolla. Säädettävä hihna istuvuuden takaamiseksi." }
  },
  tumbler: {
    en: { title: "Minimalist Tumbler", desc: "Stainless steel tumbler. Keeps drinks hot/cold for 12 hours." },
    ko: { title: "미니멀리스트 텀블러", desc: "스테인리스 스틸 텀블러입니다. 12시간 동안 보온/보냉이 유지됩니다." },
    ja: { title: "ミニマリストタンブラー", desc: "ステンレス製タンブラー。温かい飲み物も冷たい飲み物も12時間キープ。" },
    zh: { title: "极简随行杯", desc: "不锈钢随行杯。保温/保冷长达 12 小时。" },
    es: { title: "Vaso Minimalista", desc: "Vaso de acero inoxidable. Mantiene las bebidas frías/calientes durante 12 horas." },
    fr: { title: "Gobelet Minimaliste", desc: "Gobelet en acier inoxydable. Garde les boissons chaudes/froides pendant 12 heures." },
    de: { title: "Minimalistischer Becher", desc: "Becher aus Edelstahl. Hält Getränke 12 Stunden lang heiß/kalt." },
    ru: { title: "Минималистичный тумблер", desc: "Тумблер из нержавеющей стали. Сохраняет напитки горячими/холодными в течение 12 часов." },
    pt: { title: "Copo Minimalista", desc: "Copo de aço inoxidável. Mantém as bebidas quentes/frias por 12 horas." },
    "pt-br": { title: "Copo Minimalista", desc: "Copo térmico de aço inoxidável. Mantém bebidas quentes/geladas por 12 horas." },
    vi: { title: "Bình Giữ Nhiệt Tối Giản", desc: "Bình giữ nhiệt thép không gỉ. Giữ nóng/lạnh trong 12 giờ." },
    th: { title: "แก้วเก็บความเย็นมินิมอล", desc: "แก้วเก็บความเย็นสแตนเลส เก็บความร้อน/เย็นได้นาน 12 ชั่วโมง" },
    id: { title: "Tumbler Minimalis", desc: "Tumbler baja tahan karat. Menjaga minuman panas/dingin selama 12 jam." },
    ar: { title: "كوب بسيط", desc: "كوب ستانلس ستيل. يحافظ على المشروبات ساخنة / باردة لمدة 12 ساعة." },
    hi: { title: "मिनिमलिस्ट टम्बलर", desc: "स्टेनलेस स्टील टम्बलर। पेय को 12 घंटे तक गर्म/ठंडा रखता है।" },
    bn: { title: "মিনিমালিস্ট ্টাম্বলার", desc: "স্টেইনলেস স্টিল টাম্বলার। পানীয় 12 ঘন্টা গরম/ঠান্ডা রাখে।" },
    fi: { title: "Minimalistinen termosmuki", desc: "Ruostumattomasta teräksestä valmistettu termosmuki. Pitää juomat kuumana/kylmänä 12 tuntia." }
  }
};


// General Nav / Labels
const generalTranslations = {
    en: { 
        "nav": { "goods": "Goods Shop" }, 
        "goods": { 
            "hero_title": "Official Store", "hero_desc": "Support your learning.", "category_all": "All", "category_clothing": "Clothing", "category_accessories": "Accessories", "category_digital": "Digital", "category_stationery": "Stationery", "new_arrival": "New", "best_seller": "Best", "sold_out": "Sold Out", "price_unit": "$",
            "add_to_cart": "Add to Cart", "buy_now": "Buy Now", "option_color": "Color", "option_size": "Size", "quantity": "Quantity", "related_items": "You Might Also Like", "back_to_list": "Back to List"
        } 
    },
    ko: { 
        "nav": { "goods": "굿즈샵" }, 
        "goods": { 
            "hero_title": "공식 스토어", "hero_desc": "학습을 응원합니다.", "category_all": "전체", "category_clothing": "의류", "category_accessories": "액세서리", "category_digital": "디지털", "category_stationery": "문구", "new_arrival": "신상품", "best_seller": "베스트", "sold_out": "품절", "price_unit": "$",
            "add_to_cart": "장바구니 담기", "buy_now": "바로 구매", "option_color": "색상", "option_size": "사이즈", "quantity": "수량", "related_items": "함께 보면 좋은 상품", "back_to_list": "목록으로 돌아가기"
        } 
    },
    ja: { 
        "nav": { "goods": "グッズ" }, 
        "goods": { 
            "hero_title": "公式ストア", "category_all": "すべて", "category_clothing": "衣類", "category_accessories": "アクセサリー", "category_digital": "デジタル", "category_stationery": "文房具", "new_arrival": "新着", "best_seller": "人気", "sold_out": "完売", "price_unit": "$",
            "add_to_cart": "カートに入れる", "buy_now": "今すぐ購入", "option_color": "カラー", "option_size": "サイズ", "quantity": "数量", "related_items": "おすすめ商品", "back_to_list": "一覧に戻る"
        } 
    },
    zh: { 
        "nav": { "goods": "周边" }, 
        "goods": { 
            "hero_title": "官方商店", "category_all": "全部", "category_clothing": "服装", "category_accessories": "配饰", "category_digital": "数码", "category_stationery": "文具", "new_arrival": "新品", "best_seller": "热销", "sold_out": "售罄", "price_unit": "$",
            "add_to_cart": "加入购物车", "buy_now": "立即购买", "option_color": "颜色", "option_size": "尺寸", "quantity": "数量", "related_items": "猜你喜欢", "back_to_list": "返回列表"
        } 
    },
    es: { 
        "nav": { "goods": "Tienda" }, 
        "goods": { 
            "hero_title": "Tienda Oficial", "category_all": "Todo", "category_clothing": "Ropa", "category_accessories": "Accesorios", "category_digital": "Digital", "category_stationery": "Papelería", "new_arrival": "Nuevo", "best_seller": "Más Vendido", "sold_out": "Agotado", "price_unit": "$",
            "add_to_cart": "Añadir al Carrito", "buy_now": "Comprar Ahora", "option_color": "Color", "option_size": "Talla", "quantity": "Cantidad", "related_items": "También te podría gustar", "back_to_list": "Volver a la lista"
        } 
    },
    fr: { 
        "nav": { "goods": "Boutique" }, 
        "goods": { 
            "hero_title": "Boutique", "category_all": "Tout", "category_clothing": "Vêtements", "category_accessories": "Accessoires", "category_digital": "Numérique", "category_stationery": "Papeterie", "new_arrival": "Nouveau", "best_seller": "Meilleure Vente", "sold_out": "Épuisé", "price_unit": "$",
            "add_to_cart": "Ajouter au Panier", "buy_now": "Acheter Maintenant", "option_color": "Couleur", "option_size": "Taille", "quantity": "Quantité", "related_items": "Vous pourriez aussi aimer", "back_to_list": "Retour à la liste"
        } 
    },
    de: { 
        "nav": { "goods": "Shop" }, 
        "goods": { 
            "hero_title": "Shop", "category_all": "Alle", "category_clothing": "Kleidung", "category_accessories": "Accessoires", "category_digital": "Digital", "category_stationery": "Schreibwaren", "new_arrival": "Neu", "best_seller": "Bestseller", "sold_out": "Ausverkauft", "price_unit": "$",
            "add_to_cart": "In den Warenkorb", "buy_now": "Jetzt Kaufen", "option_color": "Farbe", "option_size": "Größe", "quantity": "Menge", "related_items": "Das könnte Ihnen auch gefallen", "back_to_list": "Zurück zur Liste"
        } 
    },
    ru: { 
        "nav": { "goods": "Магазин" }, 
        "goods": { 
            "hero_title": "Магазин", "category_all": "Все", "category_clothing": "Одежда", "category_accessories": "Аксессуары", "category_digital": "Цифровые", "category_stationery": "Канцелярия", "new_arrival": "Новинка", "best_seller": "Хит", "sold_out": "Продано", "price_unit": "$",
            "add_to_cart": "В корзину", "buy_now": "Купить сейчас", "option_color": "Цвет", "option_size": "Размер", "quantity": "Количество", "related_items": "Вам может понравиться", "back_to_list": "Назад к списку"
        } 
    },
    pt: { 
        "nav": { "goods": "Loja" }, 
        "goods": { 
            "hero_title": "Loja", "category_all": "Tudo", "category_clothing": "Roupas", "category_accessories": "Acessórios", "category_digital": "Digital", "category_stationery": "Papelaria", "new_arrival": "Novo", "best_seller": "Mais Vendido", "sold_out": "Esgotado", "price_unit": "$",
            "add_to_cart": "Adicionar ao Carrinho", "buy_now": "Comprar Agora", "option_color": "Cor", "option_size": "Tamanho", "quantity": "Quantidade", "related_items": "Você também pode gostar", "back_to_list": "Voltar para a lista"
        } 
    },
    "pt-br": { 
        "nav": { "goods": "Loja" }, 
        "goods": { 
            "hero_title": "Loja", "category_all": "Tudo", "category_clothing": "Roupas", "category_accessories": "Acessórios", "category_digital": "Digital", "category_stationery": "Papelaria", "new_arrival": "Novo", "best_seller": "Mais Vendido", "sold_out": "Esgotado", "price_unit": "$",
            "add_to_cart": "Adicionar ao Carrinho", "buy_now": "Comprar Agora", "option_color": "Cor", "option_size": "Tamanho", "quantity": "Quantidade", "related_items": "Você também pode gostar", "back_to_list": "Voltar para a lista"
        } 
    },
    vi: { 
        "nav": { "goods": "Cửa hàng" }, 
        "goods": { 
            "hero_title": "Cửa hàng", "category_all": "Tất cả", "category_clothing": "Quần áo", "category_accessories": "Phụ kiện", "category_digital": "Kỹ thuật số", "category_stationery": "Văn phòng phẩm", "new_arrival": "Mới", "best_seller": "Bán chạy", "sold_out": "Hết hàng", "price_unit": "$",
            "add_to_cart": "Thêm vào giỏ", "buy_now": "Mua ngay", "option_color": "Màu sắc", "option_size": "Kích thước", "quantity": "Số lượng", "related_items": "Có thể bạn sẽ thích", "back_to_list": "Quay lại danh sách"
        } 
    },
    th: { 
        "nav": { "goods": "ร้านค้า" }, 
        "goods": { 
            "hero_title": "ร้านค้า", "category_all": "ทั้งหมด", "category_clothing": "เสื้อผ้า", "category_accessories": "เครื่องประดับ", "category_digital": "ดิจิทัล", "category_stationery": "เครื่องเขียน", "new_arrival": "ใหม่", "best_seller": "ขายดี", "sold_out": "หมด", "price_unit": "$",
            "add_to_cart": "หยิบใส่ตะกร้า", "buy_now": "ซื้อเลย", "option_color": "สี", "option_size": "ขนาด", "quantity": "จำนวน", "related_items": "คุณอาจชอบสิ่งนี้", "back_to_list": "กลับสู่รายการ"
        } 
    },
    ar: { 
        "nav": { "goods": "المتجر" }, 
        "goods": { 
            "hero_title": "المتجر", "category_all": "الكل", "category_clothing": "ملابس", "category_accessories": "اكسسوارات", "category_digital": "رقمي", "category_stationery": "قرطاسية", "new_arrival": "جديد", "best_seller": "الأكثر مبيعاً", "sold_out": "نفذت الكمية", "price_unit": "$",
            "add_to_cart": "أضف إلى السلة", "buy_now": "اشتر الآن", "option_color": "لون", "option_size": "مقاس", "quantity": "كمية", "related_items": "قد يعجبك أيضاً", "back_to_list": "العودة للقائمة"
        } 
    },
    hi: { 
        "nav": { "goods": "दुकान" }, 
        "goods": { 
            "hero_title": "दुकान", "category_all": "सब", "category_clothing": "कपड़े", "category_accessories": "सामान", "category_digital": "डिजिटल", "category_stationery": "स्टेशनरी", "new_arrival": "नया", "best_seller": "सबसे बिकाऊ", "sold_out": "बिक गया", "price_unit": "$",
            "add_to_cart": "कार्ट में जोड़ें", "buy_now": "अभी खरीदें", "option_color": "रंग", "option_size": "आकार", "quantity": "मात्रा", "related_items": "आपको यह भी पसंद आ सकता है", "back_to_list": "सूची पर वापस जाएं"
        } 
    },
    bn: { 
        "nav": { "goods": "দোকান" }, 
        "goods": { 
            "hero_title": "দোকান", "category_all": "সব", "category_clothing": "পোশাক", "category_accessories": "আনুষাঙ্গিক", "category_digital": "ডিজিটাল", "category_stationery": "স্টেশনারি", "new_arrival": "নতুন", "best_seller": "সেরা বিক্রেতা", "sold_out": "বিক্রি শেষ", "price_unit": "$",
            "add_to_cart": "কার্টে যোগ করুন", "buy_now": "এখনই কিনুন", "option_color": "রঙ", "option_size": "আকার", "quantity": "পরিমাণ", "related_items": "আপনিও পছন্দ করতে পারেন", "back_to_list": "তালিকায় ফিরে যান"
        } 
    },
    fi: { 
        "nav": { "goods": "Kauppa" }, 
        "goods": { 
            "hero_title": "Kauppa", "category_all": "Kaikki", "category_clothing": "Vaatteet", "category_accessories": "Asusteet", "category_digital": "Digitaalinen", "category_stationery": "Paperitarvikkeet", "new_arrival": "Uusi", "best_seller": "Bestseller", "sold_out": "Loppuunmyyty", "price_unit": "$",
            "add_to_cart": "Lisää ostoskoriin", "buy_now": "Osta nyt", "option_color": "Väri", "option_size": "Koko", "quantity": "Määrä", "related_items": "Saatat pitää myös", "back_to_list": "Takaisin luetteloon"
        } 
    }
};

function updateFile(lang) {
    const filePath = path.join(localesDir, `${lang}.json`);
    let json = {};
    if (fs.existsSync(filePath)) {
        try {
            json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { console.error(`Failed to parse ${lang}`, e); }
    }

    // Ensure structure
    if (!json.goods) json.goods = {};
    if (!json.goods.items) json.goods.items = {};

    // 1. General Info
    const gen = generalTranslations[lang] || generalTranslations.en;
    if (!json.nav) json.nav = {};
    json.nav.goods = gen.nav.goods;
    Object.assign(json.goods, gen.goods);

    // 2. Items
    Object.keys(itemTranslations).forEach(key => {
        const item = itemTranslations[key][lang] || itemTranslations[key].en;
        json.goods.items[key] = { 
            title: item.title,
            desc: item.desc
        };
    });

    // 3. Categories (Basic auto-fill if missing, using EN as fallback or simple native maps if known, otherwise keep EN)
    // Detailed category translation omitted for brevity, checking if 'category_clothing' exists in general? No.
    // I will add generic category keys if possible, but user focused on "Product Names". 
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated ${lang}`);
}

const langs = ['ar', 'bn', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'ja', 'ko', 'pt', 'pt-br', 'ru', 'th', 'vi', 'zh'];
langs.forEach(lang => updateFile(lang));
