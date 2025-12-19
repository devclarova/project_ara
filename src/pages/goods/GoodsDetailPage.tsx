import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Heart, Share2, Star, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { MOCK_PRODUCTS } from './data';

export default function GoodsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Parse ID safely
  const productId = Number(id);
  const product = MOCK_PRODUCTS.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('goods.product_not_found')}</h2>
          <Button onClick={() => navigate('/goods')}>{t('goods.back_to_list')}</Button>
        </div>
      </div>
    );
  }

  // Mock Options
  const colors = ['black', 'white', 'navy', 'gray'];
  const sizes = ['S', 'M', 'L', 'XL'];
  const hasOptions = product.category === 'clothing' || product.category === 'accessories';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <span className="font-semibold text-lg max-w-[200px] truncate opacity-0 md:opacity-100 transition-opacity">
             {t(`goods.items.${product.itemKey}.title`)}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/goods')}>
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-900 relative group">
              <img 
                src={product.image} 
                alt={t(`goods.items.${product.itemKey}.title`)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs uppercase tracking-widest">
                  {t(`goods.${product.badge}`, product.badge.replace('_', ' '))}
                </Badge>
              )}
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
               {[1,2,3,4].map((i) => (
                 <div key={i} className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 ${i===1 ? 'border-black dark:border-white' : 'border-transparent'}`}>
                    <img src={product.image} className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="thumbnail" />
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-2">
               <span className="text-sm font-bold tracking-wider text-primary uppercase">
                 {t(`goods.category_${product.category}`)}
               </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {t(`goods.items.${product.itemKey}.title`)}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-semibold">
                ${product.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">4.9 ({t('goods.reviews_count', { count: 128 })})</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {t(`goods.items.${product.itemKey}.desc`)}
            </p>

            {/* Options */}
            {hasOptions && (
              <div className="space-y-6 mb-8 border-t border-b border-gray-100 dark:border-gray-800 py-6">
                <div>
                  <label className="block text-sm font-bold mb-3">{t('goods.option_color')}</label>
                  <div className="flex gap-3">
                    {colors.map(c => (
                      <button 
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === c ? 'border-primary scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c === 'white' ? '#f0f0f0' : c }}
                      >
                         {selectedColor === c && <div className="w-2 h-2 rounded-full bg-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-3">{t('goods.option_size')}</label>
                  <div className="flex gap-3">
                    {sizes.map(s => (
                       <button
                         key={s}
                         onClick={() => setSelectedSize(s)}
                         className={`h-10 px-4 rounded-lg border font-medium transition-all ${selectedSize === s ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}`}
                       >
                         {s}
                       </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
               <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-4 h-14 w-fit bg-gray-50 dark:bg-gray-900">
                  <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="px-2 hover:text-primary">-</button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity+1)} className="px-2 hover:text-primary">+</button>
               </div>
               <Button className="flex-1 h-14 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90">
                 {t('goods.add_to_cart')}
               </Button>
               <Button variant="outline" className="h-14 w-14 rounded-full p-0 flex-shrink-0" onClick={() => setIsWishlisted(!isWishlisted)}>
                 <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
               </Button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
               <div className="flex items-center gap-2">
                 <Truck className="w-5 h-5" />
                 <span>{t('goods.free_shipping')}</span>
               </div>
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5" />
                 <span>{t('goods.authentic_guarantee')}</span>
               </div>
            </div>
          </motion.div>
        </div>
        
        {/* Product Detail Content */}
        <div className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-16">
           <h2 className="text-2xl font-bold mb-8">{t('goods.product_details')}</h2>
           <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
             <p className="text-lg leading-relaxed mb-8">
               {t(`goods.items.${product.itemKey}.desc`)}
             </p>
             {/* Placeholder for more detailed content */}
             <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 text-center text-gray-400 dark:text-gray-600">
               Detail Content Area (Images, Long Description, specs...)
             </div>
           </div>
        </div>

        {/* Related */}
        <div className="mt-24">
           <h2 className="text-2xl font-bold mb-8">{t('goods.related_items')}</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {MOCK_PRODUCTS.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                 <div key={p.id} className="group cursor-pointer" onClick={() => { navigate(`/goods/${p.id}`); window.scrollTo(0,0); }}>
                    <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
                       <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="font-medium text-sm truncate">{t(`goods.items.${p.itemKey}.title`)}</div>
                    <div className="text-gray-500 text-sm">${p.price.toFixed(2)}</div>
                 </div>
              ))}
           </div>
        </div>

      </main>
    </div>
  );
}
