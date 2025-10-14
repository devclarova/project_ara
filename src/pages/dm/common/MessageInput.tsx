/**
 * 1:1 채팅에서 메시지를 입력하고 전송하는 컴포넌트
 * - 자동 높이 조절되는 텍스트 영역
 * - Enter 키로 메시지 전송, Shift + Enter 로 줄 바꿈
 * - 전송 중 로딩 상태 표시
 * - 빈 메시지 전송 방지
 * - 전송 후 입력 필드 자동 초기화
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

type MessageInputProps = {
  onSend?: (text: string) => Promise<void> | void;
  placeholder?: string;
  submitLabel: string;
};

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = '메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)',
  submitLabel = '전송',
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const canSend = text.trim().length > 0 && !sending;

  const doSend = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      try {
        setSending(true);
        setLaunching(true); // 애니메이션 시작
        await onSend?.(message.trim());
        setText('');
        const el = textareaRef.current;
        if (el) el.style.height = 'auto';
      } finally {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setLaunching(false), 450); // 애니메이션 종료
        setSending(false);
      }
    },
    [onSend],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canSend) return;
      await doSend(text);
    },
    [canSend, doSend, text],
  );

  const onKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (canSend) await doSend(text);
      }
    },
    [canSend, doSend, text],
  );

  return (
    <div className="border-t border-[#e0e0e0] bg-white p-4">
      <form className="w-full" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className="message-textarea flex-1 min-h-[40px] max-h-[120px] border border-[#ddd] rounded-full resize-none text-sm leading-[1.4] focus:outline-none focus:border-primary px-3 py-2"
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="메시지 입력"
          />
          <button
            type="submit"
            className={[
              'send-button w-10 h-10 border-0 rounded-full bg-primary text-white cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out',
              // 활성화 상태에서만 호버 효과
              canSend
                ? 'enabled:hover:bg-[#00BFA5] enabled:hover:bg-opacity-50 cursor-pointer'
                : 'disabled:bg-[#cccccc] disabled:cursor-default',
              launching ? 'plane-launch' : '',
            ].join(' ')}
            disabled={!canSend}
            aria-label="메시지 전송"
          >
            {sending ? (
              <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="plane">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
