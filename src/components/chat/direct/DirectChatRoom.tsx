import { useEffect, useMemo, useRef, useState, useCallback, memo, useLayoutEffect } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { getMediaInChat } from '@/services/chat/directChatService';
import type { DirectMessage } from '../../../types/ChatType';
import MessageInput from '../common/MessageInput';
import TranslateButton from '@/components/common/TranslateButton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';
import { toast } from 'sonner';
import { ArrowDown, X } from 'lucide-react';
import styles from '../chat.module.css';
import HighlightText from '../../common/HighlightText';
import MediaGalleryModal from './MediaGalleryModal';
import MediaViewer, { type MediaItem } from './MediaViewer';
import Modal from '@/components/common/Modal';
import ReportModal from '@/components/common/ReportModal';
import { formatMessageTime, formatSmartDate } from '@/utils/dateUtils';
import { BanBadge } from '@/components/common/BanBadge';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';
// HMR Trigger
interface MessageGroup {
  [date: string]: DirectMessage[];
}
interface DirectChatRoomProps {
  chatId: string;
  isMobile: boolean | null;
  onBackToList?: () => void;
  highlightMessageId?: string;
}
// 전역 이미지 캐시
const imageCache = new Map<string, string>();
const loadingImages = new Map<string, Promise<string>>();
const loadImage = (url: string): Promise<string> => {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  if (loadingImages.has(url)) {
    return loadingImages.get(url)!;
  }
  const promise = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, url);
      loadingImages.delete(url);
      resolve(url);
    };
    img.onerror = () => {
      loadingImages.delete(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
  loadingImages.set(url, promise);
  return promise;
};
// LazyImage 최적화
const LazyImage = memo(
  ({ src, alt, className, style, onLoad }: { src: string; alt: string; className?: string; style?: React.CSSProperties; onLoad?: () => void }) => {
    const [loaded, setLoaded] = useState(() => imageCache.has(src));
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (!src || loaded) {
        if (loaded) onLoad?.();
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadImage(src)
                .then(() => {
                  setLoaded(true);
                })
                .catch(() => setLoaded(false));
              observer.disconnect();
            }
          });
        },
        { rootMargin: '100px' }, // 더 일찍 로드
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src, loaded]);

    useEffect(() => {
      if (loaded && onLoad) {
        onLoad();
      }
    }, [loaded, onLoad]);

    return loaded ? (
      <img src={src} alt={alt} className={className} style={style} />
    ) : (
      <div ref={imgRef} className={className} style={{ ...style, backgroundColor: '#e5e7eb' }} />
    );
  },
);
LazyImage.displayName = 'LazyImage';

const CachedAvatar = memo(
  ({ url, nickname, size = 32 }: { url?: string | null; nickname: string; size?: number }) => {
    if (!url) {
      return (
        <div
          className="avatar-placeholder"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {nickname.charAt(0)}
        </div>
      );
    }
    return (
      <LazyImage
        src={url}
        alt={nickname}
        className="avatar-image object-cover rounded-full"
        style={{ width: size, height: size }}
      />
    );
  },
);
CachedAvatar.displayName = 'CachedAvatar';
import { useNavigate, useLocation } from 'react-router-dom';

// 메시지 아이템 최적화
const MessageItem = memo(
  ({
    message,
    currentUserId,
    isHighlighted,
    isFlashing,
    isCurrent,
    searchQuery,
    onImageLoad,
    onViewMedia, // 미디어(이미지/동영상) 크게보기 핸들러
    onReport,
    isSelectionMode,
    isSelected,
    onToggleSelection,
  }: {
    message: DirectMessage;
    currentUserId: string;
    isHighlighted: boolean;
    isFlashing?: boolean;
    isCurrent: boolean;
    searchQuery?: string;
    onImageLoad?: () => void;
    onViewMedia?: (url: string) => void;
    onReport?: (messageId: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (messageId: string) => void;
  }) => {
    const isMyMessage = message.sender_id === currentUserId;
    const isSystemMessage =
      typeof message.content === 'string' && message.content.includes('님이 채팅방을 나갔습니다');
    const [translated, setTranslated] = useState<string>('');
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const handleAvatarClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // username이 있으면 username으로, 없으면 id로 (프로필 페이지 지원 여부에 따라)
      const target = message.sender?.username || message.sender?.id;
      if (target) {
        navigate(`/profile/${target}`);
      }
    }, [message.sender, navigate]);

    const formatTime = useCallback(
      (dateString: string) => {
        return formatMessageTime(dateString);
      },
      [i18n.language],
    );
    const highlightClass = isHighlighted
      ? isCurrent
        ? 'message-highlight-current'
        : 'message-highlight'
      : '';
    const flashClass = isFlashing ? styles['message-highlight-flash'] : '';

    // Selection Mode Click Handler
    const handleSelectionClick = useCallback((e: React.MouseEvent) => {
        if (isSelectionMode && onToggleSelection) {
            e.stopPropagation();
            onToggleSelection(message.id);
        }
    }, [isSelectionMode, onToggleSelection, message.id]);
    if (isSystemMessage) {
      return (
        <div key={message.id} className="system-message" id={`msg-${message.id}`}>
          <div className="system-message-content">{message.content}</div>
        </div>
      );
    }

    // Check Content Existence (Moved from above, logic refined)
    // Use includes for robustness against whitespace
    const isDeleted = !!message.deleted_at || (typeof message.content === 'string' && message.content.includes('관리자에 의해 삭제된 메시지입니다'));
    
    // Force hide attachments if deleted
    const hasImages = !isDeleted && message.attachments && message.attachments.length > 0;
    
    // Text should be shown if:
    // 1. It is a normal message with text
    // 2. It is a deleted message (content replaced by placeholder)
    const hasText = isDeleted || (typeof message.content === 'string' && message.content.replace(/\u200B/g, '').trim().length > 0);

    if (!hasText && !hasImages) {
      return null;
    }

    const canSelect = isSelectionMode && !isMyMessage;

    return (
      <div
        key={message.id}
        id={`msg-${message.id}`}
        className={`message-item ${isMyMessage ? 'my-message' : 'other-message'} ${highlightClass} ${flashClass} 
          ${canSelect ? 'cursor-pointer select-none' : ''} 
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/50 rounded-xl my-1 py-1' : ''}`}
        onClick={canSelect ? handleSelectionClick : undefined}
      >
        {canSelect && (
             <div className="flex items-center justify-center mx-2 z-10 shrink-0">
                 {isSelected ? (
                     <i className="ri-checkbox-circle-fill text-primary text-2xl" />
                 ) : (
                     <i className="ri-checkbox-blank-circle-line text-gray-300 dark:text-gray-600 text-2xl" />
                 )}
             </div>
        )}
        {isMyMessage ? (
          <>
            <div className="message-bubble">
              {/* 첨부파일 (이미지/동영상/파일) */}
              {hasImages ? (
                <div className="mb-2 flex flex-col gap-2">
                  {message.attachments!.map(att => {
                    if (att.type === 'video') {
                      return (
                        <div key={`${message.id}-${att.url}`} className="relative group max-w-[240px]">
                           <video
                             src={att.url}
                             className="rounded-lg w-full h-full object-cover"
                             controls={false} // 커스텀 컨트롤 사용 위해 네이티브 숨김 or 그냥 썸네일처럼
                           />
                           {/* 재생/확대 버튼 오버레이 */}
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg cursor-pointer"
                                onClick={() => onViewMedia?.(att.url)}>
                             <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition">
                                <i className="ri-play-fill text-white text-xl ml-0.5" />
                             </div>
                           </div>
                        </div>
                      );
                    } else if (att.type === 'file') {
                      const fileName = att.name || 'file';
                      
                      return (
                        <button
                          key={`${message.id}-${att.url}`}
                          onClick={() => {
                             // Force Download
                             const filename = att.name || 'download';
                             fetch(att.url)
                               .then(resp => resp.blob())
                               .then(blob => {
                                 const url = window.URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = filename;
                                 a.click();
                                 window.URL.revokeObjectURL(url);
                               });
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-sm max-w-[280px] hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all duration-200 w-full text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                             <i className="ri-file-text-line text-2xl" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                             <span className="truncate font-semibold text-gray-800 dark:text-gray-200 text-sm">
                               {fileName}
                             </span>
                          </div>
                        </button>
                      );
                    }
                    // Default to image (Make clickable)
                    return (
                      <div key={`${message.id}-${att.url}`} onClick={() => onViewMedia?.(att.url)} className="cursor-pointer">
                        <LazyImage
                          src={att.url}
                          alt="image"
                          className="rounded-lg max-w-[240px] hover:opacity-90 transition-opacity"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* 텍스트 */}
              {hasText && (
                <div className={`message-text whitespace-pre-wrap break-words break-all ${isDeleted ? 'italic opacity-60 text-gray-500' : ''}`}>
                  <HighlightText
                    text={isDeleted ? '관리자에 의해 삭제된 메시지입니다.' : message.content || ''}
                    query={searchQuery}
                    className="bg-white/90 text-primary font-medium"
                  />
                </div>
              )}

              <div className="message-time">{formatTime(message.created_at)}</div>
            </div>

            <div 
              className="message-avatar cursor-pointer" 
              onClick={handleAvatarClick}
            >
              <CachedAvatar
                url={message.sender?.avatar_url}
                nickname={message.sender?.nickname || '나'}
              />
            </div>
          </>
        ) : (
          <>
            <div 
              className="message-avatar cursor-pointer" 
              onClick={handleAvatarClick}
            >
              <CachedAvatar
                url={message.sender?.avatar_url}
                nickname={message.sender?.nickname || '?'}
              />
            </div>
            <div className="message-bubble relative px-3 py-2 group">
              {/* Report Button (Hover only) - Other user messages only */}
              {!isMyMessage && onReport && !isDeleted && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onReport(message.id);
                    }}
                    className="absolute -top-6 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 bg-white/50 dark:bg-black/50 rounded-full"
                    title="신고하기"
                 >
                    <i className="ri-alarm-warning-line" />
                 </button>
              )}
              {/* 첨부파일 (이미지/동영상/파일) */}
              {hasImages ? (
                <div className="mb-2 flex flex-col gap-2">
                  {message.attachments!.map(att => { // ! asserts existence because hasImages is true
                    if (att.type === 'video') {
                      return (
                         <div key={`${message.id}-${att.url}`} className="relative group max-w-[240px]">
                           <video
                             src={att.url}
                             className="rounded-lg w-full h-full object-cover"
                             controls={false}
                           />
                           {/* 재생/확대 버튼 오버레이 */}
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg cursor-pointer"
                                onClick={() => onViewMedia?.(att.url)}>
                             <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition">
                                <i className="ri-play-fill text-white text-xl ml-0.5" />
                             </div>
                           </div>
                        </div>
                      );
                    } else if (att.type === 'file') {
                      return (
                         <button
                          key={`${message.id}-${att.url}`}
                          onClick={() => {
                             // Force Download
                             const filename = att.name || 'download';
                             fetch(att.url)
                               .then(resp => resp.blob())
                               .then(blob => {
                                 const url = window.URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = filename;
                                 a.click();
                                 window.URL.revokeObjectURL(url);
                               });
                          }}
                          className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm max-w-[240px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left border border-gray-200 dark:border-gray-700"
                        >
                           <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-300">
                             <i className="ri-file-line" />
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="truncate font-medium text-gray-700 dark:text-gray-200 w-full text-left">
                               {att.name || 'File'}
                             </span>
                             <span className="text-xs text-blue-500 text-left">Download</span>
                          </div>
                        </button>
                      );
                    }
                    return (
                      <div key={`${message.id}-${att.url}`} onClick={() => onViewMedia?.(att.url)} className="cursor-pointer">
                        <LazyImage
                          src={att.url}
                          alt="image"
                          className="rounded-lg max-w-[240px] hover:opacity-90 transition-opacity"
                          onLoad={onImageLoad}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* 텍스트 + 번역 */}
              {hasText && (
                <div className="flex items-center gap-2">
                  <div className={`message-text whitespace-pre-line break-words ${isDeleted ? 'italic opacity-60 text-gray-500' : ''}`}>
                    <HighlightText text={isDeleted ? '관리자에 의해 삭제된 메시지입니다.' : message.content || ''} query={searchQuery} />
                  </div>
                  {typeof message.content === 'string' && !isDeleted && (
                    <TranslateButton
                      text={message.content}
                      contentId={`dm_${message.id}`}
                      setTranslated={setTranslated}
                      size="sm"
                    />
                  )}
                </div>
              )}

              {/* 번역 결과 */}
              {translated && (
                <div className="mt-2 p-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-400 whitespace-pre-line break-words">
                  {translated}
                </div>
              )}



              <div className="message-time mt-1">{formatTime(message.created_at)}</div>
            </div>
          </>
        )}
      </div>
    );
  }
);
MessageItem.displayName = 'MessageItem';
const DirectChatRoom = ({
  chatId,
  isMobile,
  onBackToList,
  highlightMessageId,
}: DirectChatRoomProps) => {
  const {
    messages,
    error,
    loadMessages,
    currentChat,
    exitDirectChat,
    loadMoreMessages,
    hasMoreMessages,
    loadNewerMessages,
    hasNewerMessages,
    searchMessagesInChat,
  } = useDirectChat();
  if (isMobile === null) return null;
  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Report Mode State
  const location = useLocation();
  const [isReportMode, setIsReportMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [reportPreview, setReportPreview] = useState<string>('');

  useEffect(() => {
      if (location.state?.report) {
          setIsReportMode(true);
          // Clean up state references if possible to avoid sticking
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const toggleSelection = useCallback((msgId: string) => {
      setSelectedMessages(prev => {
          const next = new Set(prev);
          if (next.has(msgId)) next.delete(msgId);
          else next.add(msgId);
          return next;
      });
  }, []);

  const initiateReport = () => {
      if (selectedMessages.size === 0) {
          toast.error(t('report.select_messages', '신고할 메시지를 선택해주세요.'));
          return;
      }
      
      // Collect message contents
      const selectedContent: string[] = [];
      
      // Iterate over messageGroups to find messages
      // This is inefficient but functional for reasonable chat sizes.
      // Better: Create a map or lookup if needed, but array iteration is fine for client side list.
      // We only have messages in `messageGroups`.
      // Iterate over messages
      (messages || []).forEach(msg => {
          if (selectedMessages.has(msg.id)) {
              const content = typeof msg.content === 'string' ? msg.content : '(Media/File)';
              const date = formatMessageTime(msg.created_at);
              const sender = msg.sender?.nickname || 'Unknown';
              selectedContent.push(`[${date}] ${sender}: ${content}`);
          }
      });

      const formattedPreview = selectedContent.join('\n');
      setReportPreview(formattedPreview);
      
      // Open Modal - target is Room (Chat ID), type 'chat'
      // Additional info will be passed to modal
      setReportTarget({ type: 'chat', id: chatId });
      setIsReportModalOpen(true);
  };

  // 10-zzeon: 신고 취소 메뉴 State
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [viewingMediaUrl, setViewingMediaUrl] = useState<string | null>(null); // 통합 미디어 뷰어 상태

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'chat', id: string } | null>(null);

  const handleReport = useCallback((targetId: string, type: 'chat' | 'user') => {
    setReportTarget({ id: targetId, type });
    setIsReportModalOpen(true);
  }, []);

  // 현재 로드된 메시지에서 미디어 추출 (Memoized)
  const allCurrentMedia = useMemo(() => {
    const media: MediaItem[] = [];
    
    // Sort messages by created_at ASC (Chronological) for intuitive gallery navigation
    const sortedMsgs = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    sortedMsgs.forEach(msg => {
       if (msg.attachments?.length) {
         msg.attachments.forEach(att => {
            const type = (att.type || '').toLowerCase();
            if (type === 'video') {
              media.push({
                url: att.url,
                messageId: msg.id,
                date: msg.created_at,
                senderId: msg.sender_id,
                senderName: msg.sender?.nickname || 'Unknown',
                senderAvatarUrl: msg.sender?.avatar_url,
                type: 'video',
              });
            } else if (type !== 'file') {
              // Treat everything else (that renders as image) as 'image'
              media.push({
                url: att.url,
                messageId: msg.id,
                date: msg.created_at,
                senderId: msg.sender_id,
                senderName: msg.sender?.nickname || 'Unknown',
                senderAvatarUrl: msg.sender?.avatar_url,
                type: 'image',
              });
            }
         });
       }
    });
    return media;
  }, [messages]);

  // Calculate content snapshot for reporting
  const contentSnapshot = useMemo(() => {
      if (!isReportMode || selectedMessages.size === 0) return null;
      return messages.filter(m => selectedMessages.has(m.id));
  }, [messages, selectedMessages, isReportMode]);

  // 전체 미디어 목록 (무한 스크롤 너머의 데이터 포함)
  const [fullMediaList, setFullMediaList] = useState<MediaItem[]>([]);
  const [isFetchingFullMedia, setIsFetchingFullMedia] = useState(false);

  // 미디어 뷰어가 열리면 백그라운드에서 전체 미디어 로드
  useEffect(() => {
    if (viewingMediaUrl && !isFetchingFullMedia && fullMediaList.length <= allCurrentMedia.length) {
      if (allCurrentMedia.length === 0) return; // Wait for initial load

      setIsFetchingFullMedia(true);
      getMediaInChat(chatId)
        .then(response => {
          if (response.success && response.data) {
            const fullList: MediaItem[] = [];
            // Sort by created_at ASC (Oldest to Newest)
            const sorted = [...response.data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            sorted.forEach(msg => {
              if (msg.attachments?.length) {
                msg.attachments.forEach((att: any) => {
                   const type = (att.type || '').toLowerCase();
                   if (type === 'video') {
                     fullList.push({
                       url: att.url,
                       messageId: msg.id,
                       date: msg.created_at,
                       senderId: msg.sender_id,
                       senderName: msg.sender?.nickname || 'Unknown',
                       senderAvatarUrl: msg.sender?.avatar_url,
                       type: 'video',
                     });
                   } else if (type !== 'file') {
                     fullList.push({
                       url: att.url,
                       messageId: msg.id,
                       date: msg.created_at,
                       senderId: msg.sender_id,
                       senderName: msg.sender?.nickname || 'Unknown',
                       senderAvatarUrl: msg.sender?.avatar_url,
                       type: 'image',
                     });
                   }
                });
              }
            });
            
            // Remove duplicates just in case
            const uniqueList = Array.from(new Map(fullList.map(item => [item.url, item])).values());
            setFullMediaList(uniqueList);
          }
        })
        .finally(() => setIsFetchingFullMedia(false));
    }
  }, [viewingMediaUrl, chatId]); // Removed allCurrentMedia dependency to avoid infinite fetch loop, logic handled inside

  // 뷰어에 전달할 리스트: 전체 리스트가 로드되었으면 그것을, 아니면 현재 리스트 사용
  const viewerMediaList = fullMediaList.length > allCurrentMedia.length ? fullMediaList : allCurrentMedia;

  // New Message Floating Button State
  const [newMessageToast, setNewMessageToast] = useState<{
    id: string;
    sender: string;
    content: string;
    avatar?: string | null;
  } | null>(null);
  const isUserNearBottomRef = useRef(true); // 스크롤이 바닥 근처인지 추적

  // Media Gallery State
  // Removed duplicate showMediaGallery

  // Main: 무한 스크롤 및 UI 상태
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const prevLastMessageId = useRef<string | null>(null); // 마지막 메시지 ID 추적용
  const currentChatIdRef = useRef<string | null>(null); // 현재 채팅방 ID 추적용
  const [isLoadingNewer, setIsLoadingNewer] = useState(false); // 정방향 로딩 상태 UI용
  const isLoadingNewerRef = useRef(false); // 정방향 로딩 상태 로직용 (Ref로 즉시성 보장)
  // 무한 스크롤용 Refs & State
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const prevScrollHeightRef = useRef<number>(0);
  const isRestoringHistoryRef = useRef(false); // Ref for sync control of history restore
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((force = false) => {
    // History Restore 중에는 절대 스크롤 간섭 금지 (비디오/이미지 로드 등 방어)
    if (isRestoringHistoryRef.current) return;

    const doScroll = () => {
      const el = containerRef.current;
      if (el) {
        if (force) {
          el.scrollTop = el.scrollHeight;
          isUserNearBottomRef.current = true; // Sync update to handle rapid image loads
        } else {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      } else {
        // Fallback for initial render safety
        messageEndRef.current?.scrollIntoView({
          behavior: force ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }
    };

    if (force) {
      doScroll();
    } else {
      requestAnimationFrame(doScroll);
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    // History Restore 중이면 무시
    if (isRestoringHistoryRef.current) return;
    
    if (isUserNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [scrollToBottom]);
  // 메시지 변경 시 스크롤 제어 (떨림 방지를 위해 useLayoutEffect 사용)
  useLayoutEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const isNewMessageArrived = lastMessage.id !== prevLastMessageId.current;

    // 1. 메시지 추가 로드(무한 스크롤)로 인한 변경인 경우 -> 스크롤 위치 보정
    // isRestoringHistoryRef를 사용하여 정확한 타이밍 제어
    if (isRestoringHistoryRef.current && containerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = diff; // 기존 보고 있던 위치 유지
      
      // 상태 및 Ref 초기화
      prevScrollHeightRef.current = 0; 
      setIsLoadingMore(false);

      // Delay unlock to let layout/resize observers settle (especially for Heavy media/videos)
      setTimeout(() => {
        isRestoringHistoryRef.current = false;
      }, 100);
      
      // Update tracking refs to correct state so next render doesn't misfire
      prevLastMessageId.current = lastMessage.id;
      previousMessageCount.current = messages.length;
      return; // Critical: Stop processing to prevent fall-through to "New Message" logic
    }
    // 2. 초기 로딩인 경우 -> 맨 아래로
    else if (isInitialLoad.current) {
      scrollToBottom(true);
      isInitialLoad.current = false;
    }
    // 3. 새 메시지가 도착한 경우 (내 메시지거나 맨 아래 보고 있을 때) -> 맨 아래로
    else if (isNewMessageArrived) {
      if (isLoadingNewerRef.current) {
        isLoadingNewerRef.current = false;
        setIsLoadingNewer(false);
      } else {
        const isMyMessage = lastMessage.sender_id === currentUserId;
        // 내가 쓴 메시지이거나, 이미 바닥에 보고 있었으면 자동 스크롤
        if (isMyMessage || isUserNearBottomRef.current) {
          scrollToBottom(false);
        } else {
          // 아니면 "새 메시지" 버튼 표시
          if (!isMyMessage) {
            let content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
            
            if (lastMessage.attachments && lastMessage.attachments.length > 0) {
              const types = lastMessage.attachments.map(a => a.type);
              let prefix = '';
              if (types.includes('video')) prefix = `[${t('notification.media_video', '동영상')}] `;
              else if (types.includes('file')) prefix = `[${t('notification.media_file', '파일')}] `;
              else if (types.includes('image')) prefix = `[${t('notification.media_photo', '사진')}] `;
              
              content = `${prefix}${content}`.trim();
            }

            if (!content) content = t('chat.image_message', '사진');

            setNewMessageToast({
              id: lastMessage.id,
              sender: lastMessage.sender?.nickname || 'Unknown',
              content: content,
              avatar: lastMessage.sender?.avatar_url
            });
          }
        }
      }
    }
    prevLastMessageId.current = lastMessage.id;
    previousMessageCount.current = messages.length;
  }, [messages, scrollToBottom]);
  // 컨테이너 크기 변화 감지 (이미지 로드 등으로 인한 높이 변화 대응)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let prevScrollHeight = container.scrollHeight;
    let prevClientHeight = container.clientHeight;
    let debounceTimeout: number | null = null;

    const handleResize = () => {
      // Locking during history restore
      if (isRestoringHistoryRef.current) return;
      
      // Debounce to batch rapid changes (16ms = one frame)
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }

      debounceTimeout = window.setTimeout(() => {
        const { scrollHeight, clientHeight, scrollTop } = container;
        const heightChanged = scrollHeight !== prevScrollHeight;
        
        // 만약 높이가 변했고, 사용자가 바닥에 있었거나(isUserNearBottomRef), 
        // 혹은 스크롤 위치가 변하지 않았는데 높이만 커진 경우(이미지 로드 등)
        if (heightChanged) {
          const isBottom = prevScrollHeight - (scrollTop + prevClientHeight) < 50;
          
          // 바닥 근처였으면 새 바닥으로 이동
          if (isBottom || isUserNearBottomRef.current) {
            container.scrollTop = scrollHeight;
          }
          prevScrollHeight = scrollHeight;
          prevClientHeight = clientHeight;
        }
      }, 16);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    // 이미지 로드 등 미세한 변화를 위해 MutationObserver 추가
    const mutationObserver = new MutationObserver(handleResize);
    mutationObserver.observe(container, { childList: true, subtree: true, attributes: true });

    return () => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
  // 스크롤 이벤트 핸들러
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

    // 1. 무한 스크롤 감지
    // 맨 위 도달 (여유분 50px) & 더 불러올 메시지 있음 & 로딩 중 아님
    if (container.scrollTop < 50 && hasMoreMessages && !isLoadingMore && messages.length > 0) {
      setIsLoadingMore(true);
      isRestoringHistoryRef.current = true; // Sync Lock
      isUserNearBottomRef.current = false; // FORCE RESET: We are at top, not bottom. Prevent sticky logic.
      prevScrollHeightRef.current = container.scrollHeight;

      const addedCount = await loadMoreMessages();

      // 추가된 메시지가 없으면 로딩 상태 해제 및 스크롤 높이 참조 초기화
      if (addedCount === 0) {
        setIsLoadingMore(false);
        isRestoringHistoryRef.current = false; // Sync Unlock
        prevScrollHeightRef.current = 0;
      }
    }
    // 2. 정방향 무한 스크롤 감지 (바닥 도달)
    // scrollHeight - scrollTop - clientHeight 가 0에 가까우면 바닥
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    // 바닥 여유분 50px & 더 불러올 미래 메시지 있음 & 로딩 중 아님
    if (
      scrollBottom < 50 &&
      hasNewerMessages &&
      !isLoadingNewerRef.current &&
      messages.length > 0
    ) {
      setIsLoadingNewer(true);
      isLoadingNewerRef.current = true;

      const addedCount = await loadNewerMessages();

      // 데이터가 없으면 리렌더링이 안 될 수 있으므로 여기서 꺼줌
      // 데이터가 있으면(addedCount > 0) useLayoutEffect에서 꺼줌 (렌더링 싱크 맞춤)
      if (addedCount === 0) {
        setIsLoadingNewer(false);
        isLoadingNewerRef.current = false;
      }
    }
    // 3. 스크롤 다운 버튼 표시 여부
    const { scrollTop, scrollHeight, clientHeight } = container;
    // 바닥에서 100px 이상 떨어지면 버튼 표시
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    isUserNearBottomRef.current = isBottom; // Ref 업데이트

    if (isBottom) {
      setNewMessageToast(null); // 바닥에 오면 토스트 숨김
    }

    setShowScrollDownBtn(!isBottom);
  };
  // 채팅방 변경 시 로드 최적화 & 딥링킹(검색 이동) 처리
  useEffect(() => {
    if (!chatId) return;
    // 이미 로드된 채팅방이고, 메시지도 있으며, 딥링킹(highlightMessageId)이 없는 경우 -> 재로드 방지
    // 단, highlightMessageId가 있으면 해당 메시지 위치로 가야 하므로 무조건 로드 수행 (Context 내부에서 최적화 됨)
    if (chatId === currentChatIdRef.current && messages.length > 0 && !highlightMessageId) {
      return;
    }

    setIsLoadingMessages(true);

    // highlightMessageId(targetId)가 있으면 딥링킹 로드 수행, 없으면 일반 로드
    // loadMessages(chatId, targetId) 형태
    loadMessages(chatId, highlightMessageId).finally(() => {
      setIsLoadingMessages(false);
      // 채팅방 진입 시 스크롤 초기화
      // 딥링킹 시에는 자동 바닥 스크롤을 막고(해당 위치로 가야 하므로), 일반 진입 시에는 바닥으로
      if (highlightMessageId) {
        isInitialLoad.current = false;
      } else {
        isInitialLoad.current = true;
        // 일반 진입 시 바닥 스크롤 로직 트리거
        // (useEffect dep에 의해 isInitialLoad가 true면 아래 스크롤 로직이 바닥으로 보냄)
      }
    });
  }, [chatId, loadMessages, highlightMessageId]); // highlightMessageId 변경 시에도 반응해야 함
  // 하이라이트 메시지 이동 처리
  // 하이라이트 메시지 ID가 변경되면 스크롤 플래그 초기화
  const hasScrolledToHighlightRef = useRef<string | null>(null);
  useEffect(() => {
    if (highlightMessageId !== hasScrolledToHighlightRef.current) {
      // ID가 바뀌었으면 (혹은 null->값) 스크롤 시도 허용
      // 단, null일 때는 굳이 리셋할 필요 없음(어차피 동작 안함)
      if (highlightMessageId) {
        hasScrolledToHighlightRef.current = null; // 아직 스크롤 안함
      }
    }
  }, [highlightMessageId]);
  // 하이라이트 메시지 이동 처리 (강력한 재시도 로직 적용)
  useEffect(() => {
    if (!highlightMessageId || messages.length === 0 || isLoadingMessages) return;
    // 이미 스크롤을 완료한 ID라면 건너뜀 (데이터 업데이트로 인한 재실행 방지)
    if (hasScrolledToHighlightRef.current === highlightMessageId) return;
    // 데이터 진단: 타겟 메시지가 목록에 있는지 확인
    const exists = messages.some(m => m.id === highlightMessageId);
    if (!exists) return;
    const targetId = `msg-${highlightMessageId}`;
    let retryCount = 0;
    const maxRetries = 20; // 2초 동안 시도 (100ms * 20)
    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 시각적 강조 (깜빡임 재확인)
        el.classList.add(styles['message-highlight-flash']);
        setTimeout(() => el.classList.remove(styles['message-highlight-flash']), 3000);

        // 스크롤 완료 표시
        hasScrolledToHighlightRef.current = highlightMessageId;
      } else {
        // 아직 렌더링되지 않음 (조용히 재시도)
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(tryScroll, 100);
        }
      }
    };
    // 즉시 시도
    tryScroll();
  }, [highlightMessageId, messages, isLoadingMessages]);
  const { t, i18n } = useTranslation();
  // 버튼 클릭 감지
  // 버튼 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // 새 메시지 알림 자동 숨김 제거 (사용자 요청)
  // useEffect(() => {
  //   if (newMessageToast) {
  //     const timer = setTimeout(() => {
  //       setNewMessageToast(null);
  //     }, 4000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [newMessageToast]);

  // 메시지 그룹핑 최적화
  const messageGroups = useMemo(() => {
    const groups: MessageGroup = {};
    if (messages && Array.isArray(messages)) {
      // Temporarily removed deduplication to test if it's causing display issues
      messages.forEach(message => {
        const date = new Date(message.created_at).toDateString();
        (groups[date] ||= []).push(message);
      });
    }
    return groups;
  }, [messages]);
  // 10-zzeon: 향상된 UX를 위한 Modal 기반 나가기 확인
  const handleExitChat = useCallback(() => {
    setIsExitModalOpen(true);
  }, []);

  const confirmExitChat = useCallback(async () => {
    try {
      const success = await exitDirectChat(chatId);
      if (success) {
        // toast removed as per request
        onBackToList?.();
      } else {
        toast.error(t('chat.exit_fail', '채팅방 나가기에 실패했습니다.'));
      }
    } catch {
      toast.error(t('chat.exit_error', '채팅방 나가기 중 오류가 발생했습니다.'));
    } finally {
      setIsExitModalOpen(false);
    }
  }, [chatId, exitDirectChat, onBackToList, t]);
  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHasSearched(false);
      return;
    }

    // 서버 사이드 검색 수행
    const foundMessages = await searchMessagesInChat(chatId, q);
    const matchedIds = foundMessages.map(m => m.id);

    setSearchResults(matchedIds);
    setCurrentResultIndex(0);
    setHasSearched(true);

    if (matchedIds.length > 0) {
      // 첫 번째 결과로 이동 시도
      goToResultRef.current(matchedIds[0]);
    }
  }, [searchQuery, chatId, searchMessagesInChat]);
  // goToResult에서 쓸 수 있도록 별도 함수 분리 (Ref나 내부 로직 활용)
  const jumpToMessage = useCallback(
    (messageId: string) => {
      const exists = messages.some(m => m.id === messageId);
      if (exists) {
        scrollToMessage(messageId);
      } else {
        // 없으면 로드 -> Deep Link
        setIsLoadingMessages(true);
        loadMessages(chatId, messageId).finally(() => {
          setIsLoadingMessages(false);
          // 로드 후 스크롤은 loadMessages 후 useEffect 등에서 처리되거나,
          // 여기서 명시적으로 다시 시도해야 함.
          // 다만 DirectChatRoom에는 highlightMessageId prop에 의존하는 useEffect가 있음.
          // 여기서는 prop을 바꾸는 게 아니라 내부적으로 로드했으므로, 수동으로 스크롤 시도가 필요할 수 있음.
          // 하지만 loadMessages가 state를 바꾸므로 리렌더링 됨.
          // 확실한 이동을 위해 잠시 후 스크롤 시도
          setTimeout(() => scrollToMessage(messageId), 500);
        });
      }
    },
    [messages, chatId, loadMessages, scrollToMessage],
  );
  // goToResult가 최신 jumpToMessage를 쓰도록 Ref 패턴 사용 또는 의존성 추가
  // 여기서는 useEffect 패턴 대신 직접 호출 구조로 변경
  const goToResultRef = useRef<(id: string) => void>(() => {});
  useEffect(() => {
    goToResultRef.current = jumpToMessage;
  }, [jumpToMessage]);
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );
  // 검색창 닫히면 초기화
  useEffect(() => {
    if (!showSearch) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHasSearched(false);
    }
  }, [showSearch]);
  const goToResult = useCallback(
    (direction: 'prev' | 'next') => {
      if (searchResults.length === 0) return;
      let nextIndex = currentResultIndex;
      if (direction === 'prev')
        nextIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
      else nextIndex = (currentResultIndex + 1) % searchResults.length;

      setCurrentResultIndex(nextIndex);
      const targetId = searchResults[nextIndex];
      // jumpToMessage 호출
      goToResultRef.current(targetId);
    },
    [searchResults, currentResultIndex],
  );
  if (error) {
    return (
      <div className="chat-room">
        <div className="error-message">
          <p>오류 : {error}</p>
          <button onClick={() => loadMessages(chatId)}>다시 시도</button>
        </div>
      </div>
    );
  }
  return (
    <div className="chat-room relative">
      <div className="chat-room-header">
        <div className="chat-room-info">
          <div className="chat-room-header-left">
            {onBackToList && (
              <button className="chat-room-back-btn" onClick={onBackToList}>
                ←
              </button>
            )}
            <h3>
              <div className="relative inline-flex items-center gap-2">
                <span className="flex items-center gap-2">
                  {currentChat?.other_user?.nickname || t('chat.loading')}
                  <BanBadge bannedUntil={currentChat?.other_user?.banned_until ?? null} size="sm" />
                </span>
                {currentChat?.other_user?.id && (
                  <OnlineIndicator 
                    userId={currentChat.other_user.id} 
                    size="sm" 
                    className="absolute -top-0.5 -right-2.5 z-10 border-white dark:border-secondary border shadow-none" 
                  />
                )}
              </div>
            </h3>
          </div>
        </div>
        <div className="chat-room-actions">
          <button
            onClick={() => {
              setShowSearch(prev => !prev);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            aria-pressed={showSearch}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <img src="/images/searchT.svg" alt="검색" className="chat-room-search-icon" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
            >
              <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 w-auto min-w-[144px] bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-50">
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setShowMenu(false);
                    setShowMediaGallery(true);
                  }}
                >
                  <i className="ri-gallery-line" />
                  {t('chat.media_gallery', '미디어')}
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                <ReportButton onClick={() => {
                   setShowMenu(false);
                   setIsReportMode(true);
                   toast.info(t('report.guide_select', '신고할 메시지를 선택해주세요.'));
                }} />
                {currentChat?.other_user?.id && (
                  <BlockButton
                    targetProfileId={currentChat.other_user.id}
                    onClose={() => setShowMenu(false)}
                    onBlock={() => onBackToList?.()}
                  />
                )}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-red-500 flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setShowMenu(false);
                    handleExitChat();
                  }}
                >
                  <i className="ri-logout-box-r-line" />
                  {t('chat.btn_leave')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Selection Mode Bottom Bar */}
      {isReportMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 z-50 flex items-center justify-between shadow-lg safe-area-bottom">
              <span className="text-sm font-medium">
                  {selectedMessages.size} {t('report.selected_count', '개 선택됨')}
              </span>
              <div className="flex gap-3">
                  <button 
                      onClick={() => {
                          setIsReportMode(false);
                          setSelectedMessages(new Set());
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium"
                  >
                      {t('common.cancel', '취소')}
                  </button>
                  <button 
                      onClick={initiateReport}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                      disabled={selectedMessages.size === 0}
                  >
                      {t('report.submit', '신고하기')}
                  </button>
              </div>
          </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportModalOpen}
          onSuccess={() => {
              setIsReportMode(false);
              setSelectedMessages(new Set());
          }}
          metadata={{ reported_message_ids: Array.from(selectedMessages) }}
          contentSnapshot={contentSnapshot}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportTarget(null);
            // If submitted/closed, exit report mode too?
            // Usually yes if success, but modal onClose might be cancel.
            // If success, we should exit. But ReportModal doesn't tell distinction easily.
            // We can leave mode on for retry, or exit.
            // Let's keep mode on unless user cancels.
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          additionalInfo={`[Reported Messages]\n${reportPreview}`}
          previewContent={
              <div className="whitespace-pre-wrap text-xs">
                  {reportPreview}
              </div>
          }
        />
      )}
      
      {showSearch && (
        <div className="chat-room-search-bar">
          <div className="chat-room-search-inner">
            <div
              className={`chat-room-search-input-wrap transition-all duration-200 border border-transparent rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-background`}
            >
              <img src="/images/searchT.svg" alt="검색" className="chat-room-search-input-icon" />
              <input
                type="text"
                placeholder={t('chat.search_placeholder')}
                className="chat-room-search-input focus:outline-none focus:ring-0 focus:border-none border-none ring-0 shadow-none bg-transparent"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                ref={searchInputRef}
              />
              <button className="chat-room-search-button" onClick={handleSearch}>
                {t('chat.search_btn')}
              </button>
            </div>
            <div className="chat-room-search-meta">
              {!hasSearched ? (
                <span className="chat-room-search-hint">{t('chat.search_hint')}</span>
              ) : searchResults.length > 0 ? (
                <>
                  <span className="chat-room-search-count">
                    {t('chat.result_count', {
                      count: searchResults.length,
                      index: currentResultIndex + 1,
                    })}
                  </span>
                  <div className="chat-room-search-nav">
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('prev')}
                    >
                      ↓ {t('chat.prev')}
                    </button>
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('next')}
                    >
                      ↑ {t('chat.next')}
                    </button>
                  </div>
                </>
              ) : (
                <span className="chat-room-search-no-result">{t('chat.no_result')}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 메시지 영역과 플로팅 버튼을 감싸는 래퍼 */}
      <div className="chat-message-wrapper">
        <div className="chat-room-message" ref={containerRef} onScroll={handleScroll}>
          {isLoadingMessages ? (
            <div className="loading">{t('chat.loading_messages')}</div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="no-message">
              <p>{t('chat.no_messages')}</p>
              <p>{t('chat.send_first_message')}</p>
            </div>
          ) : (
            Object.keys(messageGroups)
              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
              .map(date => {
                const dateMessages = messageGroups[date];
                return (
                  <div key={date} className="message-group">
                    <div className="chat-divider">
                      <span>{formatSmartDate(date)}</span>
                    </div>
                    <div className="message-group-container">
                      {dateMessages.map((message: DirectMessage) => {
                        const lowerQ = searchQuery.trim().toLowerCase();
                        const isMatched =
                          !!lowerQ &&
                          typeof message.content === 'string' &&
                          message.content.toLowerCase().includes(lowerQ);
                        const isCurrent =
                          isMatched &&
                          searchResults.length > 0 &&
                          searchResults[currentResultIndex] === message.id;
                        return (
                          <MessageItem
                            key={message.id}
                            message={message}
                            currentUserId={currentUserId}
                            isHighlighted={isMatched}
                            isFlashing={message.id === highlightMessageId}
                            isCurrent={isCurrent}
                            searchQuery={searchQuery}
                            onImageLoad={handleImageLoad}
                            onViewMedia={setViewingMediaUrl} // 통합 미디어 핸들러
                            isSelectionMode={isReportMode}
                            isSelected={selectedMessages.has(message.id)}
                            onToggleSelection={toggleSelection}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
          <div
            ref={messageEndRef}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 0,
              height: 0,
              visibility: 'hidden',
            }}
          />
        </div>
        {/* 새 메시지 알림 버튼 */}
        {newMessageToast && (
          <button
            onClick={() => {
              scrollToBottom(false);
              setNewMessageToast(null);
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 transition-all active:scale-95 hover:scale-105 group max-w-[70vw] sm:max-w-[350px]"
          >
            <div className="shrink-0">
              <CachedAvatar url={newMessageToast.avatar} nickname={newMessageToast.sender} size={24} />
            </div>
            
            <div className="flex items-center gap-2 min-w-0 flex-1 text-xs sm:text-sm">
              <span className="font-bold whitespace-nowrap shrink-0 max-w-[80px] truncate">
                {newMessageToast.sender}
              </span>
              <span className="truncate opacity-90 block max-w-[150px]">
                {newMessageToast.content}
              </span>
            </div>
            
            <ArrowDown className="w-3.5 h-3.5 animate-bounce shrink-0 opacity-90 ml-0.5" />
          </button>
        )}

        {showScrollDownBtn && !newMessageToast && (
          <button
            className="scroll-bottom-btn"
            onClick={() => scrollToBottom(false)}
            aria-label="맨 아래로 스크롤"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        chatId={chatId}
      />
      
      {/* 통합 미디어 뷰어 (채팅방 내 클릭용) */}
      <MediaViewer
        isOpen={!!viewingMediaUrl}
        onClose={() => setViewingMediaUrl(null)}
        mediaList={viewerMediaList}
        initialMediaId={viewingMediaUrl || undefined}
      />

      {/* 나가기 확인 모달 */}
        <Modal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
          title={t('chat.confirm_exit_title')}
          className="max-w-sm h-auto"
        >
          <div className="flex flex-col gap-4">
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {t('chat.confirm_exit_desc')}
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
              >
                {t('common.cancel', '취소')}
              </button>
              <button
                onClick={confirmExitChat}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              >
                {t('chat.btn_leave', '나가기')}
              </button>
            </div>
          </div>
        </Modal>


      <MessageInput chatId={chatId} />
    </div>
  );
};

export default DirectChatRoom;
