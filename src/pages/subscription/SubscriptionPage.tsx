/**
 * 프리미엄 구독 및 멤버십 관리 센터 (Subscription Management Center):
 * - Refactored: Dynamic plan fetching from Supabase, Monthly/Yearly toggle, Feature comparison table
 * - Theme: Teal (#00BFA5) Brand Identity
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  Check, X, ArrowLeft, Loader2, Zap, ShieldCheck, 
  Sparkles, Info, Gift, CreditCard, AlertCircle,
  ChevronDown, Globe, Star, ShoppingCart, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SeagullIcon from '@/components/common/SeagullIcon';
import FloatingButtons from '@/components/common/FloatingButtons';

// --- Local Types for Data Stability ---
interface PlanConfig {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  yearly_price: number;
  description: string | null;
  features: { label: string; active: boolean }[];
  is_popular: boolean;
  sort_order: number;
  color: string | null;
  is_active: boolean;
}

interface PlanPromotion {
  id: string;
  plan_id: string | null; // null means global
  label: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
}

// Type-safe DB access without 'as any'
type SubscriptionTable = 'plan_configs' | 'plan_promotions' | 'subscriptions' | 'profiles';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, userPlan, refreshUserPlan } = useAuth();

  // --- State Management ---
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [promotions, setPromotions] = useState<PlanPromotion[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Coupon State
  interface AppliedCoupon {
    id: string;
    code: string;
    title: string;
    discount_type: 'percentage' | 'fixed' | 'percent';
    discount_value: number;
    min_order_amount?: number;
    max_discount?: number | null;
    source: 'wallet' | 'manual';
    user_coupon_id?: string;
    target_type?: string;
  }

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<React.ReactNode>('');
  const [walletCoupons, setWalletCoupons] = useState<any[]>([]);
  const [selectedWalletCouponId, setSelectedWalletCouponId] = useState<string>('');

  const getCouponConstraintInfo = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return { usage: '요금제·굿즈샵', target: '전체' };
      case 'subscription':
        return { usage: '요금제', target: '전체' };
      case 'goods':
        return { usage: '굿즈샵', target: '전체' };
      case 'subscriber':
        return { usage: '굿즈샵', target: '프리미엄 회원' };
      case 'new_user':
        return { usage: '정책 확인 필요', target: '신규 유저' };
      default:
        return { usage: '알 수 없음', target: '알 수 없음' };
    }
  };

  // Load unused wallet coupons when payment modal opens
  useEffect(() => {
    if (isPaymentModalOpen && session?.user?.id) {
      const fetchWalletCoupons = async () => {
        try {
          const { data: walletData, error: walletError } = await (supabase.from('user_coupons') as any)
            .select(`
              id,
              is_used,
              coupon_id,
              coupons (
                id,
                code,
                promotions (
                  id,
                  title,
                  discount_type,
                  discount_value,
                  min_order_amount,
                  max_discount,
                  starts_at,
                  ends_at,
                  is_active,
                  target_type
                )
              )
            `)
            .eq('user_id', session.user.id)
            .eq('is_used', false);
          
          if (walletError) throw walletError;
          if (walletData) {
            // Client-side validation of active status and date bounds
            const validCoupons = walletData.filter((wc: any) => {
              const promo = wc.coupons?.promotions;
              if (!promo || !promo.is_active) return false;
              if (promo.starts_at && new Date(promo.starts_at) > new Date()) return false;
              if (promo.ends_at && new Date(promo.ends_at) < new Date()) return false;
              // Filter target_type for subscription check-out
              if (promo.target_type !== 'subscription' && promo.target_type !== 'all') return false;
              return true;
            });
            setWalletCoupons(validCoupons);
          }
        } catch (err) {
          console.error('Error fetching wallet coupons:', err);
        }
      };
      fetchWalletCoupons();
    } else {
      setWalletCoupons([]);
    }
  }, [isPaymentModalOpen, session?.user?.id]);

  const handleSelectWalletCoupon = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userCouponId = e.target.value;
    setSelectedWalletCouponId(userCouponId);
    if (!userCouponId) {
      setAppliedCoupon(null);
      return;
    }
    const selected = walletCoupons.find(wc => wc.id === userCouponId);
    if (selected && selected.coupons && selected.coupons.promotions) {
      const promo = selected.coupons.promotions;
      setAppliedCoupon({
        id: selected.coupons.id,
        code: selected.coupons.code,
        title: promo.title || '',
        discount_type: promo.discount_type === 'percent' ? 'percentage' : promo.discount_type,
        discount_value: promo.discount_value || 0,
        min_order_amount: promo.min_order_amount || 0,
        max_discount: promo.max_discount || null,
        source: 'wallet',
        user_coupon_id: selected.id,
        target_type: promo.target_type
      });
      // Clear manual coupon input and errors
      setCouponCode('');
      setCouponError('');
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Initial subscription integrity check via RPC
        if (session?.user?.id) {
          await (supabase as any).rpc('check_user_subscription', { p_user_id: session.user.id });
        }
        
        // 2. Fetch Plan Configurations
        const { data: planData, error: planError } = await (supabase as any)
          .from('plan_configs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (planError) throw planError;
        if (planData) setPlans(planData as unknown as PlanConfig[]);

        // 3. Fetch Active Promotions
        const { data: promoData, error: promoError } = await (supabase as any)
          .from('plan_promotions')
          .select('*')
          .eq('is_active', true);
        
        if (promoError) throw promoError;
        if (promoData) setPromotions(promoData as unknown as PlanPromotion[]);

      } catch (err) {
        console.error('Subscription init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [session?.user?.id]);

  // --- Business Logic ---
  const getActivePromo = (planId: string) => {
    return promotions.find(p => p.plan_id === planId || p.plan_id === null);
  };

  const calculatePrice = (plan: PlanConfig) => {
    const basePrice = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
    const promo = getActivePromo(plan.id);
    
    if (!promo) return basePrice;
    
    if (promo.discount_type === 'percentage') {
      return basePrice * (1 - promo.discount_value / 100);
    } else {
      return Math.max(0, basePrice - promo.discount_value);
    }
  };

  const calculateSavings = (plan: PlanConfig) => {
    if (plan.monthly_price === 0) return 0;
    const monthlyTotal = plan.monthly_price * 12;
    const savings = ((monthlyTotal - plan.yearly_price) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  const handleSubscribeClick = (plan: PlanConfig) => {
    if (!session?.user?.id) {
      toast.error(t('subscription.errors.login_required'));
      navigate('/signin?redirect=/subscription');
      return;
    }

    if (plan.name === 'free') {
      if (userPlan === 'free') {
        toast.info(t('subscription.errors.already_free'));
        return;
      }
      setIsCancelModalOpen(true);
      return;
    }

    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const calculateFinalPrice = (plan: PlanConfig) => {
    const basePrice = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
    
    if (appliedCoupon) {
      const isPercent = appliedCoupon.discount_type === 'percentage' || appliedCoupon.discount_type === 'percent';
      let discountAmount = 0;
      if (isPercent) {
        discountAmount = basePrice * (appliedCoupon.discount_value / 100);
        if (appliedCoupon.max_discount !== null && appliedCoupon.max_discount !== undefined) {
          discountAmount = Math.min(discountAmount, appliedCoupon.max_discount);
        }
      } else {
        discountAmount = appliedCoupon.discount_value;
      }
      return Math.max(0, basePrice - discountAmount);
    }
    
    return calculatePrice(plan);
  };

  const handleConfirmPayment = async () => {
    if (!session?.user?.id || !selectedPlan) return;

    setLoadingPlan(selectedPlan.id);
    try {
      const finalPrice = calculateFinalPrice(selectedPlan);

      // Call complete_subscription_checkout RPC (atomic transaction)
      // Note: In mock checkout phase, p_payment_method is set to 'pending_paddle'
      // Future Paddle integration will call the same RPC with payment verified parameters
      const { data, error: rpcErr } = await (supabase as any).rpc('complete_subscription_checkout', {
        p_plan: selectedPlan.name,
        p_billing_cycle: billingCycle,
        p_coupon_id: appliedCoupon?.id || null,
        p_expected_final_amount: finalPrice,
        p_payment_method: 'pending_paddle'
      });

      if (rpcErr) throw rpcErr;

      const result = data as any;
      if (!result || !result.success) {
        throw new Error(result?.reason || '결제 처리에 실패했습니다.');
      }

      toast.success('구독이 완료되었습니다.');
      await new Promise(resolve => setTimeout(resolve, 800));
      await refreshUserPlan();
      setIsPaymentModalOpen(false);
      setAppliedCoupon(null);
      setCouponCode('');
      setSelectedWalletCouponId('');
      setCouponError('');
    } catch (err: any) {
      console.error('Payment error:', err);
      let userFriendlyMsg = '결제 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      const errMsg = err.message || '';
      
      if (errMsg.includes('coupon_not_applicable_to_subscription') || errMsg.includes('이 쿠폰은 요금제 결제에 사용할 수 없습니다.')) {
        userFriendlyMsg = '이 쿠폰은 요금제 결제에 사용할 수 없습니다.';
      } else if (errMsg.includes('wallet_coupon_already_used') || errMsg.includes('이미 사용 완료된 보유 쿠폰입니다.')) {
        userFriendlyMsg = '이미 사용 완료된 보유 쿠폰입니다.';
      } else if (errMsg.includes('coupon_already_used') || errMsg.includes('이미 사용 처리된 쿠폰입니다.')) {
        userFriendlyMsg = '이미 사용 처리된 쿠폰입니다.';
      } else if (errMsg.includes('coupon_expired') || errMsg.includes('사용 기간이 만료된 쿠폰입니다.')) {
        userFriendlyMsg = '사용 기간이 만료된 쿠폰입니다.';
      } else if (errMsg.includes('coupon_usage_limit_exceeded') || errMsg.includes('쿠폰 전체 사용 수량이 초과되었습니다.')) {
        userFriendlyMsg = '쿠폰 전체 사용 수량이 초과되었습니다.';
      } else if (errMsg.includes('amount_mismatch') || errMsg.includes('결제 금액 검증 실패')) {
        userFriendlyMsg = '결제 금액 정보가 일치하지 않습니다. 쿠폰을 다시 적용해 주세요.';
      } else if (errMsg.includes('profile_not_found') || errMsg.includes('사용자 프로필 정보를 찾을 수 없습니다.')) {
        userFriendlyMsg = '사용자 프로필 정보를 찾을 수 없습니다. 고객센터에 문의해 주세요.';
      } else if (errMsg.includes('constraint') || errMsg.includes('violates foreign key')) {
        userFriendlyMsg = '쿠폰 적용에 실패했습니다. 다른 쿠폰을 선택하거나 쿠폰을 해제한 뒤 다시 시도해 주세요.';
      }
      
      toast.error(userFriendlyMsg);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !session?.user?.id) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const { data, error } = await (supabase as any).rpc('validate_coupon', { 
        p_code: couponCode.trim().toUpperCase(),
        p_user_id: session.user.id
      });
      
      if (error) throw error;
      
      const rpcData = data as any;
      const isValid = Boolean(rpcData?.is_valid ?? rpcData?.valid);

      if (rpcData && isValid) {
        // Fetch promotion.target_type using coupons -> promotions relationship to verify target_type
        const { data: couponDetail, error: detailError } = await supabase
          .from('coupons')
          .select(`
            id,
            promotions (
              target_type
            )
          `)
          .eq('id', rpcData.coupon_id)
          .single();

        if (detailError || !couponDetail) {
          setCouponError('쿠폰 유효성을 확인할 수 없습니다.');
          setAppliedCoupon(null);
          return;
        }

        const targetType = (couponDetail as any).promotions?.target_type;
        if (targetType !== 'subscription' && targetType !== 'all') {
          const info = getCouponConstraintInfo(targetType);
          setCouponError(
            <div className="flex flex-col gap-1 mt-1 text-red-500 font-bold text-xs">
              <div>이 쿠폰은 요금제 결제에 사용할 수 없습니다.</div>
              <div className="text-[10px] opacity-90 pl-1 font-semibold space-y-0.5 leading-normal">
                <div>사용처: {info.usage}</div>
                <div>대상: {info.target}</div>
              </div>
            </div>
          );
          setAppliedCoupon(null);
          return;
        }

        const promoObj: AppliedCoupon = {
          id: rpcData.coupon_id,
          code: couponCode.trim().toUpperCase(),
          title: rpcData.title || rpcData.promotion?.title || '',
          discount_type: rpcData.discount_type === 'percent' ? 'percentage' : (rpcData.discount_type || 'fixed'),
          discount_value: rpcData.discount_value || 0,
          min_order_amount: rpcData.min_order_amount || 0,
          max_discount: rpcData.max_discount || null,
          source: 'manual',
          target_type: targetType
        };

        setAppliedCoupon(promoObj);
        setSelectedWalletCouponId(''); // Reset wallet dropdown selection via React State

        toast.success(t('subscription.errors.coupon_success'));
      } else {
        setCouponError(rpcData?.reason ?? rpcData?.error ?? t('subscription.errors.coupon_invalid'));
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(t('subscription.errors.coupon_error'));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00BFA5]" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors selection:bg-[#00BFA5]/30">
      
      {/* Promotion Banner */}
      <AnimatePresence>
        {promotions.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-[#00BFA5] to-[#00E5FF] py-3 px-4 text-center overflow-hidden"
          >
            <p className="text-white text-xs md:text-sm font-black tracking-tight flex items-center justify-center gap-2">
              <Gift size={16} className="shrink-0" />
              {promotions[0].label} — Limited Time Offer!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative pt-16 pb-32 overflow-hidden px-4 md:px-0">
        {/* Background Ambience */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#00BFA5]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#00E5FF]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#00BFA5] transition-colors mb-8">
            <ArrowLeft size={16} /> {t('subscription.back')}
          </button>

          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              {t('subscription.title_prefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BFA5] to-[#00E5FF]">{t('subscription.title_highlight')}</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('subscription.description')}
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-black transition-colors ${billingCycle === 'monthly' ? 'text-[#00BFA5]' : 'text-gray-400'}`}>월간</span>
              <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-14 h-7 bg-gray-200 dark:bg-zinc-800 rounded-full p-1 transition-colors"
              >
                <motion.div 
                  animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-[#00BFA5] rounded-full shadow-lg"
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black transition-colors ${billingCycle === 'yearly' ? 'text-[#00BFA5]' : 'text-gray-400'}`}>연간</span>
                <span className="bg-[#00BFA5]/10 text-[#00BFA5] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">25% 절약</span>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mb-32">
            {plans.map((plan) => {
              const promo = getActivePromo(plan.id);
              const price = calculatePrice(plan);
              const savings = calculateSavings(plan);
              const isCurrentPlan = userPlan === plan.name || (!userPlan && plan.name === 'free');

                return (
                  <motion.div 
                    key={plan.id}
                    layout
                    className={`relative h-full rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 ${
                      plan.is_popular 
                        ? 'bg-zinc-900 dark:bg-zinc-900 border-2 border-[#00BFA5] shadow-2xl shadow-[#00BFA5]/20 md:-translate-y-4' 
                        : 'bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 hover:-translate-y-2'
                    } ${isCurrentPlan ? 'ring-2 ring-[#00BFA5]/50 ring-offset-4 dark:ring-offset-[#0a0a0a]' : ''}`}
                  >
                  {plan.is_popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#00BFA5] text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#00BFA5]/30">
                      {t('subscription.popular_badge')}
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className={`text-2xl font-black mb-2 ${plan.is_popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.display_name || plan.name}
                    </h3>
                    <p className={`text-sm h-12 leading-tight ${plan.is_popular ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black tracking-tight ${plan.is_popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        ${price.toFixed(2)}
                      </span>
                      <span className={`font-bold ${plan.is_popular ? 'text-gray-500' : 'text-gray-400'}`}>
                        /{billingCycle === 'monthly' ? '월' : '년'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <p className="text-[#00BFA5] text-[11px] font-black mt-2 uppercase tracking-tight">🎉 Save {savings}% with yearly billing</p>
                    )}
                  </div>

                  {isCurrentPlan && (
                    <div className="flex justify-center mb-4">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#00BFA5]/10 text-[#00BFA5] border border-[#00BFA5]/30 flex items-center gap-1.5">
                        <Check size={12} strokeWidth={4} /> {t('subscription.current_plan_badge') || '현재 이용 중'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscribeClick(plan)}
                    disabled={loadingPlan === plan.id || isCurrentPlan}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                      isCurrentPlan 
                        ? 'bg-gray-200 dark:bg-zinc-800 text-gray-500 cursor-not-allowed shadow-inner'
                        : plan.is_popular
                          ? 'bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white shadow-lg active:scale-95'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white active:scale-95'
                    }`}
                  >
                    {loadingPlan === plan.id ? <Loader2 size={20} className="animate-spin mx-auto" /> : (isCurrentPlan ? t('subscription.current_plan') : t('subscription.subscribe_now'))}
                  </button>

                  <div className="mt-10 space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {feature.active ? (
                          <Check size={14} className="text-[#00BFA5] shrink-0" strokeWidth={4} />
                        ) : (
                          <X size={14} className="text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={4} />
                        )}
                        <span className={`text-sm font-medium ${
                          feature.active
                            ? (plan.is_popular ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400')
                            : (plan.is_popular ? 'text-gray-600' : 'text-gray-400 dark:text-gray-600')
                        }`}>{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="max-w-4xl mx-auto mb-20 px-4">
            <h2 className="text-2xl font-black text-center mb-8 dark:text-white tracking-tight">플랜 기능 비교</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
              <table className="w-full text-left border-collapse min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/50">
                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest w-1/2">기능</th>
                    {plans.map(p => (
                      <th key={p.id} className="py-4 px-3 text-center">
                        <span className={`text-xs font-black ${p.is_popular ? 'text-[#00BFA5]' : 'text-gray-900 dark:text-white'}`}>
                          {p.display_name || p.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 모든 플랜의 features label 합집합 (순서 유지)
                    const seen = new Set<string>();
                    const featureList: string[] = [];
                    plans.forEach(p => {
                      p.features.forEach(f => {
                        if (!seen.has(f.label)) {
                          seen.add(f.label);
                          featureList.push(f.label);
                        }
                      });
                    });
                    return featureList.map((feat) => (
                      <tr key={feat} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
                        <td className="py-3 px-6">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feat}</span>
                        </td>
                        {plans.map(p => {
                          const featureItem = p.features.find(f => f.label === feat);
                          return (
                            <td key={p.id} className="py-3 px-3 text-center">
                              {featureItem?.active ? (
                                <Check size={14} className="text-[#00BFA5] mx-auto" strokeWidth={3} />
                              ) : featureItem ? (
                                <X size={12} className="mx-auto text-gray-300 dark:text-zinc-700" strokeWidth={3} />
                              ) : (
                                <span className="text-gray-200 dark:text-zinc-800 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-24 text-center opacity-60">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">{t('subscription.guaranteed_payment')}</p>
            <div className="flex flex-wrap justify-center gap-10">
              <span className="text-xs font-black text-gray-500 uppercase flex items-center gap-2 tracking-tighter">🛡️ {t('subscription.secure_payment')}</span>
              <span className="text-xs font-black text-gray-500 uppercase flex items-center gap-2 tracking-tighter">⚡ {t('subscription.cancel_anytime')}</span>
              <span className="text-xs font-black text-gray-500 uppercase flex items-center gap-2 tracking-tighter">💳 {t('subscription.all_cards_supported')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal (Paddle Integration Ready) */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPaymentModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#111] rounded-[2rem] max-w-md w-full relative z-10 shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full hover:scale-110 active:scale-95 transition-all text-gray-500 hover:text-black dark:hover:text-white z-20"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto p-8 pr-6 flex-1">
                <div className="text-center mb-10 pt-4">
                  <div className="w-20 h-20 bg-[#00BFA5]/10 text-[#00BFA5] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Lock size={36} />
                  </div>
                  <h3 className="text-3xl font-black mb-2 dark:text-white tracking-tight">구독 신청</h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">구독 플랜: <span className="text-[#00BFA5]">{selectedPlan.name}</span></p>
                  
                  <div className="mt-6 p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] inline-block border border-gray-100 dark:border-white/5">
                    <span className="text-4xl font-black dark:text-white tracking-tighter">${calculateFinalPrice(selectedPlan).toFixed(2)}</span>
                    <span className="text-sm font-black text-gray-400 ml-1">/{billingCycle === 'monthly' ? '월' : '년'}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-[1.5rem] border border-gray-100 dark:border-white/5 space-y-2 text-left max-w-sm mx-auto">
                      <div className="text-xs font-black text-[#00BFA5] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Gift size={14} /> <span>{appliedCoupon.title} 적용됨</span>
                        </div>
                        <button 
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCode('');
                            setSelectedWalletCouponId('');
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold transition-colors text-xs"
                        >
                          (해제)
                        </button>
                      </div>
                      {appliedCoupon.target_type && (() => {
                        const info = getCouponConstraintInfo(appliedCoupon.target_type);
                        return (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold space-y-0.5 pl-5 leading-normal">
                            <div>코드: {appliedCoupon.code}</div>
                            <div>사용처: {info.usage}</div>
                            <div>대상: {info.target}</div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Wallet Coupon Selector */}
                  {walletCoupons.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">보유 쿠폰 선택</label>
                      <select
                        id="wallet-coupon-select"
                        value={selectedWalletCouponId}
                        onChange={handleSelectWalletCoupon}
                        className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                      >
                        <option value="">-- 쿠폰을 선택하세요 --</option>
                        {walletCoupons.map((wc) => {
                          const promo = wc.coupons?.promotions;
                          const isPercent = promo?.discount_type === 'percentage' || promo?.discount_type === 'percent';
                          const discountStr = isPercent 
                            ? `${promo?.discount_value}% 할인`
                            : `$${promo?.discount_value} 할인`;
                          const info = getCouponConstraintInfo(promo?.target_type || '');
                          return (
                            <option key={wc.id} value={wc.id}>
                              {promo?.title} (사용처: {info.usage} / 대상: {info.target}) ({discountStr})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Coupon UI */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">{t('subscription.payment_modal.promo_code')}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t('subscription.payment_modal.coupon_placeholder')}
                        className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all uppercase tracking-widest"
                      />
                      <button onClick={handleApplyCoupon} className="px-6 py-4 bg-[#00BFA5] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00BFA5]/20 active:scale-95 transition-all">적용</button>
                    </div>
                    {couponError && <div className="text-red-500 text-[11px] mt-2 font-bold pl-1 leading-relaxed">{couponError}</div>}
                  </div>

                  {/* 결제 안내 */}
                  <div className="p-6 rounded-[2rem] border border-[#00BFA5]/20 bg-[#00BFA5]/5">
                    <div className="flex items-center gap-2 mb-3 text-[#00BFA5] font-black text-xs uppercase tracking-widest">
                      <Info size={16} /> 결제 안내
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 font-bold leading-relaxed">
                      Paddle 결제 연동이 준비 중입니다. 지금 신청하시면 얼리버드 가격으로 확정되며, 준비 완료 시 이메일로 안내드립니다.
                    </p>
                  </div>

                  <button 
                    onClick={handleConfirmPayment}
                    disabled={loadingPlan !== null}
                    className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition-all flex justify-center items-center gap-3"
                  >
                    {loadingPlan !== null ? <Loader2 className="animate-spin" /> : (
                      <>구독 신청하기 <ShoppingCart size={18} /></>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 grayscale opacity-40">
                    <CreditCard size={14} />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Paddle 보안 결제
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 해지 확인 모달 (Simulation) */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCancelModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#111] rounded-[3rem] max-w-sm w-full p-10 relative z-10 shadow-2xl border border-gray-100 dark:border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertCircle size={36} />
              </div>
              <h3 className="text-2xl font-black mb-2 dark:text-white tracking-tight">구독 해지</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                정말 구독을 해지하시겠습니까? 해지 시 즉시 Free 플랜으로 전환되며, 프리미엄 혜택이 중단됩니다.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    setLoadingPlan('free');
                    try {
                      // 1. active 구독 cancelled 처리
                      const { error: cancelError } = await (supabase as any)
                        .from('subscriptions')
                        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                        .eq('user_id', session?.user?.id)
                        .eq('status', 'active');
                      if (cancelError) throw cancelError;

                      // 2. profiles.plan free로 동기화
                      const { error } = await (supabase as any)
                        .from('profiles')
                        .update({ plan: 'free' })
                        .eq('user_id', session?.user?.id);
                      if (error) throw error;
                      toast.success('구독이 해지되었습니다.');
                      await refreshUserPlan();
                      setIsCancelModalOpen(false);
                    } catch (err) {
                      toast.error('해지 실패');
                    } finally {
                      setLoadingPlan(null);
                    }
                  }}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  네, 해지하겠습니다
                </button>
                <button 
                  onClick={() => setIsCancelModalOpen(false)}
                  className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  아니요, 유지하겠습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingButtons />
    </div>
  );
}

