import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const GlobalNoticeBar = () => {
    const [notice, setNotice] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchNotice = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'global_notice')
                .maybeSingle();
            
            if (data?.value?.enabled) {
                setNotice(data.value);
                setIsVisible(true);
            }
        };

        fetchNotice();

        // Listen for changes
        const channel = supabase
            .channel('site_settings_notice')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'site_settings',
                filter: 'key=eq.global_notice'
            }, (payload) => {
                const newValue = payload.new.value;
                if (newValue.enabled) {
                    setNotice(newValue);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!isVisible || !notice) return null;

    const getColorClasses = () => {
        switch (notice.color) {
            case 'red': return 'bg-red-600 text-white';
            case 'amber': return 'bg-amber-500 text-white';
            case 'emerald': return 'bg-emerald-600 text-white';
            case 'blue': 
            default: return 'bg-primary text-white';
        }
    };

    const getIcon = () => {
        switch (notice.color) {
            case 'red': return <AlertTriangle size={16} />;
            case 'amber': return <Info size={16} />;
            case 'emerald': return <CheckCircle size={16} />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`relative z-[100] w-full ${getColorClasses()} py-2 px-4 shadow-md overflow-hidden`}
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
};
