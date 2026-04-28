import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useTranslation } from 'react-i18next';

export function MarketingPopup() {
  const { t, i18n } = useTranslation();
  const { banners: popups, trackClick, trackView } = useMarketingBanners('popup');
  const [currentPopup, setCurrentPopup] = useState<typeof popups[0] | null>(null);

  useEffect(() => {
    if (popups.length === 0) return;

    // 세션당 1회만 표시
    const dismissed = sessionStorage.getItem('ara-dismissed-popups');
    const dismissedSet = dismissed ? new Set(JSON.parse(dismissed)) : new Set();

    const firstUnshown = popups.find((p: any) => !dismissedSet.has(p.id));
    if (firstUnshown) {
      setCurrentPopup(firstUnshown);
      trackView(firstUnshown.id);
    }
  }, [popups.length]);

  const dismiss = () => {
    if (!currentPopup) return;
    const dismissed = sessionStorage.getItem('ara-dismissed-popups');
    const arr = dismissed ? JSON.parse(dismissed) : [];
    arr.push(currentPopup.id);
    sessionStorage.setItem('ara-dismissed-popups', JSON.stringify(arr));
    setCurrentPopup(null);
  };

  const handleClick = () => {
    if (!currentPopup) return;
    trackClick(currentPopup.id);
    if (currentPopup.link_url) {
      window.open(currentPopup.link_url, '_blank', 'noopener');
    }
  };

  if (!currentPopup) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

        {/* Popup Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
          style={{ backgroundColor: currentPopup.bg_color }}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X size={18} style={{ color: currentPopup.text_color }} />
          </button>

          {/* Image */}
          {currentPopup.image_url && (
            <div className="w-full aspect-[16/9] overflow-hidden cursor-pointer" onClick={handleClick}>
              <img
                src={currentPopup.image_url}
                alt={currentPopup.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 text-center" style={{ color: currentPopup.text_color }}>
            <PopupText type="title" popup={currentPopup} />
            {currentPopup.content && (
              <PopupText type="content" popup={currentPopup} />
            )}

            <div className="flex gap-3 justify-center">
              {currentPopup.link_url && (
                <button
                  onClick={handleClick}
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  style={{
                    backgroundColor: currentPopup.text_color,
                    color: currentPopup.bg_color,
                  }}
                >
                  {t('common.view_details')}
                  <ExternalLink size={14} />
                </button>
              )}
              <button
                onClick={dismiss}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/10"
                style={{ color: currentPopup.text_color, border: `1px solid ${currentPopup.text_color}40` }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PopupText({ type, popup }: { type: 'title' | 'content', popup: any }) {
  const { t, i18n } = useTranslation();
  const text = type === 'title' ? popup.title : popup.content;

  // [Surgical Tip] 마케팅 구독 수동 번역 키 우선 적용 (번역 딜레이 방지)
  if (type === 'title' && (popup.id?.includes('subscription') || popup.title?.toLowerCase().includes('subscription'))) {
    const manualTitle = t('marketing.subscription.title');
    // i18next는 키가 없을 때 키 자체를 반환함
    if (manualTitle && manualTitle !== 'marketing.subscription.title') {
      return <h3 className="text-2xl font-black mb-2">{manualTitle}</h3>;
    }
  }

  const { translatedText } = useAutoTranslation(text, `popup_${type}_${popup.id}`, i18n.language);
  
  if (type === 'title') {
    return <h3 className="text-2xl font-black mb-2">{translatedText || text}</h3>;
  }
  return <p className="text-sm opacity-90 mb-6">{translatedText || text}</p>;
}
