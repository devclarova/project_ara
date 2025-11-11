import { useState, useEffect } from 'react';
import DirectChatList from '../../components/chat/direct/DirectChatList';
import DirectChatRoom from '../../components/chat/direct/DirectChatRoom';
import { useNewChatNotification } from '../../contexts/NewChatNotificationContext';
import styles from '../../components/chat/chat.module.css';
import { useDirectChat } from '@/contexts/DirectChatContext';

function DirectChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { markChatAsRead } = useNewChatNotification();

  // 화면 너비에 따라 모바일 여부 판단
  const [isMobile, setIsMobile] = useState(false);
  // 모바일 리스트 화면, 채팅방 화면
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const { resetCurrentChat } = useDirectChat();

  // 처음 로드 + 리사이즈마다 모바일 여부 판단
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        // 데스크톱 항상 리스트, 채팅
        setShowListOnMobile(true);
      } else {
        // 모바일 선택된 채팅 있으면 채팅방, 없으면 리스트
        if (selectedChatId) {
          setShowListOnMobile(false);
        } else {
          setShowListOnMobile(true);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChatId]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatAsRead();

    // 모바일 채팅방 화면으로 전환
    if (isMobile) {
      setShowListOnMobile(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    resetCurrentChat();

    // 모바일일 때만 리스트 화면으로 전환
    if (isMobile) {
      setShowListOnMobile(true);
    }
  };

  // 채팅 페이지 때 채팅상태 초기화
  useEffect(() => {
    return () => {
      resetCurrentChat();
    };
  }, [resetCurrentChat]);

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatContainer}>
        {/* 왼쪽 사이드바 */}
        {(!isMobile || showListOnMobile) && (
          <div className="chat-sidebar">
            <DirectChatList
              onChatSelect={handleChatSelect}
              onCreateChat={() => {}}
              selectedChatId={selectedChatId || undefined}
            />
          </div>
        )}

        {/* 오른쪽 채팅방 */}
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
  );
}

export default DirectChatPage;
