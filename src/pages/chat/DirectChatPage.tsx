/**
 * 1:1 실시간 채팅 인터페이스(Direct Chat Workspace)
 * - 채팅 목록과 메시지 룸을 결합한 통합 업무 공간으로, 반응형 레이아웃 및 딥링크 기반 메시지 하이라이트 지원
 * - 모바일 뷰포트 최적화 및 윈도우 리사이징에 따른 상태 보존 로직 포함
 */
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
    document.title = '채팅 | ARA';
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    if (!location.state?.roomId) {
      setSelectedChatId(null);
      setHighlightMessageId(undefined);
      resetCurrentChat();
      if (isMobile) setShowListOnMobile(true);
    }
  }, [user?.id, isMobile]);

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

  useEffect(() => {
    // 채팅 페이지 전체 화면 스크롤 금지 (이중 스크롤 완벽 차단용)
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    // flex-1: App.tsx의 main(flex flex-col)으로부터 남은 높이를 상속받음
    // h-full: 부모 높이를 100% 채움
    // overflow-hidden: 페이지 자체 스크롤 방지
    // bg-slate-50: 박스 외곽 여백을 보여주기 위한 톤 다운 배경 (dark 대응)
    <div className={`${styles.chatPage} flex-1 w-full h-full overflow-hidden bg-slate-50/50 dark:bg-background`}>
      {/* 
        max-w-7xl mx-auto: 중앙 정렬 박스
        p-4 md:p-8: 상하좌우 여백 확보
        h-full: 부모 높이를 가져오되 패딩 제외 영역만큼 축소
      */}
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-4 md:p-8">
        {/* 전체 컨테이너: 박스 느낌을 주기 위해 테두리와 그림자 적용 */}
        <div className={`${styles.chatContainer} flex-1 flex rounded-2xl border border-border shadow-xl overflow-hidden bg-background`}>
          {/* 사이드바: 리스트 영역 */}
          {(!isMobile || showListOnMobile) && (
            <div className={`chat-sidebar ${isMobile ? 'w-full' : 'w-[300px] lg:w-[320px]'} flex-shrink-0 flex flex-col min-h-0 border-r border-border bg-secondary/30`}>
              <DirectChatList
                onChatSelect={handleChatSelect}
                onCreateChat={() => {}}
                selectedChatId={selectedChatId || undefined}
                onLeave={handleBackToList}
              />
            </div>
          )}

          {/* 메인: 채팅방 또는 환영 검색 화면 */}
          {(!isMobile || !showListOnMobile) && (
            <div className="chat-main flex-1 flex flex-col min-h-0 bg-background relative">
              {selectedChatId ? (
                <DirectChatRoom
                  chatId={selectedChatId}
                  isMobile={isMobile}
                  onBackToList={handleBackToList}
                  highlightMessageId={highlightMessageId}
                />
              ) : (
                !isMobile && <ChatWelcomeSearch onChatSelect={handleChatSelect} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DirectChatPage;
