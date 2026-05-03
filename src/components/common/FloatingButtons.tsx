import { useEffect, useState } from 'react';
import { ArrowUp, Bot, MessageSquarePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import FeedbackModal from './FeedbackModal';


interface FloatingButtonsProps {
  className?: string;
}

export default function FloatingButtons({ className }: FloatingButtonsProps) {
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  const [isChatHovered, setIsChatHovered] = useState(false);
  const [isFeedbackHovered, setIsFeedbackHovered] = useState(false);
  const [isScrollHovered, setIsScrollHovered] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { t } = useTranslation();


  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsScrollVisible(true);
      } else {
        setIsScrollVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleChatbotClick = () => {
    console.log('Chatbot clicked');
  };

  const handleFeedbackClick = () => {
    setIsFeedbackModalOpen(true);
  };


  return (
    <div className={cn(
      "fixed bottom-[24px] right-[20px] z-[49] flex flex-col items-center gap-[10px]",
      className
    )}>
      {/* 챗봇 버튼 */}
      <div className="group relative flex items-center">
        <span 
          className="pointer-events-none absolute right-[54px] whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100 bg-white dark:bg-neutral-900"
          style={{ 
            color: 'var(--color-text-primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '0.5px solid var(--color-border-secondary)'
          }}
        >
          {t('common.chatbot', 'ARA 챗봇')}
        </span>
        <button
          onClick={handleChatbotClick}
          onMouseEnter={() => setIsChatHovered(true)}
          onMouseLeave={() => setIsChatHovered(false)}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-[0.5px] border-[var(--color-border-secondary)] transition-all duration-300 bg-white dark:bg-neutral-900"
          style={{
            background: isChatHovered ? '#00BFA5' : undefined,
            color: isChatHovered ? 'white' : '#00BFA5',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          aria-label={t('common.chatbot', 'ARA 챗봇')}
        >
          <Bot size={20} />
        </button>
      </div>

      {/* 피드백 버튼 */}
      <div className="group relative flex items-center">
        <span 
          className="pointer-events-none absolute right-[54px] whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100 bg-white dark:bg-neutral-900"
          style={{ 
            color: 'var(--color-text-primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '0.5px solid var(--color-border-secondary)'
          }}
        >
          {t('common.feedback', '피드백 남기기')}
        </span>
        <button
          onClick={handleFeedbackClick}
          onMouseEnter={() => setIsFeedbackHovered(true)}
          onMouseLeave={() => setIsFeedbackHovered(false)}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-[0.5px] border-[var(--color-border-secondary)] transition-all duration-300 bg-white dark:bg-neutral-900"
          style={{
            background: isFeedbackHovered ? '#00BFA5' : undefined,
            color: isFeedbackHovered ? 'white' : '#00BFA5',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          aria-label={t('common.feedback', '피드백 남기기')}
        >
          <MessageSquarePlus size={20} />
        </button>
      </div>

      {/* 스크롤업 버튼 */}
      <div 
        className={cn(
          "transition-all duration-300",
          isScrollVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={scrollToTop}
          onMouseEnter={() => setIsScrollHovered(true)}
          onMouseLeave={() => setIsScrollHovered(false)}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: isScrollHovered ? '#008F7A' : '#00BFA5',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transform: isScrollHovered ? 'translateY(-4px)' : 'translateY(0)'
          }}
          aria-label={t('common.scroll_to_top', '맨 위로 스크롤')}
        >
          <ArrowUp size={20} />
        </button>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
    </div>

  );
}


