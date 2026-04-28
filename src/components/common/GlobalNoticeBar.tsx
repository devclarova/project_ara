/**
 * 전역 공지 및 마케팅 배너 오케스트레이터(Global Notice & Marketing Banner Orchestrator):
 * - 목적(Why): 긴급 점검, 주요 공지 또는 마케팅 캠페인을 사용자에게 최상단 레이어에서 효과적으로 전달함
 * - 방법(How): 사이트 설정(SiteSettings) 및 배너 훅을 연동하여 우선순위에 따른 노출 전략을 실행하며, Framer Motion을 활용한 부드러운 전환과 세션 기반의 배너 닫기 상태를 관리함
 */
import React, { useEffect, useState } from 'react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { X, Bell, Info, AlertTriangle, CheckCircle, Megaphone, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useTranslation } from 'react-i18next';

export function GlobalNoticeBar() {
    const { t, i18n } = useTranslation();
    const { settings } = useSiteSettings();
    const [notice, setNotice] = useState<import('../../contexts/SiteSettingsContext').SiteSettings['global_notice'] | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Asset Orchestration: Resolves 'top_bar' marketing units and initializes engagement telemetry (click-through/view tracking).
    const { banners: topBarBanners, trackClick, trackView } = useMarketingBanners('top_bar');
    const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (settings?.global_notice) {
            setNotice(settings.global_notice);
            setIsVisible(!!settings.global_notice.enabled && !!settings.global_notice.text);
        }
    }, [settings]);

    // Persistence Hydration: Restores the excluded (dismissed) banner list from sessionStorage to prune the current render list.
    useEffect(() => {
        const dismissed = sessionStorage.getItem('ara-dismissed-banners');
        if (dismissed) {
            try { setDismissedBanners(new Set(JSON.parse(dismissed))); } catch {}
        }
    }, []);

    // Analytics Telemetry: Records impression events in the marketing analytics pipeline upon component visibility.
    useEffect(() => {
        topBarBanners.forEach((b: any) => {
            if (!dismissedBanners.has(b.id)) {
                trackView(b.id);
            }
        });
    }, [topBarBanners.length]);

    const dismissBanner = (id: string) => {
        const next = new Set(dismissedBanners);
        next.add(id);
        setDismissedBanners(next);
        sessionStorage.setItem('ara-dismissed-banners', JSON.stringify([...next]));
    };

    const handleBannerClick = (banner: typeof topBarBanners[0]) => {
        trackClick(banner.id);
        if (banner.link_url) {
            window.open(banner.link_url, '_blank', 'noopener');
        }
    };

    const visibleBanners = topBarBanners.filter((b: any) => !dismissedBanners.has(b.id));

    // UI Transformation: Resolves specific color palettes and iconography based on the administrative notice severity.
    const getColorClasses = () => {
        switch (notice?.color) {
            case 'red': return 'bg-red-600 text-white';
            case 'amber': return 'bg-amber-500 text-white';
            case 'emerald': return 'bg-emerald-600 text-white';
            case 'blue': return 'bg-blue-600 text-white';
            default: return 'bg-zinc-900 text-white';
        }
    };

    const getIcon = () => {
        switch (notice?.color) {
            case 'red': return <AlertTriangle className="w-4 h-4" />;
            case 'amber': return <Info className="w-4 h-4" />;
            case 'emerald': return <CheckCircle className="w-4 h-4" />;
            case 'blue': 
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const hasNotice = isVisible && notice?.text;
    const hasBanners = visibleBanners.length > 0;

    if (!hasNotice && !hasBanners) return null;

    return (
        <>
            {/* Notice Component Layer: Renders high-priority administrative notifications with entrance/exit transitions. */}
            <AnimatePresence>
                {hasNotice && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`relative z-[110] w-full ${getColorClasses()} py-1 px-4 shadow-none overflow-hidden`}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <span className="shrink-0 animate-pulse">
                                {getIcon()}
                            </span>
                            <p className="text-sm font-bold text-center break-keep">
                                <NoticeText text={notice.text} />
                            </p>
                            <button 
                                onClick={() => setIsVisible(false)}
                                className="absolute right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Marketing Extension Layer: Renders contextual 'top_bar' promotional units with deep-link support. */}
            <AnimatePresence>
                {visibleBanners.map(banner => (
                    <motion.div
                        key={banner.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-[109] w-full py-1 px-4 shadow-none overflow-hidden cursor-pointer"
                        style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
                        onClick={() => handleBannerClick(banner)}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <p className="text-sm font-bold text-center break-keep">
                                <BannerText banner={banner} />
                            </p>
                            {banner.link_url && (
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); dismissBanner(banner.id); }}
                                className="absolute right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </>
    );
}

function NoticeText({ text }: { text: string }) {
    const { i18n } = useTranslation();
    // Use the text content itself as part of the ID to force a refresh when it changes
    const noticeId = `global_notice_${text.substring(0, 20).replace(/\s/g, '_')}`;
    const { translatedText } = useAutoTranslation(text, noticeId, i18n.language);
    return <>{translatedText || text}</>;
}

function BannerText({ banner }: { banner: any }) {
    const { t, i18n } = useTranslation();
    const content = banner.content || banner.title;

    // [Surgical Tip] 마케팅 구독 수동 번역 키 우선 적용 (번역 딜레이 방지)
    if (banner.id?.includes('subscription') || banner.title?.toLowerCase().includes('subscription') || banner.content?.toLowerCase().includes('subscription')) {
        const manualTitle = t('marketing.subscription.title');
        if (manualTitle && manualTitle !== 'marketing.subscription.title') {
            return <>{manualTitle}</>;
        }
    }

    const { translatedText } = useAutoTranslation(content, `top_banner_${banner.id}`, i18n.language);
    return <>{translatedText || content}</>;
}
