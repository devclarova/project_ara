import { useState, useEffect } from 'react';
import DirectChatList from '../../components/chat/direct/DirectChatList';
import DirectChatRoom from '../../components/chat/direct/DirectChatRoom';
import { useNewChatNotification } from '../../contexts/NewChatNotificationContext';
import styles from '../../components/chat/chat.module.css';

function DirectChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { markChatAsRead } = useNewChatNotification();

  useEffect(() => {
    markChatAsRead();
  }, [markChatAsRead]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatAsRead();
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatContainer}>
        {/* 왼쪽 사이드바 - 목록 */}
        <div className="chat-sidebar">
          <DirectChatList
            onChatSelect={handleChatSelect}
            onCreateChat={() => {}}
            selectedChatId={selectedChatId || undefined}
          />
        </div>

        {/* 오른쪽 메인 - 방/환영 */}
        <div className="chat-main">
          {selectedChatId ? (
            <DirectChatRoom chatId={selectedChatId} />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DirectChatPage;
