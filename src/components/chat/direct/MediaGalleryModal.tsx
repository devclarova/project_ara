import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DirectMessage } from '@/types/ChatType';
import { useTranslation } from 'react-i18next';
import { getMediaInChat } from '@/services/chat/directChatService';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

interface MediaItem {
  url: string;
  messageId: string;
  date: string;
  senderId: string;
  senderName: string;
}

interface GroupedMedia {
  [date: string]: MediaItem[];
}

export default function MediaGalleryModal({ isOpen, onClose, chatId }: MediaGalleryModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [mediaMessages, setMediaMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  
  // 확대/축소 기능
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // 드래그 상태 관리
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const lastPanX = useRef<number>(0);
  const lastPanY = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 핀치 제스처
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);

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
  
  // 이미지 변경 시 확대/위치 초기화
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setDragOffset(0);
    lastPanX.current = 0;
    lastPanY.current = 0;
  }, [selectedImage]);

  // 메시지에서 모든 미디어 추출
  const allMedia = useMemo(() => {
    const media: MediaItem[] = [];
    
    mediaMessages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          media.push({
            url: att.url,
            messageId: msg.id,
            date: msg.created_at,
            senderId: msg.sender_id,
            senderName: msg.sender?.nickname || 'Unknown',
          });
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

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 이전/다음 이미지 네비게이션 (애니메이션 포함)
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;

    const currentIndex = allMedia.findIndex(item => item.url === selectedImage.url);
    if (currentIndex > 0) {
      setDragOffset(-window.innerWidth * 0.3);
      setTimeout(() => {
        setSelectedImage(allMedia[currentIndex - 1]);
        setDragOffset(window.innerWidth * 0.3);
        setTimeout(() => {
          setDragOffset(0);
        }, 20);
      }, 100);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;

    const currentIndex = allMedia.findIndex(item => item.url === selectedImage.url);
    if (currentIndex < allMedia.length - 1) {
      setDragOffset(window.innerWidth * 0.3);
      setTimeout(() => {
        setSelectedImage(allMedia[currentIndex + 1]);
        setDragOffset(-window.innerWidth * 0.3);
        setTimeout(() => {
          setDragOffset(0);
        }, 20);
      }, 100);
    }
  };

  // 키보드 이벤트 핸들러 (좌우 화살표)
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const currentIndex = allMedia.findIndex(item => item.url === selectedImage.url);
        if (currentIndex > 0) {
          setDragOffset(-window.innerWidth * 0.3);
          setTimeout(() => {
            setSelectedImage(allMedia[currentIndex - 1]);
            setDragOffset(window.innerWidth * 0.3);
            setTimeout(() => {
              setDragOffset(0);
            }, 20);
          }, 100);
        }
      } else if (e.key === 'ArrowRight') {
        const currentIndex = allMedia.findIndex(item => item.url === selectedImage.url);
        if (currentIndex < allMedia.length - 1) {
          setDragOffset(window.innerWidth * 0.3);
          setTimeout(() => {
            setSelectedImage(allMedia[currentIndex + 1]);
            setDragOffset(-window.innerWidth * 0.3);
            setTimeout(() => {
              setDragOffset(0);
            }, 20);
          }, 100);
        }
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, allMedia]);

  // 드래그 이벤트 핸들러
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    lastPanX.current = panX;
    lastPanY.current = panY;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (scale > 1) {
      // 확대된 상태: 팬 기능
      const deltaX = clientX - dragStartX.current;
      const deltaY = clientY - dragStartY.current;
      setPanX(lastPanX.current + deltaX);
      setPanY(lastPanY.current + deltaY);
    } else {
      // 원래 크기: 슬라이드 기능
      const offset = clientX - dragStartX.current;
      setDragOffset(offset);
    }
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    
    if (scale > 1) {
      // 확대된 상태: 팬 위치 고정
      isDragging.current = false;
      return;
    }
    
    // 원래 크기: 슬라이드 기능
    const clientX = 'touches' in e ? (e as React.TouchEvent).changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const dragDistance = clientX - dragStartX.current;
    const threshold = 50;

    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0) {
        const currentIndex = allMedia.findIndex(item => item.url === selectedImage?.url);
        if (currentIndex > 0) {
          setDragOffset(window.innerWidth * 0.3);
          setTimeout(() => {
            setSelectedImage(allMedia[currentIndex - 1]);
            setDragOffset(-window.innerWidth * 0.3);
            setTimeout(() => {
              setDragOffset(0);
            }, 20);
          }, 100);
        } else {
          setDragOffset(0);
        }
      } else {
        const currentIndex = allMedia.findIndex(item => item.url === selectedImage?.url);
        if (currentIndex < allMedia.length - 1) {
          setDragOffset(-window.innerWidth * 0.3);
          setTimeout(() => {
            setSelectedImage(allMedia[currentIndex + 1]);
            setDragOffset(window.innerWidth * 0.3);
            setTimeout(() => {
              setDragOffset(0);
            }, 20);
          }, 100);
        } else {
          setDragOffset(0);
        }
      }
    } else {
      setDragOffset(0);
    }

    isDragging.current = false;
    dragStartX.current = 0;
  };
  
  // 확대/축소 기능 - wheel 이벤트
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !selectedImage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => {
        const newScale = Math.min(Math.max(1, prev + delta), 4);
        if (newScale === 1) {
          setPanX(0);
          setPanY(0);
        }
        return newScale;
      });
    };

    img.addEventListener('wheel', handleWheel, { passive: false });
    return () => img.removeEventListener('wheel', handleWheel);
  }, [selectedImage]);
  
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPanX(0);
      setPanY(0);
    } else {
      setScale(2);
    }
  };
  
  // 핀치 제스처 및 터치 이벤트
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !selectedImage) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialDistance.current = distance;
        initialScale.current = scale;
      } else if (e.touches.length === 1) {
        isDragging.current = true;
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        dragStartX.current = clientX;
        dragStartY.current = clientY;
        lastPanX.current = panX;
        lastPanY.current = panY;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scaleChange = distance / initialDistance.current;
        const newScale = Math.min(Math.max(1, initialScale.current * scaleChange), 4);
        setScale(newScale);
        if (newScale === 1) {
          setPanX(0);
          setPanY(0);
        }
      } else if (e.touches.length === 1 && isDragging.current) {
        e.preventDefault();
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        
        if (scale > 1) {
          const deltaX = clientX - dragStartX.current;
          const deltaY = clientY - dragStartY.current;
          setPanX(lastPanX.current + deltaX);
          setPanY(lastPanY.current + deltaY);
        } else {
          const offset = clientX - dragStartX.current;
          setDragOffset(offset);
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && isDragging.current) {
        if (scale > 1) {
          isDragging.current = false;
          return;
        }
        
        const clientX = e.changedTouches[0].clientX;
        const dragDistance = clientX - dragStartX.current;
        const threshold = 50;

        if (Math.abs(dragDistance) > threshold) {
          if (dragDistance > 0) {
            const currentIndex = allMedia.findIndex(item => item.url === selectedImage?.url);
            if (currentIndex > 0) {
              setDragOffset(window.innerWidth * 0.3);
              setTimeout(() => {
                setSelectedImage(allMedia[currentIndex - 1]);
                setDragOffset(-window.innerWidth * 0.3);
                setTimeout(() => {
                  setDragOffset(0);
                }, 20);
              }, 100);
            } else {
              setDragOffset(0);
            }
          } else {
            const currentIndex = allMedia.findIndex(item => item.url === selectedImage?.url);
            if (currentIndex < allMedia.length - 1) {
              setDragOffset(-window.innerWidth * 0.3);
              setTimeout(() => {
                setSelectedImage(allMedia[currentIndex + 1]);
                setDragOffset(window.innerWidth * 0.3);
                setTimeout(() => {
                  setDragOffset(0);
                }, 20);
              }, 100);
            } else {
              setDragOffset(0);
            }
          }
        } else {
          setDragOffset(0);
        }

        isDragging.current = false;
        dragStartX.current = 0;
      }
    };

    img.addEventListener('touchstart', handleTouchStart, { passive: false });
    img.addEventListener('touchmove', handleTouchMove, { passive: false });
    img.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      img.removeEventListener('touchstart', handleTouchStart);
      img.removeEventListener('touchmove', handleTouchMove);
      img.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedImage, scale, panX, panY, allMedia]);

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
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {/* 호버 오버레이 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="text-white text-xs font-medium">
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

      {/* 라이트박스 (이미지 확대) */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-12 right-4 p-2 rounded-full hover:bg-black/50 transition z-10"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <X size={24} className="text-white" strokeWidth={2.5} />
          </button>

          {/* 다운로드 버튼 */}
          <button
            onClick={() => handleDownload(selectedImage.url)}
            className="absolute top-12 right-16 p-2 rounded-full hover:bg-black/50 transition z-10"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <Download size={24} className="text-white" strokeWidth={2.5} />
          </button>

          {/* 이전 이미지 버튼 */}
          {allMedia.findIndex(item => item.url === selectedImage.url) > 0 && (
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-20"
              aria-label="Previous image"
            >
              <ChevronLeft size={36} className="text-white" />
            </button>
          )}

          {/* 다음 이미지 버튼 */}
          {allMedia.findIndex(item => item.url === selectedImage.url) < allMedia.length - 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-20"
              aria-label="Next image"
            >
              <ChevronRight size={36} className="text-white" />
            </button>
          )}

          <img
            ref={imgRef}
            src={selectedImage.url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
            style={{ 
              opacity: imageOpacity,
              transform: `translateX(${dragOffset}px) scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
              transition: dragOffset === 0 && !isDragging.current ? 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)' : 'opacity 250ms ease-out',
              willChange: 'transform, opacity',
              cursor: scale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : (isDragging.current ? 'grabbing' : 'grab')
            }}
            draggable={false}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onDoubleClick={handleDoubleClick}
          />

          {/* 이미지 정보 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm">
            <span className="font-medium">{selectedImage.senderName}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(selectedImage.date)}</span>
          </div>
        </div>
      )}
    </>
  );
}
