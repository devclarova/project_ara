/**
 * 메시지 입력 (최적화)
 * - useCallback 강화
 * - 불필요한 리렌더링 제거
 */
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { checkMessage, initProfanity } from '@/utils/safety';
import { useAuth } from '@/contexts/AuthContext';
import { getBanMessage } from '@/utils/banUtils';
import { toast } from 'sonner';

interface MessageInputProps {
  chatId: string;
}

type Attachment = {
  id: string;
  file: File;
  previewUrl?: string;
};

const MessageInput = memo(({ chatId }: MessageInputProps) => {
  const { t } = useTranslation();
  const { sendMessage } = useDirectChat();
  const { isBanned, bannedUntil } = useAuth();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [policyHint, setPolicyHint] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSentRef = useRef<number>(0);
  const hintTimeoutRef = useRef<number | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const hasAttachments = attachments.length > 0;

  // 더보기 메뉴 상태
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  useEffect(() => {
    initProfanity();
  }, []);

  const PROFANITY_NOTICE = t('chat.notice_profanity');

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // chatId 변경 시 자동 포커스
  useEffect(() => {
    if (!chatId) return;
    // 약간의 지연을 주어 모션 등이 끝난 후 포커스
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [chatId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent | KeyboardEvent) => {
      (e as any).preventDefault?.();

      if (isComposing || sending) return;
      
      // 제재 중인 사용자는 메시지 전송 불가
      if (isBanned && bannedUntil) {
        toast.error(getBanMessage(bannedUntil, '메시지를 전송'));
        return;
      }
      
      const raw = message;
      const text = raw.trim();
      if (!text && attachments.length === 0) return;

      const now = Date.now();
      if (now - lastSentRef.current < 600) return;
      lastSentRef.current = now;

      const verdict = checkMessage(text);
      if (verdict.action === 'block') {
        setPolicyHint(t('chat.notice_blocked'));
        if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = window.setTimeout(() => setPolicyHint(''), 3000);
        return;
      }

      const payload = verdict.action === 'mask' ? verdict.cleanText : (text || (hasAttachments ? '\u200B' : ''));
      if (verdict.action === 'mask') {
        setPolicyHint(t('chat.notice_masked'));
        if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = window.setTimeout(() => setPolicyHint(''), 2500);
      }

      setSending(true);
      try {
        const success = await sendMessage({
          chat_id: chatId,
          content: payload,
          attachments: attachments.map(a => a.file),
        });
        if (success) {
          setMessage('');
          setAttachments([]);
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        // Error handled silently or could show toast
      } finally {
        setSending(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    },
    [isComposing, sending, message, chatId, sendMessage, attachments, hasAttachments],
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

  const handleFilesSelected = useCallback((files: FileList) => {
    const next: Attachment[] = Array.from(files).map(file => {
      let previewUrl: string | undefined;
      // 이미지 또는 동영상이면 미리보기 URL 생성
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl,
      };
    });

    setAttachments(prev => [...prev, ...next]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  // 컴포넌트 언마운트 시 모든 프리뷰 URL 정리
  useEffect(() => {
    return () => {
      setAttachments(prev => {
        prev.forEach(att => {
          if (att.previewUrl) {
            URL.revokeObjectURL(att.previewUrl);
          }
        });
        return [];
      });
    };
  }, []);

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-form relative">
        <div
          ref={menuRef}
          className={`absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-background rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 transition-all duration-300 ease-out ${
            showAddMenu 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {/* 드래그/휠로 슬라이드 가능하도록 overflow-x-auto 설정 */}
          <div className="flex items-center gap-6 overflow-x-auto overflow-y-visible no-scrollbar snap-x px-1 py-2">
            <button
              type="button"
              onClick={() => {
                imageInputRef.current?.click();
                setShowAddMenu(false);
              }}
              className="flex flex-col items-center gap-2 min-w-[60px] snap-center transform transition-all duration-200 hover:scale-110"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all duration-200">
                <i className="ri-image-line text-xl" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {t('chat.attach_image', '이미지')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                videoInputRef.current?.click();
                setShowAddMenu(false);
              }}
              className="flex flex-col items-center gap-2 min-w-[60px] snap-center transform transition-all duration-200 hover:scale-110"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200">
                <i className="ri-movie-line text-xl" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {t('chat.attach_video', '동영상')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowAddMenu(false);
              }}
              className="flex flex-col items-center gap-2 min-w-[60px] snap-center transform transition-all duration-200 hover:scale-110"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200">
                <i className="ri-file-list-line text-xl" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {t('chat.attach_file', '파일')}
              </span>
            </button>
          </div>
        </div>
        {/* 첨부파일 미리보기 */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pb-1">
            {attachments.map(att => (
              <div
                key={att.id}
                className="relative group flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                style={{ width: '64px', height: '64px' }}
              >
                {att.file.type.startsWith('image/') ? (
                  <img
                    src={att.previewUrl}
                    alt={att.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : att.file.type.startsWith('video/') ? (
                  <video
                    src={att.previewUrl}
                    className="w-full h-full object-cover"
                    muted // 자동 재생 방지 및 음소거
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-center w-full h-full">
                    <i className="ri-file-line text-lg text-gray-500" />
                    <span className="text-[10px] w-full truncate px-1 text-gray-500 leading-tight">
                      {att.file.name}
                    </span>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-container relative">
          {/* 더보기 버튼 및 메뉴 */}
          <div className="">
            <button
              ref={buttonRef}
              type="button"
              className="attach-button group"
              onClick={() => setShowAddMenu(prev => !prev)}
              aria-label="더보기"
            >
              <i 
                className={`${showAddMenu ? 'ri-close-line' : 'ri-add-line'} text-xl transition-all duration-300 ease-out ${
                  showAddMenu ? 'rotate-90 scale-110' : 'rotate-0 scale-100'
                }`} 
              />
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={e => {
              if (e.target.files) {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <input
            ref={videoInputRef}
            type="file"
            className="hidden"
            multiple
            accept="video/*"
            onChange={e => {
              if (e.target.files) {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt,.csv,.zip,.rar,.7z"
            onChange={e => {
              if (e.target.files) {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="message-textarea"
            rows={1}
            placeholder={t('chat.input_placeholder')}
            disabled={sending}
            maxLength={2000}
          />
          <button
            type="submit"
            className="send-button"
            disabled={(!message.trim() && !hasAttachments) || sending}
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
