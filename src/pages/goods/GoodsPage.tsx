/**
 * 굿즈 스토어 메인 뷰(Goods Store Main View):
 * - 목적(Why): 사용자에게 공식 굿즈 상품 목록을 카테고리별로 제공하고 마케팅 배너를 노출하여 구매 액션을 유도함
 * - 방법(How): Framer Motion 애니메이션을 통한 상품 데이터 렌더링, 무한 캐러셀 배너(useMarketingBanners) 연동 및 낙관적 UI 로딩을 수행함
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Box, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { goodsService } from '@/services/goodsService';
import type { Product } from '@/services/goodsService';
import { CATEGORIES } from './data';
import Modal from '@/components/common/Modal';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

function BannerItem({ banner, trackClick, trackView }: { banner: any, trackClick: any, trackView: any }) {
  const { i18n } = useTranslation();
  const title = banner?.title || '';
  const { translatedText } = useAutoTranslation(title, `banner_title_${banner?.id}`, i18n.language);

  if (!banner) return null;

  return (
    <motion.div
      key={banner.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative aspect-[32/9] cursor-pointer"
      onClick={() => {
        trackClick(banner.id);
        if (banner.link_url) window.open(banner.link_url, '_blank', 'noopener');
      }}
    >
      <img
        src={banner.image_url!}
        className="w-full h-full object-cover"
        alt={translatedText || title}
        onLoad={() => trackView(banner.id)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent transparent opacity-40" />
    </motion.div>
  );
}

export default function GoodsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showNotice, setShowNotice] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { banners: subHeroBanners, trackClick, trackView } = useMarketingBanners('hero_slide', 'goods');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (subHeroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % subHeroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [subHeroBanners.length]);

  useEffect(() => {
    document.title = `${t('nav.goods')} | ARA`;
  }, [t]);

  useEffect(() => {
    const hasSeenNotice = sessionStorage.getItem('ara-goods-notice-v30');
    if (!hasSeenNotice) {
      const timer = setTimeout(() => setShowNotice(true), 200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await goodsService.fetchProducts({
          category: activeCategory === 'all' ? undefined : activeCategory,
          is_hidden: false
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCategory]);

  const handleCloseNotice = () => {
    setShowNotice(false);
    sessionStorage.setItem('ara-goods-notice-v30', 'true');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/90 pb-20">
      {showNotice && (
        <Modal 
          isOpen={showNotice} 
          onClose={handleCloseNotice} 
          title={null} 
          className="max-w-[460px] p-0 overflow-hidden border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem]"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="relative min-h-[540px] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* 프리미엄 배경 레이어 — 검증된 로컬 에셋 사용 */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/goods_notice_bg.png" 
                className="w-full h-full object-cover" 
                alt={t('goods.alt.store_membership')} 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
            </div>

            {/* Immersive 콘텐츠 레이어 (중앙 집중형) */}
            <div className="relative z-10 w-full h-full flex flex-col items-center text-center p-10 sm:p-14">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                className="flex flex-col items-center space-y-8"
              >
                {/* 글로우 효과 뱃지 (더 고급스러운 원형 디자인) */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150" />
                  <div className="relative w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
                    <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                      {t('goods.badge.new')}
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {t('goods.title')}
                  </h3>
                  <p className="text-base sm:text-lg leading-relaxed text-white/80 font-medium break-keep px-4 opacity-90">
                    {t('goods.subtitle')}
                  </p>
                </div>

                {/* 프리미엄 버튼 세트 */}
                <div className="pt-6 w-full flex flex-col items-center gap-6">
                  <button 
                    onClick={handleCloseNotice} 
                    className="w-full max-w-[200px] py-4 bg-white text-black rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-5px_rgba(255,255,255,0.2)]"
                  >
                    {t('common.close')}
                  </button>
                  {/* 구현 예정 안내 문구 추가 */}
                  <span className="text-[11px] font-medium text-white/40 tracking-wider">
                    {t('goods.coming_soon')}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Modal>
      )}

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black">
           <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80" alt={t('goods.alt.hero_bg')} />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              {t('goods.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-light">
              {t('goods.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl dark:shadow-none dark:border border-gray-800 p-2 mb-8 flex wrap justify-center gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-primary text-white scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t(`goods.category_${cat}`)}
            </button>
          ))}
        </div>

        {subHeroBanners.length > 0 && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-white/5">
            <AnimatePresence mode="wait">
              <BannerItem
                banner={subHeroBanners[currentSlide]}
                trackClick={trackClick}
                trackView={trackView}
              />
            </AnimatePresence>
            {subHeroBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                {subHeroBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === i ? 'w-6 bg-primary' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>
          ) : (
            products.map(product => (
              <ProductCard key={product.id} product={product} navigate={navigate} t={t} />
            ))
          )}
        </motion.div>

        {products.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            <p>{t('goods.product_not_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, navigate, t }: { product: Product, navigate: any, t: any }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const { translatedText: translatedName } = useAutoTranslation(product.name, `goods_name_${product.id}`, currentLang);

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/goods/${product.id}`)} className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:border border-gray-800 transition-all group cursor-pointer">
      <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img src={product.main_image_url || ''} alt={translatedName || product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 pointer-events-none">
          {product.badge_new && <Badge className="bg-[#00bfa5] text-white uppercase border-none">{t('goods.badge.new')}</Badge>}
          {product.badge_best && <Badge className="bg-amber-500 text-white uppercase border-none">{t('goods.badge.best')}</Badge>}
          {product.discount_percent > 0 && <Badge className="bg-red-500 text-white border-none">{t('goods.badge.off_pattern', { percent: product.discount_percent })}</Badge>}
          {product.status === 'soldout' && <Badge className="bg-zinc-800 text-white uppercase border-none">{t('goods.badge.soldout')}</Badge>}
        </div>
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1 uppercase font-bold">{t(`goods.category_${product.category}`, product.category)}</div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">{translatedName || product.name}</h3>
        <div className="flex items-center justify-between"><span className="font-semibold text-lg text-primary">{t('goods.price_unit')}{(product.sale_price || product.price).toFixed(2)}</span></div>
      </div>
    </motion.div>
  );
}
