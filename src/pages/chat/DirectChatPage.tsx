import { useState, useEffect } from 'react';
import DirectChatList from '../../components/chat/direct/DirectChatList';
import DirectChatRoom from '../../components/chat/direct/DirectChatRoom';
import { useNewChatNotification } from '../../contexts/NewChatNotificationContext';
import styles from '../../components/chat/chat.module.css';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { useAuth } from '@/contexts/AuthContext';

function DirectChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
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

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatAsRead();
    if (isMobile) setShowListOnMobile(false);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
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

    setSelectedChatId(null);
    resetCurrentChat();

    if (isMobile) setShowListOnMobile(true);
  }, [user?.id, isMobile]);

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
                    />
                  ) : (
                    !isMobile && (
                      <div className="chat-welcome">
                        <div className="welcome-content">
                          <h2>1:1 채팅</h2>
                          <p>좌측에서 채팅방을 선택하거나</p>
                          <p>새 채팅 버튼을 눌러 대화를 시작하세요.</p>
                          <div className="feature-info">
                            <p>💬 실시간 1:1 메시지</p>
                            <p>👥 사용자 검색 및 초대</p>
                            <p>📱 반응형 디자인</p>
                          </div>
                        </div>
                      </div>
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
