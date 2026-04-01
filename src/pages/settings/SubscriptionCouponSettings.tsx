import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Ticket, Loader2, ArrowRight, CheckCircle2, History, Bird } from 'lucide-react';
import SeagullIcon from '@/components/common/SeagullIcon';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/common/ConfirmModal';

interface SubscriptionCouponSettingsProps {
  onBackToMenu?: () => void;
}

export default function SubscriptionCouponSettings({ onBackToMenu }: SubscriptionCouponSettingsProps) {
  const { t } = useTranslation();
  const { session, refreshUserPlan } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  
  // 상태 관리
  const [subscription, setSubscription] = useState<any>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isIssuingVip, setIsIssuingVip] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      // 1. 가져오기: 현재 구독 상태
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      setSubscription(subData);

      // 2. 가져오기: 쿠폰 사용 내역
      const { data: usageData } = await supabase
        .from('coupon_usages')
        .select(`
          id,
          used_at,
          discount_applied,
          coupons (
            code,
            promotions (
              title,
              discount_type,
              discount_value
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('used_at', { ascending: false })
        .limit(5);

      if (usageData) {
        setUsageHistory(usageData);
      }
    } catch (error) {
      console.error('Error fetching subscription data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !session?.user?.id) return;

    setValidating(true);
    try {
      // 쿠폰 검증 RPC 호출
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.trim(),
        p_user_id: session.user.id
      });

      if (error) throw error;

      if (data && data.valid) {
        // 쿠폰 등록 (사용 처리)
        // 실제 운영에서는 장바구니/결제 시에 usage가 기록되지만, 
        // 본 단계에서는 '등록(Claim)' 개념으로 usage_history에 기록합니다.
        
        // 해당 쿠폰 정보 가져오기
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id')
          .ilike('code', couponCode.trim())
          .single();
          
        if (couponData) {
          const { error: insertError } = await supabase
            .from('coupon_usages')
            .insert({
              coupon_id: couponData.id,
              user_id: session.user.id,
              discount_applied: data.discount_value
            });
            
          if (insertError) throw insertError;
          
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold">쿠폰 등록 성공!</span>
              <span className="text-sm opacity-90">{data.title} ({data.discount_type === 'percent' ? `${data.discount_value}%` : `₩${data.discount_value.toLocaleString()}`} 할인)</span>
            </div>
          );
          
          setCouponCode('');
          fetchData(); // 사용 내역 갱신
        }
      } else {
        toast.error(data?.error || '유효하지 않은 쿠폰입니다.');
      }
    } catch (err: any) {
      console.error('Coupon validation error:', err);
      toast.error('쿠폰 확인 중 오류가 발생했습니다.');
    } finally {
      setValidating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.user?.id || !subscription) return;
    setIsCancelModalOpen(true);
  };

  const confirmCancelAction = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);
        
      if (error) throw error;

      // 프로필 요금제도 'free'로 동기화
      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('user_id', session!.user.id);
      
      toast.success('구독이 성공적으로 해지되었습니다.');
      // 재조회 및 전역 상태 리프레시
      await refreshUserPlan();
      fetchData();
    } catch (err: any) {
      toast.error('해지 중 오류 발생: ' + err.message);
    } finally {
      setIsCancelModalOpen(false);
      setLoading(false);
    }
  };

  const handleOpenVipBox = async () => {
    if (!session?.user?.id || isIssuingVip) return;
    
    setIsIssuingVip(true);
    try {
      // 1. 이번 달에 이미 받았는지 확인 (간단 가상 로직: usage_history에서 제목으로 체크)
      const currentMonth = new Date().getMonth();
      const alreadyReceived = usageHistory.some(h => {
          const usedMonth = new Date(h.used_at).getMonth();
          return usedMonth === currentMonth && h.coupons?.promotions?.title?.includes('VIP 시크릿');
      });

      if (alreadyReceived) {
          toast.error('이번 달 VIP 혜택을 이미 받으셨습니다. 다음 달을 기다려 주세요!');
          return;
      }

      // 2. 실제 쿠폰 발행 (가상 RPC 또는 직접 인서트 연동)
      // 실제 프로젝트에서는 전용 RPC를 호출하는 것이 안전하지만, 
      // 여기서는 실체화를 위해 '이달의 VIP 전용 99% 할인' 프로모션을 찾아 쿠폰을 발행하는 로직을 모사합니다.
      
      const secretCode = `VIP-SECRET-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // 데모를 위해 고정된 'VIP 전용' 프로모션 ID가 있다고 가정하거나 
      // validate_coupon에서 처리할 수 있는 형태의 신규 쿠폰 데이터 생성
      const { data: promoData } = await supabase
        .from('promotions')
        .select('id, title')
        .eq('title', 'VIP 전용 시크릿 혜택')
        .maybeSingle();

      if (!promoData) {
          toast.error('현재 준비된 VIP 혜택이 없습니다. 관리자에게 문의하세요.');
          return;
      }

      const { error: issueError } = await supabase
        .from('coupons')
        .insert({
            promotion_id: promoData.id,
            code: secretCode,
            status: 'active',
            is_reusable: false
        });

      if (issueError) throw issueError;

      toast.success(
        <div className="flex flex-col gap-1">
            <span className="font-bold text-[#00F0FF]">🎁 VIP 시크릿 혜택 지급 완료!</span>
            <span className="text-sm opacity-90 text-gray-200">쿠폰 코드: {secretCode} (99% 할인)</span>
            <span className="text-[10px] text-gray-400">결제 시 위 코드를 입력하여 혜택을 받으세요.</span>
        </div>,
        { duration: 6000 }
      );

      fetchData(); // 연령/내역 갱신

    } catch (err: any) {
        console.error('VIP Box open fail:', err);
        toast.error('혜택을 불러오는 중 오류가 발생했습니다.');
    } finally {
        setIsIssuingVip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const planDetails = {
    free: { name: '무료 플랜 (Free)', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-zinc-800' },
    basic: { name: '베이직 플랜 (Basic)', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10' },
    premium: { name: '프리미엄 플랜 (Premium)', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' }
  };
  const uiPlan = planDetails[currentPlan as keyof typeof planDetails] || planDetails.free;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 헤더 + 모바일 뒤로가기 화살표 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('common.back', 'Back')}
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t('settings.subscription_coupon', '구독 & 쿠폰')}
        </h3>
      </div>

      {/* 구독 상태 카드 */}
      <div className={`p-6 sm:p-8 rounded-[2rem] border relative overflow-hidden group ${
        currentPlan === 'premium'
        ? 'border-[#00BFA5]/30 bg-gradient-to-br from-[#0a1a14] to-[#050d0a] shadow-[0_8px_30px_rgba(0,191,165,0.15)]'
        : 'border-gray-200 dark:border-white/10 bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 shadow-sm'
      }`}>
        {currentPlan === 'premium' ? (
          <>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#00BFA5]/20 blur-[50px] rounded-full" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#00E5FF]/20 blur-[50px] rounded-full" />
          </>
        ) : (
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-violet-500/10 blur-3xl rounded-full" />
        )}
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
          <div>
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${uiPlan.bg}`}>
               <SeagullIcon size={24} className={uiPlan.color} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">현재 이용 중인 플랜</p>
            <div className="flex items-center gap-3">
              <h2 className={`text-3xl font-black tracking-tight ${currentPlan === 'premium' ? 'text-[#00F0FF]' : 'text-gray-900 dark:text-white'}`}>
                {uiPlan.name}
              </h2>
              {currentPlan !== 'free' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> 활성화됨
                </span>
              )}
            </div>
            {subscription?.ends_at && (
              <p className="text-sm text-gray-500 mt-2">
                다음 결제일: {format(new Date(subscription.ends_at), 'yyyy년 MM월 dd일')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
            <Link
              to="/subscription"
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group/btn shrink-0 ${
                currentPlan === 'premium' 
                ? 'bg-[#00BFA5] text-white shadow-[#00BFA5]/20 hover:bg-[#00E5FF]' 
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-gray-900/20 dark:shadow-white/20'
              }`}
            >
              {currentPlan === 'free' ? '요금제 업그레이드' : '요금제 관리'}
              <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            {currentPlan !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                className="w-full sm:w-auto px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/cancel"
              >
                구독 해지하기
              </button>
            )}

            {currentPlan === 'premium' && (
              <button
                onClick={handleOpenVipBox}
                disabled={isIssuingVip}
                className="w-full sm:w-auto px-6 py-3 bg-[#0a1a14] border border-[#00BFA5]/50 text-[#00BFA5] rounded-2xl font-bold text-sm hover:bg-[#00BFA5]/10 active:scale-95 transition-all flex items-center justify-center gap-2 group/vip disabled:opacity-50"
              >
                {isIssuingVip ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                        <Bird size={20} className="ml-1 text-[#00BFA5] drop-shadow-[0_0_8px_rgba(0,191,165,0.8)]" /> 
                        이달의 VIP 상자 열기
                    </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-100 dark:border-white/5" />

      {/* 쿠폰 등록 입력 폼 */}
      <div className="space-y-4">
        <div>
          <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-1">
            <Ticket size={20} className="text-primary" /> 쿠폰 등록
          </h4>
          <p className="text-sm text-gray-500">프로모션 코드나 쿠폰 번호를 입력하시면 혜택이 즉시 등록됩니다.</p>
        </div>

        <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="쿠폰 코드 입력 (예: SPRING2026)"
            className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono font-bold uppercase tracking-widest text-gray-900 dark:text-white placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!couponCode.trim() || validating}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center min-w-[120px]"
          >
            {validating ? <Loader2 size={18} className="animate-spin" /> : '등록하기'}
          </button>
        </form>
      </div>

      {/* 쿠폰 사용/등록 내역 */}
      <div className="space-y-4 pt-6">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <History size={16} /> 최근 쿠폰 기록
        </h4>
        
        {usageHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-white/5">
            등록된 쿠폰 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {usageHistory.map((usage) => {
              const promo = usage.coupons?.promotions;
              if (!promo) return null;
              
              return (
                <div key={usage.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900 dark:text-white">{promo.title}</span>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit">
                      {usage.coupons.code}
                    </span>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-sm">
                    <span className="font-bold text-primary">
                      {promo.discount_type === 'percent' 
                        ? `${promo.discount_value}% 할인 등록됨`
                        : `₩${promo.discount_value.toLocaleString()} 혜택 등록됨`
                      }
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(usage.used_at), 'yyyy.MM.dd HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={isCancelModalOpen}
        title="구독을 해지하시겠습니까?"
        description="해지 시 프리미엄 혜택 이용이 불가능해지며 즉시 무료 플랜으로 전환됩니다. 정말 진행하시겠습니까?"
        confirmText="해지하기"
        cancelText="유지하기"
        onConfirm={confirmCancelAction}
        onCancel={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
}
