import React, { useEffect, useState } from 'react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { X, Bell, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function GlobalNoticeBar() {
    const { settings } = useSiteSettings();
    const [notice, setNotice] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (settings?.global_notice) {
            setNotice(settings.global_notice);
            setIsVisible(!!settings.global_notice.enabled && !!settings.global_notice.text);
        }
    }, [settings]);

    if (!isVisible || !notice || !notice.text) return null;

    const getColorClasses = () => {
        switch (notice.color) {
            case 'red': return 'bg-red-600 text-white';
            case 'amber': return 'bg-amber-500 text-white';
            case 'emerald': return 'bg-emerald-600 text-white';
            case 'blue': return 'bg-blue-600 text-white';
            default: return 'bg-zinc-900 text-white';
        }
    };

    const getIcon = () => {
        switch (notice.color) {
            case 'red': return <AlertTriangle className="w-4 h-4" />;
            case 'amber': return <Info className="w-4 h-4" />;
            case 'emerald': return <CheckCircle className="w-4 h-4" />;
            case 'blue': 
            default: return <Bell className="w-4 h-4" />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
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
    );
}
