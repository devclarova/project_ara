import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, Box, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { goodsService } from '@/services/goodsService';
import type { Product } from '@/services/goodsService';
import { CATEGORIES } from './data';
import Modal from '@/components/common/Modal';

export default function GoodsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showNotice, setShowNotice] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '굿즈샵 | ARA';
  }, []);

  useEffect(() => {
    // 세션 키 v30으로 상향 조정하여 강제 재노출
    const hasSeenNotice = sessionStorage.getItem('ara-goods-notice-v30');
    if (!hasSeenNotice) {
      // 200ms 후 즉시 노출 (지연 최소화)
      const timer = setTimeout(() => setShowNotice(true), 200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await goodsService.fetchProducts({
          category: activeCategory === 'all' ? undefined : activeCategory, // 'all'일 경우 category 필터링 제외
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
    // 즉시 상태 변경 (애니메이션 충돌 방지 위해 AnimatePresence 없이 직접 제어)
    setShowNotice(false);
    sessionStorage.setItem('ara-goods-notice-v30', 'true');
  };

  // filteredProducts는 이제 activeCategory에 따라 goodsService에서 직접 필터링된 products를 사용
  // 따라서 별도의 필터링 로직이 필요 없음. products 상태 자체가 이미 필터링된 결과임.
  // 이 변수는 더 이상 필요 없거나, products를 직접 사용하면 됨.
  // const filteredProducts = products; // 또는 products를 직접 사용

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/90 pb-20">
      {/* 🚀 고속 반응 모달 - 즉각 종료 로직 */}
      {showNotice && (
        <Modal
          isOpen={showNotice}
          onClose={handleCloseNotice}
          title={null}
          className="max-w-[420px] h-auto overflow-hidden border-none shadow-2xl rounded-[2.5rem]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-8">
              <Box size={40} />
            </div>

            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-black tracking-[0.2em] text-primary/70 uppercase">
                안내사항
              </span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                ARA 공식 굿즈 스토어
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-400 dark:text-gray-500 font-medium break-keep px-2">
                ARA의 정체성을 담은 공식 라인업이 출시될 예정입니다.
                <br />
                예시 상품들을 미리 살펴보세요.
              </p>
            </div>

            <button
              onClick={handleCloseNotice}
              className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-90 active:brightness-90 shadow-lg shadow-primary/20 min-w-[140px]"
            >
              확인
            </button>
          </motion.div>
        </Modal>
      )}

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
            className="w-full h-full object-cover opacity-80"
            alt="Hero Background"
          />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">
              ARA 공식 스토어
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-light">
              ARA의 감성을 담은 공식 굿즈 컬렉션
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl dark:shadow-none dark:border border-gray-800 p-2 mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md transform scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {t(`goods.category_${cat}`, cat.toUpperCase())}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
            </div>
          ) : products.map(product => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={product.id}
              onClick={() => navigate(`/goods/${product.id}`)}
              className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:border border-gray-800 transition-all duration-300 group cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img
                  src={product.main_image_url || 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?q=80&w=500'}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.badge_new && (
                    <Badge className="bg-[#00bfa5] text-white shadow-sm text-[10px] font-bold tracking-wider px-2 py-1 uppercase border-none">NEW</Badge>
                  )}
                  {product.badge_best && (
                    <Badge className="bg-amber-500 text-white shadow-sm text-[10px] font-bold tracking-wider px-2 py-1 uppercase border-none">BEST</Badge>
                  )}
                  {product.discount_percent > 0 && (
                    <Badge className="bg-red-500 text-white shadow-sm text-[10px] font-bold tracking-wider px-2 py-1 uppercase border-none">
                        {product.discount_percent}% OFF
                    </Badge>
                  )}
                  {product.status === 'soldout' && (
                    <Badge className="bg-zinc-800 text-white opacity-90 text-[10px] font-bold tracking-wider px-2 py-1 uppercase border-none">SOLD OUT</Badge>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-black/80 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <ShoppingBag size={24} className="text-gray-900 dark:text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold tracking-wider">
                  {t(`goods.category_${product.category}`, product.category)}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg text-primary">
                      ${product.sale_price.toFixed(2)}
                    </span>
                    {product.discount_percent > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {!loading && products.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>상품이 존재하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
