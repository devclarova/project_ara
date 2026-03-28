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
    document.title = '굿즈샵 | ARA';
  }, []);

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
        <Modal isOpen={showNotice} onClose={handleCloseNotice} title={null} className="max-w-[420px] h-auto overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-8"><Box size={40} /></div>
            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-black tracking-[0.2em] text-primary/70 uppercase">안내사항</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">ARA 공식 굿즈 스토어</h3>
              <p className="text-[15px] leading-relaxed text-gray-400 dark:text-gray-500 font-medium break-keep px-2">ARA의 정체성을 담은 공식 라인업이 출시될 예정입니다.<br/>예시 상품들을 미리 살펴보세요.</p>
            </div>
            <button onClick={handleCloseNotice} className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 min-w-[140px]">확인</button>
          </motion.div>
        </Modal>
      )}

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black">
           <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80" alt="Hero Background" />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">ARA 공식 스토어</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-light">ARA의 감성을 담은 공식 굿즈 컬렉션</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl dark:shadow-none dark:border border-gray-800 p-2 mb-8 flex wrap justify-center gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-primary text-white scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t(`goods.category_${cat}`, cat.toUpperCase())}
            </button>
          ))}
        </div>

        {subHeroBanners.length > 0 && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-white/5">
            <AnimatePresence mode="wait">
              <motion.div key={subHeroBanners[currentSlide]?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="relative aspect-[32/9] cursor-pointer" onClick={() => { const s = subHeroBanners[currentSlide]; if (s) { trackClick(s.id); if (s.link_url) window.open(s.link_url, '_blank', 'noopener'); } }}>
                <img src={subHeroBanners[currentSlide]?.image_url!} className="w-full h-full object-cover" alt={subHeroBanners[currentSlide]?.title} onLoad={() => trackView(subHeroBanners[currentSlide]?.id!)} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent transparent opacity-40" />
                {subHeroBanners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                    {subHeroBanners.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }} className={`h-1.5 rounded-full transition-all ${currentSlide === i ? 'w-6 bg-primary' : 'w-1.5 bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>
          ) : (
            products.map(product => {
              return (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={product.id} onClick={() => navigate(`/goods/${product.id}`)} className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:border border-gray-800 transition-all group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img src={product.main_image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {product.badge_new && <Badge className="bg-[#00bfa5] text-white">NEW</Badge>}
                      {product.badge_best && <Badge className="bg-amber-500 text-white">BEST</Badge>}
                      {product.discount_percent > 0 && <Badge className="bg-red-500 text-white">{product.discount_percent}% OFF</Badge>}
                      {product.status === 'soldout' && <Badge className="bg-zinc-800 text-white">SOLD OUT</Badge>}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-gray-500 mb-1 uppercase font-bold">{t(`goods.category_${product.category}`, product.category)}</div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between"><span className="font-semibold text-lg text-primary">${product.sale_price || product.price}</span></div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {products.length === 0 && !loading && <div className="text-center py-20 text-gray-500"><p>상품이 존재하지 않습니다.</p></div>}
      </div>
    </div>
  );
}
