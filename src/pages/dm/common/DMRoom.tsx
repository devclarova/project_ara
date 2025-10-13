import { useState, useMemo, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message } from '../../../types/dm';
import { fetchMessages, sendMessage } from '../chat';
import DMList from './DMList';
import { mockChats } from '../chat'; // mockChats 임포트

type Props = {
  chatId: number;
  title: string;
  onAfterSend?: (chatId: number, lastText: string, localTime: string) => void;
};

function DMRoom({ chatId, title, onAfterSend }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false); // 내가 방금 보냈는지 플래그
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 모바일에서 드로어 열림 상태

  // 현재 선택된 채팅방의 프로필 이미지 URL
  const currentChat = mockChats.find(chat => chat.id === chatId); // 선택된 chatId로 찾기
  const profileImageUrl = currentChat
    ? currentChat.avatarUrl
    : 'https://api.dicebear.com/7.x/adventurer/svg?seed=sample-avatar'; // 예시 URL

  // 최초/채팅 변경 시 메시지 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchMessages(String(chatId));
      if (mounted) {
        setMsgs(data);
        setLoading(false);
        setJustSent(false); // 방 전환 시 자동 스크롤 금지
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  const sorted = useMemo(
    () => [...msgs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [msgs],
  );

  const handleSend = async (text: string) => {
    const newMsg = await sendMessage(String(chatId), text);
    setMsgs(prev => [...prev, newMsg]);

    // 내가 보낸 직후에만 리스트가 하단으로 스크롤되도록 신호
    setJustSent(true);
    // 다음 틱에 플래그 해제(연속 전송 대비)
    setTimeout(() => setJustSent(false), 0);

    // 목록 갱신을 위해 부모에 통지
    onAfterSend?.(chatId, text, new Date().toLocaleTimeString());
  };

  return (
    <div className="flex flex-col h-full sm:h-[calc(100vh-120px)]">
      {/* 헤더 */}
      <header className="sm:hidden flex items-center gap-2 p-3 border-b bg-white">
        {/* 프로필 이미지 */}
        <img src={profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full" />
        <div className="font-semibold">{title}</div>
        <button
          type="button"
          aria-label="Open DM list"
          onClick={() => setIsSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm ml-auto"
        >
          ☰ 채팅 목록
        </button>
      </header>

      {/* 고정 헤더 (태블릿 이상에서 보임) */}
      <header className="hidden sm:flex p-3 border-b bg-white items-center gap-3">
        {/* 프로필 이미지 */}
        <img src={profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full" />
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 ml-4">{`총 ${sorted.length}개 메시지`}</div>
      </header>

      {/* 메시지 리스트 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">불러오는 중…</div>
      ) : (
        <MessageList
          messages={sorted.map(m => ({
            id: m.id,
            chat_id: String(m.chat_id),
            author_id: m.author_id,
            author_name: m.author_name,
            content: m.content,
            created_at: m.created_at,
            isMe: m.isMe,
          }))}
          autoScrollMode="onSend" // 초기/전환 시에는 내리지 않음
        />
      )}

      {/* 입력창 */}
      <MessageInput onSend={handleSend} placeholder="메시지를 입력하세요…" submitLabel="전송" />

      {/* 모바일에서 드로어 */}
      <div
        className={`sm:hidden fixed inset-0 z-40 ${isSidebarOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isSidebarOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[86%] max-w-[360px] bg-gray-50 border-r shadow-xl
                      transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <div className="font-semibold">채팅 목록</div>
            <button
              aria-label="Close"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-md border border-gray-200 px-2 py-1 text-sm"
            >
              닫기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DMList chats={[]} selectedChatId={null} onSelect={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DMRoom;
