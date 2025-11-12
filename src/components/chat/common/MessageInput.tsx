/**
 * 메시지 입력 (최적화)
 * - useCallback 강화
 * - 불필요한 리렌더링 제거
 */
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { checkMessage, initProfanity } from '@/utils/safety';

interface MessageInputProps {
  chatId: string;
}

const MessageInput = memo(({ chatId }: MessageInputProps) => {
  const { sendMessage } = useDirectChat();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [policyHint, setPolicyHint] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSentRef = useRef<number>(0);
  const hintTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    initProfanity();
  }, []);

  const PROFANITY_NOTICE =
    '⚠️ 비속어·혐오표현·차별적 발언은 자동 감지·마스킹/차단됩니다. 반복 시 제재될 수 있습니다.';

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent | KeyboardEvent) => {
      (e as any).preventDefault?.();

      if (isComposing || sending) return;
      const raw = message;
      const text = raw.trim();
      if (!text) return;

      const now = Date.now();
      if (now - lastSentRef.current < 600) return;
      lastSentRef.current = now;

      const verdict = checkMessage(text);
      if (verdict.action === 'block') {
        setPolicyHint('🚫 부적절한 표현이 포함되어 전송이 차단되었습니다.');
        if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = window.setTimeout(() => setPolicyHint(''), 3000);
        return;
      }

      const payload = verdict.action === 'mask' ? verdict.cleanText : text;
      if (verdict.action === 'mask') {
        setPolicyHint('🔒 일부 단어가 정책에 따라 마스킹되었습니다.');
        if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = window.setTimeout(() => setPolicyHint(''), 2500);
      }

      setSending(true);
      try {
        const success = await sendMessage({ chat_id: chatId, content: payload });
        if (success) {
          setMessage('');
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.log('메시지 전송 오류 : ', error);
      } finally {
        setSending(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    },
    [isComposing, sending, message, chatId, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isComposing) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [isComposing, handleSubmit],
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="message-textarea"
            rows={1}
            placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
            disabled={sending}
            maxLength={2000}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!message.trim() || sending}
            aria-label="메시지 전송"
          >
            {sending ? (
              <div className="loading-spinner" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        <p className="message-policy-notice">{policyHint ? policyHint : PROFANITY_NOTICE}</p>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
