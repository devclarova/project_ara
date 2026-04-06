/**
 * 구독 플랜 및 프로모션 쿠폰 관리 센터(Subscription Plan & Promo Coupon Management Center):
 * - 목적(Why): 현재 이용 중인 유료 멤버십 상태를 확인/해지하고, 프로모션 쿠폰을 등록하여 혜택을 적용받을 수 있는 인터페이스를 제공함
 * - 방법(How): 실시간 구독 데이터 페칭, RPC 기반의 쿠폰 유효성 검증(validate_coupon), 멤버십 해지 유예 로직, 그리고 프리미엄 사용자를 위한 VIP 시크릿 혜택 지급 로직을 관리함
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Ticket, Loader2, ArrowRight, CheckCircle2, History, Bird, CreditCard, CalendarClock } from 'lucide-react';
import SeagullIcon from '@/components/common/SeagullIcon';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/common/ConfirmModal';

interface SubscriptionCouponSettingsProps {
  onBackToMenu?: () => void;
}

function SubscriptionHistoryItem({ item }: { item: any }) {
  const planLabel = item.plan === 'premium' ? '프리미엄' : item.plan === 'basic' ? '베이직' : '무료';
  const statusMap: Record<string, { label: string; cls: string }> = {
    active:    { label: '이용중', cls: 'bg-[#00BFA5]/15 text-[#00BFA5]' },
    cancelled: { label: '해지됨', cls: 'bg-red-500/10 text-red-500' },
    expired:   { label: '만료됨', cls: 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400' },
  };
  const st = statusMap[item.status] ?? { label: item.status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-2.5 min-w-0">
        <CreditCard size={13} className="flex-shrink-0 text-gray-400" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{planLabel} 플랜</p>
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {format(new Date(item.created_at), 'yy.MM.dd')}
            {item.ends_at ? ` ~ ${format(new Date(item.ends_at), 'yy.MM.dd')}` : ''}
          </p>
        </div>
      </div>
      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>
        {st.label}
      </span>
    </div>
  );
}

export default function SubscriptionCouponSettings({ onBackToMenu }: SubscriptionCouponSettingsProps) {
  const { t } = useTranslation();
  const { session, refreshUserPlan } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  
  // 상태 관리
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isIssuingVip, setIsIssuingVip] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

      // 2. 전체 구독 이력 (active / cancelled / expired 모두)
      const { data: historyData } = await supabase
        .from('subscriptions')
        .select('id, plan, status, created_at, ends_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setSubscriptionHistory(historyData ?? []);

      // 3. 쿠폰 사용 내역
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
    free:    { label: '무료 플랜',    tag: 'Free',    color: 'text-gray-500',                      bg: 'bg-gray-100 dark:bg-zinc-800' },
    basic:   { label: '베이직 플랜',  tag: 'Basic',   color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-100 dark:bg-blue-500/10' },
    premium: { label: '프리미엄 플랜', tag: 'Premium', color: 'text-[#00BFA5]',                   bg: 'bg-[#00BFA5]/10' }
  };
  const uiPlan = planDetails[currentPlan as keyof typeof planDetails] || planDetails.free;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('common.back', 'Back')}
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('settings.subscription_coupon', '구독 & 쿠폰')}
        </h3>
      </div>

      {/* 구독 상태 카드 */}
      <div className={`p-5 rounded-2xl border relative overflow-hidden ${
        currentPlan === 'premium'
        ? 'border-[#00BFA5]/40 bg-gradient-to-br from-[#e8faf7] to-[#d4f5ef] dark:from-[#0a1a14] dark:to-[#050d0a] shadow-[0_4px_20px_rgba(0,191,165,0.15)] dark:shadow-[0_4px_20px_rgba(0,191,165,0.12)]'
        : 'border-gray-200 dark:border-white/10 bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 shadow-sm'
      }`}>
        {currentPlan === 'premium' ? (
          <>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#00BFA5]/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#00E5FF]/15 blur-[40px] rounded-full pointer-events-none" />
          </>
        ) : (
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-violet-500/10 blur-3xl rounded-full pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col gap-2.5">
          {/* 아이콘 + 플랜명 */}
          <div className="flex items-center gap-2.5">
            <div className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl ${uiPlan.bg}`}>
              <SeagullIcon size={17} className={uiPlan.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 leading-none mb-0.5 whitespace-nowrap">현재 이용 중인 플랜</p>
              <span className={`text-sm font-bold whitespace-nowrap ${
                currentPlan === 'premium' ? 'text-[#007A6E] dark:text-[#00F0FF]' : 'text-gray-900 dark:text-white'
              }`}>
                {uiPlan.label}
              </span>
            </div>
          </div>

          {/* 뱃지 + 결제일 */}
          <div className="flex items-center gap-2 pl-[46px] flex-wrap">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${uiPlan.bg} ${uiPlan.color}`}>
              {uiPlan.tag}
            </span>
            {currentPlan !== 'free' && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                currentPlan === 'premium'
                  ? 'bg-[#00BFA5]/20 text-[#00BFA5]'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}>
                <CheckCircle2 size={10} /> 활성
              </span>
            )}
            {subscription?.ends_at && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                결제일: {format(new Date(subscription.ends_at), 'yy.MM.dd')}
              </span>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-1.5 pt-1">
            <Link
              to="/subscription"
              className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 group/btn ${
                currentPlan === 'premium'
                ? 'bg-[#00BFA5] text-white hover:bg-[#00d4c0]'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              }`}
            >
              <span className="whitespace-nowrap">{currentPlan === 'free' ? '요금제 업그레이드' : '요금제 관리'}</span>
              <ArrowRight size={14} className="flex-shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>

            {currentPlan === 'premium' && (
              <button
                onClick={handleOpenVipBox}
                disabled={isIssuingVip}
                className="w-full px-4 py-2.5 bg-[#0a1a14] border border-[#00BFA5]/40 text-[#00BFA5] rounded-xl font-bold text-sm hover:bg-[#00BFA5]/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isIssuingVip ? <Loader2 size={15} className="animate-spin" /> : (
                  <>
                    <Bird size={15} className="text-[#00BFA5] flex-shrink-0" />
                    <span className="whitespace-nowrap">VIP 상자 열기</span>
                  </>
                )}
              </button>
            )}

            {currentPlan !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                className="w-full px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center whitespace-nowrap"
              >
                구독 해지하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 구독 이력 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <CalendarClock size={13} /> 구독 이력
          </h4>
          {subscriptionHistory.length > 3 && (
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              전체 {subscriptionHistory.length}건 →
            </button>
          )}
        </div>

        {subscriptionHistory.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5">
            구독 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-1.5">
            {subscriptionHistory.slice(0, 3).map((item) => (
              <SubscriptionHistoryItem key={item.id} item={item} />
            ))}
            {subscriptionHistory.length > 3 && (
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-primary transition-colors rounded-xl border border-dashed border-gray-200 dark:border-white/10 hover:border-primary/30"
              >
                + {subscriptionHistory.length - 3}건 더 보기
              </button>
            )}
          </div>
        )}
      </div>

      <hr className="border-gray-100 dark:border-white/5" />

      {/* 쿠폰 등록 */}
      <div className="space-y-3">
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            <Ticket size={13} className="text-primary" /> 쿠폰 등록
          </h4>
          <p className="text-xs text-gray-500">코드를 입력하면 혜택이 즉시 등록됩니다.</p>
        </div>

        <form onSubmit={handleApplyCoupon} className="flex flex-col gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="쿠폰 코드 입력 (예: SPRING2026)"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all font-mono font-bold uppercase tracking-widest text-xs text-gray-900 dark:text-white placeholder:text-xs placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!couponCode.trim() || validating}
            className="w-full px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {validating ? <Loader2 size={16} className="animate-spin" /> : '등록하기'}
          </button>
        </form>
      </div>

      {/* 쿠폰 사용 내역 */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <History size={13} /> 최근 쿠폰 기록
        </h4>

        {usageHistory.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5">
            등록된 쿠폰 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-1.5">
            {usageHistory.map((usage) => {
              const promo = usage.coupons?.promotions;
              if (!promo) return null;
              return (
                <div key={usage.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">{promo.title}</span>
                    <span className="text-xs text-gray-400 font-mono">{usage.coupons.code}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="font-bold text-primary text-xs whitespace-nowrap">
                      {promo.discount_type === 'percent'
                        ? `${promo.discount_value}% 할인`
                        : `₩${promo.discount_value.toLocaleString()} 혜택`
                      }
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(usage.used_at), 'yy.MM.dd')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 구독 이력 전체 모달 */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarClock size={15} className="text-primary" /> 구독 전체 이력
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400"
              >
                <i className="ri-close-line text-base" />
              </button>
            </div>
            <div className="p-4 space-y-1.5 max-h-[60vh] overflow-y-auto overscroll-contain">
              {subscriptionHistory.map((item) => (
                <SubscriptionHistoryItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}

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
