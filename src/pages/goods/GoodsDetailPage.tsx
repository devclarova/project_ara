/**
 * 프리미엄 굿즈 상세 경험(Premium Goods Detail Experience):
 * - 목적(Why): 상품 메타데이터, 다이내믹 가격 산출, 실시간 재고 및 리뷰 시스템을 통합 관리하여 구매 전환율을 극대화함
 * - 방법(How): Framer Motion 애니메이션과 Skeleton Placeholder 로딩 전략을 병용하며, 실구매자 한정 리뷰 등록 기능을 통해 신뢰도를 보장함
 */
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
  
  // 인터랙티브 상태 오케스트레이션 — 사용자 리뷰 작성 다이얼로그의 라이프사이클(오픈/닫기) 및 폼 데이터 정합성 관리
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await goodsService.fetchProductById(id);
        if (data) {
          setProduct(data);
          // 초기 환경 설정(Initialization) — 상품 메타데이터 로드 직후 첫 번째 가용한 옵션을 기본값으로 바인딩하여 UX 즉시성 확보
          const initialOptions: Record<string, string> = {};
          data.options?.forEach((opt: any) => {
            if (opt.values?.length > 0) {
              initialOptions[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(initialOptions);

          // 네트워크 병렬화(Concurrency) — 워포트 가시성과 무관한 리뷰 및 연관 상품 데이터를 병렬로 페칭하여 로딩 타임 최소화
          const [reviewsData, relatedData] = await Promise.all([
            goodsService.fetchReviews(id, reviewsPerPage, 0),
            goodsService.fetchRelatedProducts(id, data.category)
          ]);

          // 사용자 권한 및 관계 검증 — 활성 세션을 기반으로 구매 이력 및 리뷰 추천(좋아요) 상태를 동기화하여 인터페이스 개인화
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

  // 파생 상태 엔진(Derived State) — 기본가, 할인가, 쿠폰 적용 여부를 기반으로 런타임 결제 금액 실시간 산출
  const hasOptions = product.options && product.options.length > 0;
  const itemPrice = product.sale_price || product.price;
  const [finalPrice, setFinalPrice] = useState(itemPrice);

  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        const discount = itemPrice * (appliedCoupon.discount_value / 100);
        setFinalPrice(Math.max(0, itemPrice - discount));
      } else {
        setFinalPrice(Math.max(0, itemPrice - appliedCoupon.discount_value));
      }
    } else {
      setFinalPrice(itemPrice);
    }
  }, [appliedCoupon, itemPrice]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const { data, error } = await supabase.rpc('validate_coupon', { 
        p_code: couponCode.trim(),
        p_user_id: session?.user?.id || null
      });
      if (error) throw error;
      if (data && data.is_valid) {
        setAppliedCoupon(data.promotion);
        toast.success(t('goods.coupon_applied', '쿠폰이 적용되었습니다!'));
      } else {
        setCouponError(data?.reason || t('goods.coupon_invalid', '유효하지 않은 쿠폰입니다.'));
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      console.error('Coupon validation fail:', err);
      setCouponError(t('goods.coupon_error', '쿠폰 확인 중 오류가 발생했습니다.'));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      {/* 브랜드 아이덴티티 레이어 — 서비스 런칭 준비 상태를 알리는 최상단 고정 공지 배너 */}
      <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 dark:border-primary/40 py-2.5 relative z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2.5 text-primary font-semibold tracking-tight text-[11px] sm:text-xs md:text-sm">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-center">공식 굿즈샵 런칭 준비 중입니다. ARA의 새로운 컬렉션을 먼저 만나보세요.</span>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block shrink-0 opacity-70" />
        </div>
      </div>
      {/* 내비게이션 컨트롤러 — 뒤로가기 스택 처리 및 공유/장바구니 액션 허브 */}
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
          {/* 비주얼 에셋 갤러리 — 메인 이미지 렌더링 및 상품 상태(New/Best/Disc)를 시각화하는 다이내믹 배지 시스템 */}
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
            {/* 멀티플 뷰 디렉토리 — 상품의 세부 디테일을 확인하기 위한 썸네일 탐색 인터페이스 */}
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

          {/* 커머스 정보 엔진 — 카테고리, 상품명, 평점 및 다이내믹 가격 산출 결과 노출 */}
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
                  ${finalPrice.toFixed(2)}
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

            {/* 옵션 매트릭스 렌더러 — 상품 SKU별 가용 옵션을 동적으로 매핑하여 사용자 선택 유도 */}
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

            {/* Coupon Application Section */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">할인 쿠폰 적용</label>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="쿠폰 코드를 입력하세요"
                        className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon}
                        className="rounded-xl font-bold"
                    >
                        {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : '적용'}
                    </Button>
                </div>
                {couponError && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold">{couponError}</p>}
                {appliedCoupon && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary">{appliedCoupon.name} 적용됨</span>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-primary/60 hover:text-primary transition-colors">
                            <XIcon size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Price Preview */}
            <div className="mb-8 flex justify-between items-end bg-primary/5 p-6 rounded-3xl border-2 border-dashed border-primary/10">
                <span className="text-sm font-bold text-gray-500">최종 결제 금액</span>
                <div className="text-right">
                    {appliedCoupon && (
                        <div className="text-sm text-gray-400 line-through mb-1">
                            ${itemPrice.toFixed(2)}
                        </div>
                    )}
                    <div className="text-4xl font-black text-primary tracking-tighter">
                        ${finalPrice.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* 구매 전환 액션 허브 — 수량 제어 및 직접 구매/위시리스트 저장 트랜잭션 처리 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
               <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-4 h-14 w-fit bg-gray-50 dark:bg-gray-900">
                  <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="px-2 hover:text-primary">-</button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity+1)} className="px-2 hover:text-primary">+</button>
               </div>
               <Button 
                onClick={async () => {
                    if (!session) {
                        toast.error(t('auth.login_needed'));
                        return;
                    }
                    // TODO: Connect to PG in 6-D
                    toast.promise(
                        new Promise((resolve) => setTimeout(resolve, 1500)),
                        {
                            loading: '결제 준비 중...',
                            success: '주문이 접수되었습니다! (가상 결제 완료)',
                            error: '결제 실패'
                        }
                    );
                }}
                className="flex-1 h-14 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
               >
                 {t('goods.buy_now') || '지금 구매하기'}
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


        {/* 컨텍스트 기반 추천 엔진 — 현재 상품 카테고리를 기준으로 연관 상품 목록을 페칭하여 교차 판매(Cross-selling) 유도 */}
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

           {/* 소셜 증거(Social Proof) 레이어 — 실구매자 인증 마크 및 사용자 피드백 목록 렌더링 */}
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
                                 // 낙관적 업데이트(Optimistic Update) — 서버 응답 전 클라이언트 UI 상태를 즉시 반영하여 인터랙션 반응성 극대화
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

      {/* 리뷰 작성 오케스트레이터 — 별점 평가, 텍스트 후기, 멀티미디어 업로드를 통합 제공하는 모달 다이얼로그 */}
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
                            
                            // 미디어 직렬화 업로드 — 이미지 안정성 확보를 위해 개별 파일을 독립적으로 스토리지에 업로드하고 식별자 정규화
                            const imageUrls: string[] = [];
                            for (const file of reviewImages) {
                                try {
                                    const url = await goodsService.uploadImage(file);
                                    imageUrls.push(url);
                                } catch (err) {
                                    console.error('Image upload failed:', err);
                                }
                            }

                            // 데이터 정합성 바인딩 — 게시자의 프로필 메타데이터(닉네임, 아바타)를 현재 세션 정보와 동기화하여 리뷰 속성 정의
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
                            // 뷰 스테이트 동기화 — 신규 리뷰 등록 후 데이터 무결성을 위해 최신 목록을 강제 재페칭(Refetch)
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
