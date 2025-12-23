import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import DirectChatList from '../../components/chat/direct/DirectChatList';
import DirectChatRoom from '../../components/chat/direct/DirectChatRoom';
import ChatWelcomeSearch from '../../components/chat/direct/ChatWelcomeSearch';
import { useNewChatNotification } from '../../contexts/NewChatNotificationContext';
import styles from '../../components/chat/chat.module.css';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { useAuth } from '@/contexts/AuthContext';

function DirectChatPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | undefined>(undefined);
  const { markChatAsRead } = useNewChatNotification();

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const { resetCurrentChat } = useDirectChat();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowListOnMobile(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const restore = () => {
      if (!document.hidden) {
        // 화면에 돌아왔을 때 데스크탑이면 리스트 강제 표시
        if (!isMobile) {
          setShowListOnMobile(true);
        }
      }
    };

    document.addEventListener('visibilitychange', restore);
    return () => document.removeEventListener('visibilitychange', restore);
  }, [isMobile]);

  const handleChatSelect = (chatId: string, messageId?: string) => {
    setSelectedChatId(chatId);
    setHighlightMessageId(messageId);
    markChatAsRead();
    if (isMobile) setShowListOnMobile(false);
  };

  // Notification Click Auto-Select Logic
  useEffect(() => {
    const state = location.state as { roomId?: string; messageId?: string } | null;
    if (state?.roomId) {
      // 채팅방만 열고 메시지 하이라이트는 하지 않음 (사용자 요청)
      handleChatSelect(state.roomId); 
    }
  }, [location.state, isMobile]); // isMobile dependency needed for handleChatSelect closure? No, handleChatSelect uses isMobile from scope.

  const handleBackToList = () => {
    setSelectedChatId(null);
    setHighlightMessageId(undefined);
    resetCurrentChat();
    if (isMobile) setShowListOnMobile(true);
  };

  useEffect(
    () => () => {
      resetCurrentChat();
    },
    [resetCurrentChat],
  );

  useEffect(() => {
    if (isMobile) {
      setShowListOnMobile(!selectedChatId);
    }
  }, [selectedChatId, isMobile]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // 만약 location.state로 들어온 경우 초기화 로직이 덮어쓰지 않도록 주의
    // 하지만 location.state가 있으면 위 useEffect가 다시 실행될 것임.
    // user change 시에는 초기화하는 게 맞음.
    if (!location.state?.roomId) {
        setSelectedChatId(null);
        setHighlightMessageId(undefined);
        resetCurrentChat();
        if (isMobile) setShowListOnMobile(true);
    }
  }, [user?.id, isMobile]); // location.state dependency omitted to avoid loop, but checked inside

  return (
    // SNS 레이아웃과 비슷하게: 바깥은 Tailwind, 안쪽은 CSS 모듈
    <div className=" bg-white dark:bg-background overflow-x-hidden">
      <div className="flex justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-5 lg:px-6">
          {/* 안쪽 실제 채팅 박스 */}
          <div className={styles.chatPage}>
            <div className={styles.chatContainer}>
              {(!isMobile || showListOnMobile) && (
                <div className="chat-sidebar">
                  <DirectChatList
                    onChatSelect={handleChatSelect}
                    onCreateChat={() => {}}
                    selectedChatId={selectedChatId || undefined}
                  />
                </div>
              )}
              {(!isMobile || !showListOnMobile) && (
                <div className="chat-main">
                  {selectedChatId ? (
                    <DirectChatRoom
                      chatId={selectedChatId}
                      isMobile={isMobile}
                      onBackToList={handleBackToList}
                      highlightMessageId={highlightMessageId}
                    />
                  ) : (
                    !isMobile && (
                    !isMobile && (
                      <ChatWelcomeSearch onChatSelect={handleChatSelect} />
                    )
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectChatPage;
