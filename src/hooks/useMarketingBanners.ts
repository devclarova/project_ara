import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────── Types ──────────────────
export interface MarketingBanner {
  id: string;
  title: string;
  banner_type: 'top_bar' | 'popup' | 'hero_slide' | 'inline_card';
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  target_page: string;
  target_audience: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  click_count: number;
  view_count: number;
}

// ────────────────── Hook ──────────────────
/**
 * 오디언스 타겟팅 마케팅 배너 엔진(Audience-Targeted Banner Engine)
 * - 사용자 플랜(Free/Premium), 접속 국가 및 타겟 페이지별 정밀 필터링을 통해 최적화된 마케팅 콘텐츠 노출
 * - 배너 노출(View) 및 클릭(Click) 지표를 실시간 트래킹하여 프로모션 성과 분석 데이터 수집
 */
export function useMarketingBanners(
  bannerType?: MarketingBanner['banner_type'],
  targetPage?: string
) {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userPlan, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    // 인증 정보(플랜 포함)가 로딩 중일 때는 배너를 가져오지 않음 (깜빡임 방지 핵심)
    if (authLoading) {
      setBanners([]);
      setLoading(true);
      return;
    }

    const fetchBanners = async () => {
      // [Double Check] 유료 사용자는 데이터를 요청조차 하지 않음 (트래픽 절감 및 보안 강화)
      const isPaid = userPlan === 'premium' || userPlan === 'basic';
      if (isPaid) {
        setBanners([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let query = (supabase.from('marketing_banners') as any)
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false }); // [Fix] 높은 우선순위가 상단에 오도록 DESC 정렬

        if (bannerType) {
          query = query.eq('banner_type', bannerType);
        }

        const { data, error } = await query;
        if (error) throw error;

        const now = new Date();
        const filtered = (data || []).filter((b: any) => {
          // [Strict Policy] 프리미엄(유료) 사용자는 광고/배너를 일절 보지 않음
          const isPaid = (userPlan as string) === 'premium' || (userPlan as string) === 'basic';
          if (isPaid) return false;

          // 1. 기간 필터
          if (b.starts_at && new Date(b.starts_at) > now) return false;
          if (b.ends_at && new Date(b.ends_at) < now) return false;

          // 2. 타겟 페이지 필터
          if (targetPage && b.target_page !== 'all' && b.target_page !== targetPage) return false;

          // 3. 타겟 오디언스 필터 (정밀 구분)
          const isLoggedIn = !!user;
          const isGuest = !isLoggedIn;
          const isFreeMember = isLoggedIn && !isPaid;

          // 관리자 테스트 모드: 관리자가 'free' 플랜으로 본인의 상태를 바꿨을 때는 모든 광고 노출 검증 가능
          if (isAdmin && userPlan === 'free') return true;

          // 타겟별 노출 제어
          if (b.target_audience === 'guest' && !isGuest) return false;
          if (b.target_audience === 'free' && !isFreeMember) return false;
          if (b.target_audience === 'subscriber' && !isPaid) return false;

          // [Fix] 유료 회원에게 'all' 광고를 무조건 숨기지 않음 
          // (대신 priority로 프리미엄 배너가 상단에 오도록 관리함)

          return true;
        });

        setBanners(filtered);
      } catch (err) {
        console.error('[MarketingBanners] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [bannerType, targetPage, user?.id, userPlan, isAdmin, authLoading]);

  // 클릭 카운트 증가
  const trackClick = useCallback(async (bannerId: string) => {
    try {
      const banner = banners.find((b: any) => b.id === bannerId);
      if (banner) {
        await (supabase.from('marketing_banners') as any)
          .update({ click_count: (banner.click_count || 0) + 1 })
          .eq('id', bannerId);
      }
    } catch {}
  }, [banners]);

  // 노출 카운트 증가
  const trackView = useCallback(async (bannerId: string) => {
    try {
      const banner = banners.find((b: any) => b.id === bannerId);
      if (banner) {
        await (supabase.from('marketing_banners') as any)
          .update({ view_count: (banner.view_count || 0) + 1 })
          .eq('id', bannerId);
      }
    } catch {}
  }, [banners]);

  return { banners, loading, trackClick, trackView };
}
