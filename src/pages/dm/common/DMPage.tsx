import { useMemo, useState } from 'react';
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

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex h-full border border-gray-200 rounded-lg overflow-hidden">
        {/* 왼쪽 사이드바 */}
        <aside className="w-[300px] border-r border-gray-200 bg-gray-50 flex flex-col">
          <DMList chats={chatList} selectedChatId={selectedChatId} onSelect={setSelectedChatId} />
        </aside>

        {/* 오른쪽 메인 영역 */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <DMRoom
              chatId={selectedChat.id}
              title={selectedChat.name}
              onAfterSend={handleAfterSend}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-600">
              <div>
                <h2 className="text-2xl font-semibold mb-2">1 : 1 채팅</h2>
                <p>좌측에서 채팅방을 선택하거나</p>
                <p>새 채팅 버튼을 눌러 대화를 시작하세요.</p>
                <div className="mt-6 text-gray-700 space-y-1">
                  <p>💬 실시간 1:1 메시지</p>
                  <p>👥 사용자 검색 및 초대</p>
                  <p>📱 반응형 디자인</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DMPage;
