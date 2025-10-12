// 오른쪽 메인 패널(헤더/MessageList/MessageInput 조합)

import { useEffect, useMemo, useState } from 'react';

import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message } from '../../../types/dm';
import { fetchMessages, sendMessage } from '../chat';

type Props = {
  chatId: number;
  title: string;
  onAfterSend?: (chatId: number, lastText: string, localTime: string) => void;
};

function DMRoom({ chatId, title, onAfterSend }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // 최초/채팅 변경 시 메시지 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchMessages(String(chatId));
      if (mounted) {
        setMsgs(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  const myId = 'me';
  const sorted = useMemo(
    () => [...msgs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [msgs],
  );

  const handleSend = async (text: string) => {
    const newMsg = await sendMessage(String(chatId), text);
    setMsgs(prev => [...prev, newMsg]);

    // 목록 갱신을 위해 부모에 통지
    onAfterSend?.(chatId, text, new Date().toLocaleTimeString());
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <header className="p-3 border-b bg-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200" />
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          {!loading && <div className="text-xs text-gray-500">총 {sorted.length}개 메시지</div>}
        </div>
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
        />
      )}

      {/* 입력창 */}
      <MessageInput onSend={handleSend} placeholder="메시지를 입력하세요…" submitLabel="전송" />
    </div>
  );
}

export default DMRoom;
