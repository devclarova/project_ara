import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Heart, Share2, Star, Truck, ShieldCheck, ThumbsUp, MoreHorizontal, AlertTriangle, Sparkles, X as XIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { goodsService } from '@/services/goodsService';
import type { Product, ProductOption, ProductVariant } from '@/services/goodsService';
import { Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';



export default function GoodsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  
  // Review Writing State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isBuyer, setIsBuyer] = useState(false); 
  const [photoOnly, setPhotoOnly] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const reviewsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await goodsService.fetchProductById(id);
        if (data) {
          setProduct(data);
          // 기본 옵션 선택
          const initialOptions: Record<string, string> = {};
          data.options?.forEach((opt: any) => {
            if (opt.values?.length > 0) {
              initialOptions[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(initialOptions);

          // Fetch reviews and related products in parallel
          const [reviewsData, relatedData] = await Promise.all([
            goodsService.fetchReviews(id, reviewsPerPage, 0),
            goodsService.fetchRelatedProducts(id, data.category)
          ]);

          // 실구매 내역 및 추천 내역 확인
          if (session?.user) {
            const [purchased, likedIds] = await Promise.all([
                goodsService.checkUserPurchased(session.user.id, id),
                goodsService.fetchMyReviewLikes(session.user.id, id)
            ]);
            setIsBuyer(purchased);
            setMyLikes(likedIds);
          }

          setReviews(reviewsData);
          setHasMore(reviewsData.length === reviewsPerPage);
          setRelatedProducts(relatedData);
        }
      } catch (err) {
        console.error('Failed to fetch product detail data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

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

  // Derived State
  const hasOptions = product.options && product.options.length > 0;
  const currentPrice = product.sale_price || product.price;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      {/* Notice Banner - Brand Color applied */}
      <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 dark:border-primary/40 py-2.5 relative z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2.5 text-primary font-semibold tracking-tight text-[11px] sm:text-xs md:text-sm">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-center">공식 굿즈샵 런칭 준비 중입니다. ARA의 새로운 컬렉션을 먼저 만나보세요.</span>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block shrink-0 opacity-70" />
        </div>
      </div>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <span className="font-semibold text-lg max-w-[200px] truncate opacity-0 md:opacity-100 transition-opacity">
             {product.name}
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
                src={product.main_image_url || 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?q=80&w=800'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge_new && (
                    <Badge className="bg-[#00bfa5] text-white px-3 py-1 text-xs uppercase tracking-widest border-none">NEW</Badge>
                )}
                {product.badge_best && (
                    <Badge className="bg-amber-500 text-white px-3 py-1 text-xs uppercase tracking-widest border-none">BEST</Badge>
                )}
                {product.discount_percent > 0 && (
                    <Badge className="bg-red-500 text-white px-3 py-1 text-xs uppercase tracking-widest border-none">
                        {product.discount_percent}% OFF
                    </Badge>
                )}
                {product.status === 'soldout' && (
                    <Badge className="bg-zinc-800 text-white px-3 py-1 text-xs uppercase tracking-widest border-none opacity-90">SOLD OUT</Badge>
                )}
              </div>
            </div>
            {/* Thumbnails */}
             <div className="grid grid-cols-4 gap-4">
               <div className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-black dark:border-white">
                    <img src={product.main_image_url || 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?q=80&w=200'} className="w-full h-full object-cover" alt="main" />
               </div>
               {product.gallery_urls?.slice(0, 3).map((url: string, i: number) => (
                 <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent">
                    <img src={url} className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt="gallery" />
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
                 {String(t(`goods.category_${product.category}`, product.category))}
               </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <div className="text-3xl font-semibold text-primary">
                  ${currentPrice.toFixed(2)}
                </div>
                {product.discount_percent > 0 && (
                  <div className="text-sm text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-yellow-500 ml-4">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'} 
                    {' '}({reviews.length})
                </span>
              </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed whitespace-pre-wrap">
              {product.summary}
            </p>

            {/* Options */}
            {hasOptions && (
              <div className="space-y-6 mb-8 border-t border-b border-gray-100 dark:border-gray-800 py-6">
                {product.options.map((option: any) => (
                  <div key={option.name}>
                    <label className="block text-sm font-bold mb-3">{option.name}</label>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((val: string) => (
                        <button 
                          key={val}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                          className={`
                            px-4 py-2 rounded-lg border font-medium transition-all
                            ${selectedOptions[option.name] === val 
                              ? 'bg-black text-white dark:bg-white dark:text-black border-transparent scale-105' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}
                          `}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
             <div className="text-lg leading-relaxed mb-8 whitespace-pre-wrap">
               {product.description}
             </div>
             {/* Detail Images if any */}
             {product.gallery_urls?.length > 0 && (
                 <div className="space-y-8">
                     {product.gallery_urls.map((url: string, i: number) => (
                         <img key={i} src={url} className="w-full rounded-2xl shadow-sm" alt="detail" />
                     ))}
                 </div>
             )}
           </div>
        </div>


        {/* Related */}
        <div className="mt-24">
            <div className="mt-20">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold">{t('goods.related_products')}</h2>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             {relatedProducts.length > 0 ? relatedProducts.map(p => (
               <div key={p.id} onClick={() => navigate(`/goods/${p.id}`)} className="cursor-pointer group">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 relative">
                     <img src={p.main_image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={p.name} />
                     {p.discount_percent > 0 && <Badge className="absolute top-2 left-2 bg-red-500 text-white border-none text-[10px]">{p.discount_percent}%</Badge>}
                  </div>
                  <h3 className="font-bold text-sm truncate">{p.name}</h3>
                  <p className="text-primary font-bold text-sm">${p.sale_price.toFixed(2)}</p>
               </div>
             )) : (
              <div className="col-span-full py-10 text-center text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>{t('goods.reviews.no_reviews')}</p>
              </div>
             )}
           </div>
        </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 border-t border-gray-100 dark:border-gray-800 pt-16">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {t('goods.reviews.title')} 
                  <span className="text-gray-400 text-lg font-normal ml-2">({reviews.length})</span>
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-yellow-500">
                        <Star className="w-6 h-6 fill-current" />
                        <span className="text-2xl font-bold ml-2 text-gray-900 dark:text-white">
                          {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('goods.reviews.rating_average')}
                    </div>
                  </div>
                )}
              </div>
              
                <div className="flex gap-2">
                  <Button 
                    variant={photoOnly ? "default" : "outline"} 
                    className="rounded-full"
                    onClick={() => setPhotoOnly(!photoOnly)}
                  >
                     {photoOnly ? t('goods.reviews.view_all') : t('goods.reviews.photo_review')}
                  </Button>
                  <Button 
                    className="rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                        if (!session) {
                            toast.error(t('auth.login_needed'));
                            return;
                        }
                        if (!isBuyer) {
                            toast.error(t('goods.reviews.buyer_only_error'));
                            return;
                        }
                        setIsReviewModalOpen(true);
                    }}
                  >
                     {t('goods.reviews.write_btn')}
                  </Button>
               </div>
           </div>

           {/* Rating Bars - Only show if reviews exist */}
           {reviews.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-2">
                   {[5,4,3,2,1].map((r) => {
                      const count = reviews.filter(rev => rev.rating === r).length;
                      const percent = (count / reviews.length) * 100;
                      return (
                        <div key={r} className="flex items-center gap-3 text-sm">
                           <span className="w-3 font-medium">{r}</span>
                           <Star className="w-3 h-3 text-gray-300 fill-gray-300" />
                           <Progress value={percent} className="h-2 flex-1" />
                           <span className="w-8 text-right text-gray-400">{Math.round(percent)}%</span>
                        </div>
                      );
                   })}
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 flex items-center justify-center text-center border border-gray-100 dark:border-white/5">
                   <div>
                      <p className="text-sm text-gray-500 mb-2">{t('goods.reviews.verified_purchase')}</p>
                      <p className="font-bold text-2xl text-primary">
                          {reviews.length > 0 
                            ? `${Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}%`
                            : t('goods.reviews.no_stats') || '데이터 없음'} 
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {reviews.length > 0 ? "구매자의 긍정적 검토 비율" : "첫 후기를 기다리고 있습니다"}
                      </p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="mb-16 p-10 bg-gray-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/5 text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                   <Star size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">아직 등록된 후기가 없습니다</h3>
                <p className="text-sm text-gray-500">첫 번째 리뷰를 작성하고 다른 구매자들에게 도움을 주세요.</p>
             </div>
           )}

           {/* Review List */}
           <div className="space-y-8">
              {reviews.length > 0 ? reviews
                .filter(r => photoOnly ? r.image_urls && r.image_urls.length > 0 : true)
                .map((review) => (
                 <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-8 last:border-0">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <Avatar>
                             <AvatarImage src={review.user_avatar_url} />
                             <AvatarFallback>{review.user_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                             <div className="font-semibold text-sm">{review.user_name}</div>
                             <div className="flex items-center text-xs text-gray-500 gap-2">
                                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                                <span className="text-green-600 font-medium">{t('goods.reviews.verified_purchase')}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex text-yellow-500 mb-3">
                       {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                       ))}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                       {review.content}
                    </p>

                    {review.image_urls && review.image_urls.length > 0 && (
                       <div className="flex gap-2 mb-4">
                          {review.image_urls.map((img: string, i: number) => (
                             <img key={i} src={img} alt="review" className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-90" />
                          ))}
                       </div>
                    )}

                    <div className="flex items-center gap-4">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className={`gap-1.5 h-8 transition-colors ${myLikes.includes(review.id) ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                         onClick={async () => {
                            if (!session?.user) {
                                toast.error(t('auth.login_needed'));
                                return;
                            }
                            try {
                                const { action } = await goodsService.toggleReviewLike(review.id, session.user.id);
                                // 낙관적 업데이트 또는 상태 갱신
                                if (action === 'liked') {
                                    setMyLikes(prev => [...prev, review.id]);
                                    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, likes: (r.likes || 0) + 1 } : r));
                                } else {
                                    setMyLikes(prev => prev.filter(id => id !== review.id));
                                    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, likes: Math.max(0, (r.likes || 0) - 1) } : r));
                                }
                            } catch (err) {
                                console.error('Toggle like fail:', err);
                            }
                         }}
                       >
                          <ThumbsUp className={`w-4 h-4 ${myLikes.includes(review.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs font-medium">{t('goods.reviews.helpful')} ({review.likes || 0})</span>
                       </Button>
                    </div>
                 </div>
              )) : (
                <div className="text-center py-10 text-gray-400">
                    <p>{t('goods.reviews.no_reviews')}</p>
                    <p className="text-sm mt-1">{t('goods.reviews.be_first')}</p>
                </div>
              )}
           </div>
           
           {hasMore && (
             <div className="mt-8 text-center">
                <Button 
                    variant="outline" 
                    className="w-full md:w-auto px-8 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800"
                    onClick={async () => {
                        if (!id) return;
                        const nextOffset = offset + reviewsPerPage;
                        setOffset(nextOffset);
                        try {
                            const moreReviews = await goodsService.fetchReviews(id, reviewsPerPage, nextOffset);
                            if (moreReviews.length > 0) {
                                setReviews(prev => [...prev, ...moreReviews]);
                                setHasMore(moreReviews.length === reviewsPerPage);
                            } else {
                                setHasMore(false);
                            }
                        } catch (err) {
                            console.error('Fetch more reviews fail:', err);
                        }
                    }}
                >
                   {t('goods.reviews.load_more') || '리뷰 더보기'}
                </Button>
             </div>
           )}
        </div>

      </main>

      {/* Review Writing Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black">{t('goods.reviews.write_btn')}</h3>
                  <p className="text-sm text-gray-500 mt-1">이 상품에 대한 솔직한 경험을 들려주세요</p>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <XIcon size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">상품은 어떠셨나요?</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setNewRating(s)}
                        className={`p-1 transition-all ${newRating >= s ? 'text-yellow-500 scale-110' : 'text-gray-200 dark:text-gray-700'}`}
                      >
                        <Star size={32} fill={newRating >= s ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">상세 후기</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full h-32 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 text-sm resize-none"
                    placeholder="다른 구매자들에게 도움이 될 수 있도록 소중한 후기를 남겨주세요."
                  />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">사진 첨부 (최대 3장)</label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {reviewImages.map((file, idx) => (
                            <div key={idx} className="relative w-24 h-24 flex-shrink-0 group">
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    className="w-full h-full object-cover rounded-xl" 
                                    alt="Preview" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XIcon size={12} />
                                </button>
                            </div>
                        ))}
                        {reviewImages.length < 3 && (
                            <label className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors text-gray-400 hover:text-primary bg-gray-50 dark:bg-zinc-800/50">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    multiple 
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setReviewImages(prev => [...prev, ...files].slice(0, 3));
                                    }}
                                />
                                <ImageIcon size={24} />
                                <span className="text-[10px] font-bold mt-1">추가</span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    disabled={isSubmittingReview}
                    onClick={async () => {
                        if (!newContent.trim()) {
                            toast.error("리뷰 내용을 입력해 주세요.");
                            return;
                        }

                        setIsSubmittingReview(true);
                        try {
                            if (!session?.user) throw new Error("로그인이 필요합니다.");
                            
                            // 1. Upload images if any
                            const imageUrls: string[] = [];
                            for (const file of reviewImages) {
                                try {
                                    const url = await goodsService.uploadImage(file);
                                    imageUrls.push(url);
                                } catch (err) {
                                    console.error('Image upload failed:', err);
                                }
                            }

                            // 2. Fetch profile for user_name/avatar
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('nickname, avatar_url')
                                .eq('user_id', session.user.id)
                                .single();

                            await goodsService.addReview({
                                product_id: product.id,
                                user_id: session.user.id,
                                user_name: profile?.nickname || '익명 사용자',
                                user_avatar_url: profile?.avatar_url || '',
                                rating: newRating,
                                content: newContent,
                                image_urls: imageUrls
                            });
                            
                            toast.success("소중한 리뷰가 등록되었습니다!");
                            setIsReviewModalOpen(false);
                            setNewContent('');
                            setReviewImages([]);
                            // Refresh reviews
                            const rData = await goodsService.fetchReviews(product.id);
                            setReviews(rData);
                        } catch (err: any) {
                            toast.error(err.message);
                        } finally {
                            setIsSubmittingReview(false);
                        }
                    }}
                  >
                    {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                    등록하기
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
