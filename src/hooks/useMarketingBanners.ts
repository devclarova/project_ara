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
  const { user } = useAuth();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        let query = supabase
          .from('marketing_banners')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (bannerType) {
          query = query.eq('banner_type', bannerType);
        }

        const { data, error } = await query;
        if (error) throw error;

        const now = new Date();
        const filtered = (data || []).filter(b => {
          // 기간 필터
          if (b.starts_at && new Date(b.starts_at) > now) return false;
          if (b.ends_at && new Date(b.ends_at) < now) return false;

          // 타겟 페이지 필터
          if (targetPage && b.target_page !== 'all' && b.target_page !== targetPage) return false;

          // 타겟 오디언스 필터
          if (b.target_audience === 'guest' && user) return false;
          if (b.target_audience === 'free' && !user) return false;
          if (b.target_audience === 'subscriber') return false; // TODO: 구독 체크 로직

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
  }, [bannerType, targetPage, user?.id]);

  // 클릭 카운트 증가 (비동기, 에러 무시)
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
      // 간단한 UPDATE — view_count + 1
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
