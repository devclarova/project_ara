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
export function useMarketingBanners(
  bannerType?: MarketingBanner['banner_type'],
  targetPage?: string
) {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userPlan, isAdmin } = useAuth();

  useEffect(() => {
    // 유료 회원이나 관리자가 테스트 중이 아닐 때 일반 광고를 숨기는 로직은 
    // 이제 하단의 filter 함수에서 개별 배너별로 처리합니다. 
    // (이유: 유료 회원에게만 보여주는 'subscriber' 전용 배너가 있을 수 있기 때문)

    const fetchBanners = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('marketing_banners')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (bannerType) {
          query = query.eq('banner_type', bannerType);
        }

        const { data, error } = await query;
        if (error) throw error;

        const now = new Date();
        const filtered = (data || []).filter(b => {
          // 1. 기간 필터
          if (b.starts_at && new Date(b.starts_at) > now) return false;
          if (b.ends_at && new Date(b.ends_at) < now) return false;

          // 2. 타겟 페이지 필터
          if (targetPage && b.target_page !== 'all' && b.target_page !== targetPage) return false;

          // 3. 타겟 오디언스 필터 (정밀 구분)
          const isLoggedIn = !!user;
          const isPaid = userPlan === 'premium' || userPlan === 'basic';
          const isGuest = !isLoggedIn;
          const isFreeMember = isLoggedIn && !isPaid;

          // 관리자 테스트 모드: 관리자가 'free' 플랜으로 본인의 상태를 바꿨을 때는 모든 광고 노출 검증 가능
          if (isAdmin && userPlan === 'free') return true;

          // 타겟별 노출 제어
          if (b.target_audience === 'guest' && !isGuest) return false;
          if (b.target_audience === 'free' && !isFreeMember) return false;
          if (b.target_audience === 'subscriber' && !isPaid) return false;

          // 유료 회원은 일반 광고(all)는 보이지 않게 처리 (구독자용 전용 혜택 배너만 노출됨)
          if (b.target_audience === 'all' && isPaid) return false;

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
  }, [bannerType, targetPage, user?.id, userPlan, isAdmin]);

  // 클릭 카운트 증가
  const trackClick = useCallback(async (bannerId: string) => {
    try {
      const banner = banners.find(b => b.id === bannerId);
      if (banner) {
        await supabase
          .from('marketing_banners')
          .update({ click_count: (banner.click_count || 0) + 1 })
          .eq('id', bannerId);
      }
    } catch {}
  }, [banners]);

  // 노출 카운트 증가
  const trackView = useCallback(async (bannerId: string) => {
    try {
      const banner = banners.find(b => b.id === bannerId);
      if (banner) {
        await supabase
          .from('marketing_banners')
          .update({ view_count: (banner.view_count || 0) + 1 })
          .eq('id', bannerId);
      }
    } catch {}
  }, [banners]);

  return { banners, loading, trackClick, trackView };
}
