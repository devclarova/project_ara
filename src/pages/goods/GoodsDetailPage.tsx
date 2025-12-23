import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Heart, Share2, Star, Truck, ShieldCheck, ThumbsUp, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { MOCK_PRODUCTS } from './data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const MOCK_REVIEWS = [
  {
    id: 1,
    user: { name: 'Sarah K.', image: 'https://i.pravatar.cc/150?u=1' },
    rating: 5,
    date: '2024-10-15',
    content: "Absolutely love this hoodie! The material is so soft and thick, perfect for fall weather. The resizing is slightly oversized which I prefer. Will definitely buy in other colors.",
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200&h=200'],
    likes: 12
  },
  {
    id: 2,
    user: { name: 'Michael C.', image: 'https://i.pravatar.cc/150?u=2' },
    rating: 4,
    date: '2024-10-10',
    content: "Great quality for the price. Fast shipping too. I took one star off because the color is slightly darker than the picture, but still looks good.",
    likes: 5
  },
  {
    id: 3,
    user: { name: 'Emily R.', image: 'https://i.pravatar.cc/150?u=3' },
    rating: 5,
    date: '2024-09-28',
    content: "This planner has changed my life! So easy to use on my iPad. Highly recommend for students.",
    likes: 24
  }
];

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

        {/* Reviews Section */}
        <div className="mt-24 border-t border-gray-100 dark:border-gray-800 pt-16">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('goods.reviews.title')} <span className="text-gray-400 text-lg font-normal">({t('goods.reviews.count', {count: 128})})</span></h2>
                <div className="flex items-center gap-4">
                   <div className="flex items-center text-yellow-500">
                      <Star className="w-6 h-6 fill-current" />
                      <span className="text-2xl font-bold ml-2 text-gray-900 dark:text-white">4.9</span>
                   </div>
                   <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('goods.reviews.rating_average')}
                   </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <Button variant="outline" className="rounded-full">
                    {t('goods.reviews.photo_review')}
                 </Button>
                 <Button className="rounded-full">
                    {t('goods.reviews.write_btn')}
                 </Button>
              </div>
           </div>

           {/* Rating Bars - Visual Only */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-2">
                 {[5,4,3,2,1].map((r) => (
                    <div key={r} className="flex items-center gap-3 text-sm">
                       <span className="w-3 font-medium">{r}</span>
                       <Star className="w-3 h-3 text-gray-300 fill-gray-300" />
                       <Progress value={r === 5 ? 85 : r === 4 ? 10 : 5} className="h-2 flex-1" />
                       <span className="w-8 text-right text-gray-400">{r === 5 ? '85%' : r === 4 ? '10%' : '5%'}</span>
                    </div>
                 ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 flex items-center justify-center text-center">
                 <div>
                    <p className="text-sm text-gray-500 mb-2">{t('goods.reviews.verified_purchase')}</p>
                    <p className="font-medium text-lg">98% {t('goods.reviews.helpful')}</p>
                 </div>
              </div>
           </div>

           {/* Review List */}
           <div className="space-y-8">
              {MOCK_REVIEWS.map((review) => (
                 <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-8 last:border-0">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <Avatar>
                             <AvatarImage src={review.user.image} />
                             <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                             <div className="font-semibold text-sm">{review.user.name}</div>
                             <div className="flex items-center text-xs text-gray-500 gap-2">
                                <span>{review.date}</span>
                                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                                <span className="text-green-600 font-medium">{t('goods.reviews.verified_purchase')}</span>
                             </div>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                       </Button>
                    </div>

                    <div className="flex text-yellow-500 mb-3">
                       {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                       ))}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                       {review.content}
                    </p>

                    {review.images && (
                       <div className="flex gap-2 mb-4">
                          {review.images.map((img, i) => (
                             <img key={i} src={img} alt="review" className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-90" />
                          ))}
                       </div>
                    )}

                    <div className="flex items-center gap-4">
                       <Button variant="ghost" size="sm" className="text-gray-500 gap-1.5 h-8 hover:text-primary">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs font-medium">{t('goods.reviews.helpful')} ({review.likes})</span>
                       </Button>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-8 text-center">
              <Button variant="outline" className="w-full md:w-auto px-8 rounded-full">
                 More Reviews
              </Button>
           </div>
        </div>

      </main>
    </div>
  );
}
