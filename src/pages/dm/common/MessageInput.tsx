/**
 * MessageInput.tsx
 * 1:1 채팅 입력창
 * - 자동 높이 조절(Textarea auto-resize, 최대 높이 제한)
 * - Enter 전송 / Shift+Enter 줄바꿈
 * - 전송 중 로딩 상태 + 버튼 비활성화
 * - 빈 문자열 전송 방지 + 전송 후 입력 초기화
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

type MessageInputProps = {
  onSend?: (text: string) => Promise<void> | void;
  placeholder?: string;
  submitLabel?: string;
};

const MAX_TEXTAREA_PX = 120; // textarea 최대 높이

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = '메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)',
  submitLabel = '전송',
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // 자동 높이 조절
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, []);

  // 텍스트가 바뀌면 높이 재계산
  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const canSend = text.trim().length > 0 && !sending;

  // 실제 전송 로직
  const doSend = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      try {
        setSending(true);
        setLaunching(true); // 간단한 애니메이션 트리거
        await onSend?.(trimmed);
        setText(''); // 입력 초기화

        // 높이 리셋
        const el = textareaRef.current;
        if (el) el.style.height = 'auto';
      } finally {
        // 애니메이션 종료 타이밍
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setLaunching(false), 450);
        setSending(false);
      }
    },
    [onSend],
  );

  // 폼 전송(버튼 클릭 또는 Enter)
  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canSend) return;
      await doSend(text);
    },
    [canSend, doSend, text],
  );

  // 키보드 핸들링: IME 조합 중에는 Enter 무시, 그 외 Enter 전송 / Shift+Enter 줄바꿈
  const onKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (isComposing) return;
        e.preventDefault();
        if (canSend) await doSend(text);
      }
    },
    [canSend, doSend, text, isComposing],
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
            onCompositionStart={() => setIsComposing(true)} // IME 시작
            onCompositionEnd={() => setIsComposing(false)} // IME 종료
            placeholder={placeholder}
            aria-label="메시지 입력"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <button
            type="submit"
            // 접근성: 비활성화 상태를 명시
            aria-label={submitLabel}
            aria-disabled={!canSend}
            disabled={!canSend}
            className={[
              'send-button w-10 h-10 border-0 rounded-full bg-primary text-white cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out',
              // 활성화 상태에서만 호버 효과
              canSend
                ? 'enabled:hover:bg-[#00BFA5] enabled:hover:bg-opacity-50 cursor-pointer'
                : 'disabled:bg-[#cccccc] disabled:cursor-default',
              launching ? 'plane-launch' : '',
            ].join(' ')}
            title={submitLabel}
          >
            {sending ? (
              <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              // 종이비행기 아이콘
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
