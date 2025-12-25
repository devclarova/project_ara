import { useState, useMemo, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import type { DirectMessage } from '@/types/ChatType';
import { useTranslation } from 'react-i18next';
import { getMediaInChat } from '@/services/chat/directChatService';
import MediaViewer, { type MediaItem } from './MediaViewer';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

// MediaItem removed (imported), GroupedMedia stays
interface GroupedMedia {
  [date: string]: MediaItem[];
}

export default function MediaGalleryModal({ isOpen, onClose, chatId }: MediaGalleryModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [mediaMessages, setMediaMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 모달이 열릴 때 채팅방의 모든 미디어 메시지 로드
  useEffect(() => {
    if (isOpen && chatId) {
      setLoading(true);
      getMediaInChat(chatId)
        .then(response => {
          if (response.success && response.data) {
            setMediaMessages(response.data);
          } else {
            console.error('미디어 로드 실패:', response.error);
            setMediaMessages([]);
          }
        })
        .catch(error => {
          console.error('미디어 로드 오류:', error);
          setMediaMessages([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, chatId]);
  
  // No reset needed as MediaViewer handles generic state


  // 메시지에서 모든 미디어 추출
  const allMedia = useMemo(() => {
    const media: MediaItem[] = [];
    
    // DB returns DESC (Newest first). We want Chronological (ASC) for Gallery Navigation (Left=Older, Right=Newer)
    // So we reverse/sort it.
    const sorted = [...mediaMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att: any) => {
          // 파일 타입은 제외하고 이미지와 비디오만 갤러리에 표시
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
    
    // 최신순 정렬
    return media.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mediaMessages]);

  // 날짜별 그룹핑
  const groupedMedia = useMemo(() => {
    const groups: GroupedMedia = {};
    
    allMedia.forEach(item => {
      const dateKey = new Date(item.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [allMedia]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const lang = i18n.language || 'ko';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Helper functions moved to MediaViewer or removed if not used locally

  // Gesture handlers removed


  if (!isOpen) return null;

  return (
    <>
      {/* 메인 갤러리 모달 */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative w-full h-full bg-white dark:bg-secondary flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('chat.media_gallery', '미디어')} ({allMedia.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 갤러리 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-lg">{t('common.loading', '로딩 중...')}</p>
              </div>
            ) : allMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p className="text-lg">{t('chat.no_media', '공유된 미디어가 없습니다')}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedMedia).map(([dateKey, items]) => (
                  <div key={dateKey}>
                    {/* 날짜 헤더 */}
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar size={16} className="text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatDate(items[0].date)}
                      </h3>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* 이미지 그리드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.messageId}-${idx}`}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer group"
                          onClick={() => setSelectedImage(item)}
                        >
                          {item.type === 'video' ? (
                             <video
                               src={item.url}
                               className="w-full h-full object-cover"
                               muted
                             />
                          ) : (
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          )}
                          {/* 호버 오버레이 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            {item.type === 'video' && <i className="ri-play-circle-fill text-3xl text-white/90" />}
                            <div className="absolute bottom-2 text-white text-xs font-medium">
                              {item.senderName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 라이트박스 뷰어 (MediaViewer 사용) */}
      <MediaViewer
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        mediaList={allMedia}
        initialMediaId={selectedImage?.url} // Pass URL for unique identification
      />
    </>
  );
}
