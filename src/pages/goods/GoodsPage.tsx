import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, MOCK_PRODUCTS } from './data';

export default function GoodsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = activeCategory === 'all'
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/90 pb-20">
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-black">
           <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
              className="w-full h-full object-cover opacity-80"
              alt="Hero Background"
           />
        </div>
        
        {/* Hero Content */}
        {/* Hero Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">
              {t('goods.hero_title', 'Official Goods Store')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto mb-8 font-light">
              {t('goods.hero_desc', 'Discover special items to support your learning journey.')}
            </p>
            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-primary hover:bg-gray-100 dark:text-primary border-none">
              {t('goods.new_arrival', 'New Arrivals')} <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        
        {/* Category Tabs */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl dark:shadow-none dark:border border-gray-800 p-2 mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${activeCategory === cat 
                  ? 'bg-primary text-white shadow-md transform scale-105' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {t(`goods.category_${cat}`, cat.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key={product.id}
              onClick={() => navigate(`/goods/${product.id}`)}
              className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:border border-gray-800 transition-all duration-300 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img 
                  src={product.image} 
                  alt={t(`goods.items.${product.itemKey}.title`)}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Badges */}
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <Badge className={`
                      ${product.badge === 'sold_out' ? 'bg-gray-800 text-white' : 'bg-red-500 text-white'}
                      uppercase text-[10px] tracking-wider px-2 py-1
                    `}>
                      {t(`goods.${product.badge}`, product.badge.replace('_', ' '))}
                    </Badge>
                  </div>
                )}
                
                {/* Quick Add Overlay (Desktop) */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white/90 dark:bg-black/80 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <ShoppingBag className="w-6 h-6 text-gray-900 dark:text-white" />
                   </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold tracking-wider">
                  {t(`goods.category_${product.category}`, product.category)}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                  {t(`goods.items.${product.itemKey}.title`)}
                </h3>
                <div className="flex items-center justify-between">
                   <span className="font-semibold text-lg text-primary">
                     ${product.price.toFixed(2)}
                   </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {filteredProducts.length === 0 && (
           <div className="text-center py-20 text-gray-500">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>{t('goods.no_products', 'No products found.')}</p>
           </div>
        )}
      </div>
    </div>
  );
}
