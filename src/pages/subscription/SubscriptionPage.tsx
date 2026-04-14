/**
 * 프리미엄 구독 및 멤버십 관리 센터(Premium Subscription & Membership Management Center):
 * - 목적(Why): 서비스 수익 모델의 핵심 접점으로서 사용자의 구독 플랜 전환, 결제 시뮬레이션 및 혜택 조회를 담당함
 * - 방법(How): Supabase RPC를 통한 쿠폰 검증 및 트랜잭션 처리를 수행하며, 결제 유도 UX를 위해 Framer Motion과 고급 CSS 블러 효과를 적용함
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, X, ArrowLeft, Loader2, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import SeagullIcon from '@/components/common/SeagullIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { getErrorMessage } from '@/lib/utils';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₩0',
    interval: '평생 무료',
    description: '기본적인 학습 기능과 커뮤니티 활동',
    icon: ShieldCheck,
    color: 'slate',
    features: [
      { name: '기본 단어장 및 학습 영상', active: true },
      { name: '커뮤니티 게시글 읽기/쓰기', active: true },
      { name: '전용 프리미엄 배지', active: false },
      { name: '광고 완벽 제거', active: false },
      { name: '독점 프로모션 혜택', active: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₩4,900',
    interval: '월',
    description: '모든 학습 콘텐츠 해금 및 광고 제거',
    icon: Zap,
    color: 'blue',
    features: [
      { name: '모든 단어장 및 고급 학습 영상', active: true },
      { name: '커뮤니티 무제한 이용', active: true },
      { name: '광고 완벽 제거', active: true },
      { name: '전용 프리미엄 배지', active: false },
      { name: '독점 프로모션 혜택', active: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₩9,900',
    interval: '월',
    description: 'Project ARA의 모든 혜택을 제한 없이',
    icon: SeagullIcon,
    color: 'violet',
    popular: true,
    features: [
      { name: '슈퍼 프리미엄 학습 코스', active: true },
      { name: '커뮤니티 내 강조 프로필', active: true },
      { name: '광고 완벽 제거', active: true },
      { name: '전용 프리미엄 배지', active: true },
      { name: '매월 시크릿 쿠폰팩 제공', active: true },
    ],
  },
];

export default function SubscriptionPage() {
  const { session, userPlan, refreshUserPlan } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  interface Promotion {
    id: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  }
  const [appliedCoupon, setAppliedCoupon] = useState<Promotion | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // 1단계: 구독 버튼 클릭 시 모달 열기
  const handleSubscribeClick = (planId: string) => {
    if (!session?.user?.id) {
      toast.error('로그인이 필요한 서비스입니다.');
      navigate('/signin?redirect=/subscription');
      return;
    }

    if (planId === 'free') {
      if (userPlan === 'free') {
        toast.info('이미 무료 플랜을 이용 중입니다!');
        return;
      }
      
      setIsCancelModalOpen(true);
      return;
    }

    setSelectedPlan(planId);
    setIsPaymentModalOpen(true);
  };

  // 무료 플랜으로 강제 하향 (해지)
  const handleConfirmDowngradeToFree = async () => {
    if (!session?.user?.id) return;
    
    setLoadingPlan('free');
    try {
      // 기존 구독 모두 취소
      const { error } = await (supabase.from('subscriptions') as any)
        .update({ status: 'cancelled' })
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      if (error) throw error;
      
      // 프로필 요금제도 'free'로 동기화
      await (supabase.from('profiles') as any)
        .update({ plan: 'free' })
        .eq('user_id', session.user.id);

      toast.success('구독이 해지되었습니다. 무료 플랜으로 전환됩니다.');
      // 리프레시를 통해 UI 즉시 반영
      await refreshUserPlan();
    } catch (err: unknown) {
      toast.error('해지 처리 중 오류가 발생했습니다: ' + getErrorMessage(err));
    } finally {
      setLoadingPlan(null);
    }
  };

  // 2단계: 모달에서 결제 확인 버튼 클릭 시 실제 구독 처리
  const handleConfirmPayment = async () => {
    if (!session?.user?.id || !selectedPlan) return;

    setLoadingPlan(selectedPlan);
    try {
      // 1. 기존 구독 취소 처리 (간단 구현을 위해 바로 덮어쓰기)
      await (supabase.from('subscriptions') as any)
        .update({ status: 'cancelled' })
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      // 2. 새 구독 데이터 삽입
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error: subError } = await (supabase.from('subscriptions') as any)
        .insert({
          user_id: session.user.id,
          plan: selectedPlan,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: nextMonth.toISOString(),
          payment_method: 'virtual_card',
          coupon_id: appliedCoupon?.id || null
        });

      if (subError) throw subError;

      // 3. Profiles 테이블에 plan 업데이트
      const { error: profileError } = await (supabase.from('profiles') as any)
        .update({ plan: selectedPlan })
        .eq('user_id', session.user.id);

      if (profileError) throw profileError;
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">결제가 완료되었습니다!</span>
          <span className="text-sm opacity-90">{selectedPlan.toUpperCase()} 플랜 혜택이 즉시 적용됩니다.</span>
        </div>
      );
      
      
      await refreshUserPlan();
      
    } catch (err: unknown) {
      console.error('Subscription error:', err);
      toast.error(`결제 처리 실패: ${getErrorMessage(err)}`);
    } finally {
      setIsPaymentModalOpen(false);
      setLoadingPlan(null);
      setSelectedPlan(null);
      setAppliedCoupon(null);
      setCouponCode('');
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
      if (rpcData && rpcData.is_valid) {
        setAppliedCoupon(rpcData.promotion);
        toast.success('쿠폰이 적용되었습니다!');
      } else {
        setCouponError(rpcData?.reason || '유효하지 않은 쿠폰입니다.');
        setAppliedCoupon(null);
      }
    } catch (err: unknown) {
      console.error('Coupon validation fail:', err);
      setCouponError('쿠폰 확인 중 오류가 발생했습니다.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getCalculatedPrice = (planPriceStr: string) => {
      const basePrice = parseInt(planPriceStr.replace(/[^0-9]/g, ''));
      if (!appliedCoupon) return planPriceStr;
      
      let discount = 0;
      if (appliedCoupon.discount_type === 'percentage') {
          discount = basePrice * (appliedCoupon.discount_value / 100);
      } else {
          discount = appliedCoupon.discount_value;
      }
      
      const discounted = Math.max(0, basePrice - discount);
      return `₩${discounted.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors selection:bg-violet-500/30">
      <main className="relative pt-24 pb-32 overflow-hidden px-4 md:px-0">
        
        {/* Background Ambience */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00BFA5]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-12"
          >
            <ArrowLeft size={16} /> 돌아가기
          </button>

          {/* Header Title */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              당신에게 꼭 맞는 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00BFA5]">프리미엄 혜택</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
              광고 없는 쾌적한 학습 환경, 독점 커뮤니티 기능, 그리고 매월 제공되는 시크릿 혜택까지 모두 만나보세요.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
            {PLANS.map((plan) => {
              const PlatformIcon = plan.icon;
              const isPopular = plan.popular;
              
              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-[2.5rem] p-8 md:p-10 transition-all duration-300 ${
                    isPopular 
                      ? 'bg-zinc-900 border-2 border-[#00BFA5] shadow-2xl shadow-[#00BFA5]/20 md:-translate-y-4' 
                      : 'bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 shadow-xl shadow-black/5 hover:-translate-y-2'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#00E5FF] to-[#00BFA5] text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg">
                      가장 인기있는 플랜
                    </div>
                  )}

                  <div className="mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                      isPopular ? 'bg-[#00BFA5]/20 text-[#00E5FF]' : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white'
                    }`}>
                      <PlatformIcon size={28} />
                    </div>
                    <h3 className={`text-2xl font-black mb-2 ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm h-10 ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black tracking-tight ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {plan.price}
                      </span>
                      <span className={`font-bold ${isPopular ? 'text-gray-500' : 'text-gray-400'}`}>
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                    <button
                      onClick={() => handleSubscribeClick(plan.id)}
                      disabled={loadingPlan === plan.id || userPlan === plan.id}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex justify-center items-center transition-all ${
                        userPlan === plan.id 
                          ? 'bg-gray-200 dark:bg-zinc-800 text-gray-500 cursor-not-allowed shadow-inner'
                          : isPopular
                            ? 'bg-gradient-to-r from-[#00E5FF] to-[#00BFA5] hover:opacity-90 text-white shadow-lg shadow-[#00BFA5]/25 active:scale-95'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white active:scale-95'
                      }`}
                    >
                    {loadingPlan === plan.id ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : userPlan === plan.id ? (
                      '현재 사용 중'
                    ) : (
                      '지금 구독하기'
                    )}
                  </button>

                  <div className="mt-10 space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        {feature.active ? (
                           <div className={`shrink-0 mt-0.5 p-1 rounded-full ${isPopular ? 'bg-[#00BFA5]/20 text-[#00E5FF]' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                             <Check size={12} strokeWidth={4} />
                           </div>
                        ) : (
                           <div className="shrink-0 mt-0.5 p-1 text-gray-300 dark:text-gray-700">
                             <X size={12} strokeWidth={4} />
                           </div>
                        )}
                        <span className={`text-sm font-medium ${
                          feature.active
                            ? (isPopular ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300')
                            : (isPopular ? 'text-gray-600' : 'text-gray-400 dark:text-gray-600')
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

          {/* FAQ or Info Section */}
          <div className="mt-24 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">안심하고 결제하세요</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                🔒 안전한 결제 시스템
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                🔄 언제든 해지 가능
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                💳 모든 주요 카드 지원
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* 구독 해지 확인 모달 */}
      <ConfirmModal
        open={isCancelModalOpen}
        title="구독을 해지하시겠습니까?"
        description="해지 시 프리미엄 혜택이 즉시 중단되며, 남은 기간과 상관없이 무료 플랜으로 전환됩니다. 정말 진행하시겠습니까?"
        confirmText="해지하기"
        cancelText="계속 유지"
        onConfirm={() => {
          setIsCancelModalOpen(false);
          handleConfirmDowngradeToFree();
        }}
        onCancel={() => setIsCancelModalOpen(false)}
      />

      {/* 결제 모달 (Professional Fake UI with Coupon Support) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#111] rounded-[2rem] max-w-2xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-gray-100 dark:border-white/10">
            {/* Header / Dismiss */}
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-5 right-5 z-10 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-black/50 hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition-colors backdrop-blur-sm">
              <X size={20} />
            </button>

            {/* Left Side: Order Summary */}
            <div className="w-full md:w-2/5 bg-gray-50 dark:bg-white/5 p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Order Summary</h3>
              
              <div className="flex flex-col h-[calc(100%-2rem)] justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/20">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{PLANS.find((p: any) => p.id === selectedPlan)?.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">Monthly Billing</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{PLANS.find((p: any) => p.id === selectedPlan)?.price}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-500">
                        <span>Discount ({appliedCoupon.name})</span>
                        <span>-{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `₩${appliedCoupon.discount_value.toLocaleString()}`}</span>
                      </div>
                    )}
                    <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-4" />
                    <div className="flex justify-between items-center font-black text-xl">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-violet-600 dark:text-violet-400">
                        {getCalculatedPrice(PLANS.find((p: any) => p.id === selectedPlan)?.price || '₩0')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-semibold leading-relaxed">
                    이 결제창은 테스트용입니다. 안심하고 결제를 진행해도 실제 청구가 발생하지 않습니다.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Form */}
            <div className="w-full md:w-3/5 p-8 pb-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">결제 정보</h3>
              
              <div className="space-y-6">
                {/* Coupon Input */}
                <div>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">프로모션 코드</h4>
                   <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="쿠폰 코드" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-violet-500" 
                        />
                        <button 
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {isValidatingCoupon ? <Loader2 size={14} className="animate-spin" /> : '적용'}
                        </button>
                   </div>
                   {couponError && <p className="text-red-500 text-[10px] mt-2 font-bold">{couponError}</p>}
                   {appliedCoupon && (
                       <p className="text-emerald-500 text-[10px] mt-2 font-bold flex items-center gap-1">
                           <Check size={12} /> {appliedCoupon.name} 쿠폰 적용됨
                       </p>
                   )}
                </div>

                {/* Card Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">카드 정보</h4>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0a0a0a]">
                    <div className="relative border-b border-gray-200 dark:border-white/10">
                      <input type="text" placeholder="카드 번호" className="w-full bg-transparent px-4 py-3.5 text-sm font-medium outline-none" />
                    </div>
                    <div className="grid grid-cols-2">
                      <input type="text" placeholder="MM/YY" className="w-full bg-transparent px-4 py-3.5 text-sm font-medium border-r border-gray-200 dark:border-white/10 outline-none" />
                      <input type="text" placeholder="CVC" className="w-full bg-transparent px-4 py-3.5 text-sm font-medium outline-none" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleConfirmPayment}
                  disabled={loadingPlan !== null}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-[15px] flex justify-center items-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  {loadingPlan !== null ? <Loader2 size={20} className="animate-spin" /> : (
                    <span className="flex items-center gap-2">
                      {getCalculatedPrice(PLANS.find((p: any) => p.id === selectedPlan)?.price || '₩0')} 결제하기
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
