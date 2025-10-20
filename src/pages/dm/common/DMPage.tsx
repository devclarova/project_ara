import { useMemo, useState, useEffect } from 'react';
import { mockChats } from '../chat';
import DMList from './DMList';
import DMRoom from './DMRoom';

function DMPage() {
  const [chatList, setChatList] = useState(mockChats);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const selectedChat = useMemo(
    () => chatList.find(c => c.id === selectedChatId) ?? null,
    [chatList, selectedChatId],
  );

  const handleAfterSend = (chatId: number, lastText: string, localTime: string) => {
    setChatList(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, lastMessage: lastText, time: localTime, unread: 0 } : c,
      ),
    );
  };

  // 채팅 전환 시 전체 페이지 스크롤을 맨 위로
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [selectedChatId]);

  return (
    // 바디 스크롤 잠금: 외부로 넘치지 않도록
    <div className="flex flex-col h-[600px] mt-2 mb-2 bg-white text-gray-900 mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-8 overflow-y-auto">
      <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* 왼쪽 사이드바 (내부만 스크롤) */}
        <aside className="hidden sm:flex sm:w-[260px] md:w-[300px] lg:w-[340px] border-r border-gray-200 bg-gray-50 flex-col overflow-y-auto transition-all duration-300">
          <DMList
            chats={chatList}
            selectedChatId={selectedChatId}
            onSelect={setSelectedChatId}
            onUpdateChat={() => {}}
          />
        </aside>

        {/* 오른쪽 메인 영역 (내부만 스크롤) */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedChat ? (
            <DMRoom
              chatId={selectedChat.id}
              title={selectedChat.name}
              onAfterSend={handleAfterSend}
              setSelectedChatId={setSelectedChatId}
            />
          ) : (
            <>
              <div className="sm:hidden flex-1 overflow-y-auto bg-gray-50">
                <DMList
                  chats={chatList}
                  selectedChatId={selectedChatId}
                  onSelect={setSelectedChatId}
                  onUpdateChat={() => {}}
                />
              </div>
              {/* 안내 화면 */}
              <div className="hidden sm:flex flex-1 items-center justify-center text-center p-8 text-gray-600 overflow-auto">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">1 : 1 채팅</h2>
                  <p className="text-sm sm:text-base">좌측에서 채팅방을 선택하거나</p>
                  <p className="text-sm sm:text-base">새 채팅 버튼을 눌러 대화를 시작하세요.</p>
                  <div className="mt-6 text-gray-700 space-y-1 text-sm sm:text-base">
                    <p>💬 실시간 1:1 메시지</p>
                    <p>👥 사용자 검색 및 초대</p>
                    <p>📱 반응형 디자인</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default DMPage;
