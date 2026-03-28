import React, { useEffect, useState } from 'react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { X, Bell, Info, AlertTriangle, CheckCircle, Megaphone, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';

export function GlobalNoticeBar() {
    const { settings } = useSiteSettings();
    const [notice, setNotice] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 마케팅 top_bar 배너
    const { banners: topBarBanners, trackClick, trackView } = useMarketingBanners('top_bar');
    const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (settings?.global_notice) {
            setNotice(settings.global_notice);
            setIsVisible(!!settings.global_notice.enabled && !!settings.global_notice.text);
        }
    }, [settings]);

    // 세션 스토리지에서 닫은 배너 복원
    useEffect(() => {
        const dismissed = sessionStorage.getItem('ara-dismissed-banners');
        if (dismissed) {
            try { setDismissedBanners(new Set(JSON.parse(dismissed))); } catch {}
        }
    }, []);

    // 배너 노출 트래킹
    useEffect(() => {
        topBarBanners.forEach(b => {
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

    const visibleBanners = topBarBanners.filter(b => !dismissedBanners.has(b.id));

    // 기존 공지 관련 함수
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
            {/* 기존 시스템 공지 */}
            <AnimatePresence>
                {hasNotice && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`relative z-[110] w-full ${getColorClasses()} py-2 px-4 shadow-md overflow-hidden`}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <span className="shrink-0 animate-pulse">
                                {getIcon()}
                            </span>
                            <p className="text-sm font-bold text-center break-keep">
                                {notice.text}
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

            {/* 마케팅 top_bar 배너 */}
            <AnimatePresence>
                {visibleBanners.map(banner => (
                    <motion.div
                        key={banner.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-[109] w-full py-2 px-4 shadow-sm overflow-hidden cursor-pointer"
                        style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
                        onClick={() => handleBannerClick(banner)}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <Megaphone className="w-4 h-4 shrink-0" />
                            <p className="text-sm font-bold text-center break-keep">
                                {banner.content || banner.title}
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
