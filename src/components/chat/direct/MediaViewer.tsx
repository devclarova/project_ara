import { useState, useEffect, useRef } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MediaItem {
  url: string;
  messageId: string;
  date: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  type: 'image' | 'video';
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  initialMediaId?: string;
}

// Custom Video Player Component
const CustomVideoPlayer = ({ 
  src, 
  opacity, 
  onEnded,
  isDragging,
  showControls,
  onPlayStateChange,
  onInteraction
}: { 
  src: string; 
  opacity: number; 
  onEnded?: () => void;
  isDragging: boolean;
  showControls: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onInteraction: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(0);

  /* Scrubbing Logic */
  const isScrubbing = useRef(false);
  
  // Sync internal playing state to parent
  useEffect(() => {
    onPlayStateChange(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      // Don't update progress from video time while user is manually dragging
      if (isScrubbing.current) return; 
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onInteraction(); // Show controls
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const handleScrubMove = (clientX: number) => {
      const video = videoRef.current;
      const progressBar = document.getElementById('video-progress-bar');
      if (!video || !progressBar) return;
      
      const rect = progressBar.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      
      video.currentTime = percentage * video.duration;
      setProgress(percentage * 100);
  };

  const onScrubStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation(); // Prevent parent drag from wrapper
      // Important: Prevent default touch behavior (scrolling) to allow smooth scrubbing
      // Note: React's onTouchStart is passive by default, so we might need native listener if this fails, 
      // but e.stopPropagation usually helps. preventDefault is key.
      // But we can't always preventDefault on passive listeners. 
      // The container has 'touch-none' CSS class which handles the scrolling prevention!
      
      isScrubbing.current = true;
      onInteraction();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleScrubMove(clientX);
      
      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
          if (moveEvent.cancelable) moveEvent.preventDefault(); // Stop scrolling!
          const moveX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
          handleScrubMove(moveX);
      };
      
      const onEnd = () => {
          isScrubbing.current = false;
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onEnd);
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onEnd);
      };
      
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
  };

  // Controls handled by parent (onInteraction)

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    onInteraction(); // Notify parent of interaction

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      // Show controls via parent interaction
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    onInteraction(); // Interaction

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="relative w-auto h-auto max-w-full max-h-full flex flex-col justify-center items-center group" 
      style={{ aspectRatio: aspectRatio || 'auto' }}
      onMouseMove={onInteraction} // Pass up
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain outline-none rounded-lg shadow-2xl"
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ 
          opacity,
          // Checkerboard background for transparency support
          backgroundImage: `conic-gradient(
            ${document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#f8f8f8'} 90deg, 
            ${document.documentElement.classList.contains('dark') ? '#222222' : '#ffffff'} 90deg 180deg, 
            ${document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#f8f8f8'} 180deg 270deg, 
            ${document.documentElement.classList.contains('dark') ? '#222222' : '#ffffff'} 270deg
          )`,
          backgroundSize: '16px 16px'
        }}
      />
      
      {/* Center Play/Pause Overlay */}
      <div 
         className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!isPlaying || showControls ? 'opacity-100' : 'opacity-0'} pointer-events-none`}
      >
        <div 
          onClick={togglePlay}
          className={`
            w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center 
            transition-all duration-300 transform cursor-pointer pointer-events-auto
            bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 hover:scale-110
            shadow-md
          `}>
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-900 dark:text-white fill-zinc-900 dark:fill-white" />
          ) : (
            <Play className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-900 dark:text-white fill-zinc-900 dark:fill-white ml-0.5 sm:ml-1" />
          )}
        </div>
      </div>

      {/* Custom Timeline Controls */}
      {/* Custom Timeline Controls */}
      {/* Custom Timeline Controls */}
      {/* Custom Timeline Controls */}
      {/* Custom Timeline Controls */}
      {/* Custom Timeline Controls */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 
          p-2 pt-6 sm:p-5 sm:pt-12
          flex items-center gap-2 sm:gap-4 
          bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent
          transition-all duration-300 
          ${showControls && !isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Play Button */}
        <button onClick={togglePlay} className="text-zinc-900 dark:text-white hover:text-black dark:hover:text-white transition p-1 sm:p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full shrink-0">
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-zinc-900 dark:fill-white" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-zinc-900 dark:fill-white" />
          )}
        </button>

        {/* Time - Combined */}
         <div className="flex items-center gap-1 text-zinc-900 dark:text-white/90 text-[10px] sm:text-xs font-mono font-medium shrink-0">
           <span>{formatTime(videoRef.current?.currentTime || 0)}</span>
           <span className="opacity-50">/</span>
           <span>{formatTime(duration)}</span>
        </div>

        {/* Progress Bar Container - Flex-1 to take available space */}
        <div 
          id="video-progress-bar"
          className="flex-1 h-8 sm:h-10 flex items-center cursor-pointer group/bar relative touch-none mx-2"
          onClick={(e) => { e.stopPropagation(); }}
          onMouseDown={onScrubStart}
          onTouchStart={onScrubStart}
        >
          {/* Track Wrapper */}
          <div className="w-full h-1 sm:h-1.5 bg-zinc-400/50 dark:bg-white/30 rounded-full relative overflow-visible backdrop-blur-sm">
             {/* Active Progress */}
             <div 
               className="absolute top-0 left-0 h-full bg-zinc-900 dark:bg-white rounded-full"
               style={{ width: `${progress}%` }}
             />
             
             {/* Thumb */}
             <div 
               className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-zinc-900 dark:bg-white rounded-full shadow-md transition-transform
                  ${isScrubbing.current ? 'scale-125' : 'scale-100 group-hover/bar:scale-125'}
               `}
               style={{ 
                 left: `${progress}%`,
                 transform: 'translate(-50%, -50%)'
               }}
             />
          </div>
        </div>

        <button onClick={toggleMute} className="text-zinc-900 dark:text-white hover:text-black dark:hover:text-white transition p-1 sm:p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full shrink-0">
          {isMuted ? (
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default function MediaViewer({ isOpen, onClose, mediaList, initialMediaId }: MediaViewerProps) {
  const { i18n } = useTranslation();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Screen width check for navigation buttons (420px threshold)
  const [showNavButtons, setShowNavButtons] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
        // Use matchMedia for precision or simple innerWidth
        // User requested "Up to 420px" (meaning visible >= 420px)
        setShowNavButtons(window.innerWidth >= 420);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);
  
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
  // Controls Visibility State (Lifted)
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Video Playback State (Lifted for coordination)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!isVideoPlaying) { // Only auto-hide if not playing? No, usually hide during play too.
        // User said: "Nav buttons disappears when playing unconditionally".
        // Controls usually auto-hide during play.
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    } else {
         // If playing, also auto-hide.
         controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isVideoPlaying]); // Reset timer on play state change

  // 초기 미디어 설정 및 리스트 업데이트 대응
  useEffect(() => {
    if (isOpen) {
        if (!selectedMedia && initialMediaId) {
            // First load: Find initial
            const found = mediaList.find(item => item.url === initialMediaId || item.messageId === initialMediaId);
            if (found) {
                setSelectedMedia(found);
            } else if (mediaList.length > 0) {
                setSelectedMedia(mediaList[0]);
            }
        } else if (selectedMedia) {
            // Update: List changed (e.g. background fetch completed)
            // Try to find current selected URL in new list to keep reference fresh
            const found = mediaList.find(item => item.url === selectedMedia.url);
            if (found) {
                // Update reference but don't reset view (handled by other effect)
                setSelectedMedia(found);
            }
        }
    } else {
      setSelectedMedia(null);
    }
  }, [isOpen, initialMediaId, mediaList]);

  // 이미지 변경 시 확대/위치 초기화
  useEffect(() => {
    // URL이 변경되었을 때만 초기화 (리스트 업데이트 시 깜빡임 방지)
    setScale(1);
    setPanX(0);
    setPanY(0);
    setDragOffset(0);
    lastPanX.current = 0;
    lastPanY.current = 0;
  }, [selectedMedia?.url]); // Only dependency on URL

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const lang = i18n.language || 'ko';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Preload adjacent media to prevent flashing
  useEffect(() => {
    if (!isOpen || !selectedMedia || mediaList.length <= 1) return;

    const currentIndex = mediaList.findIndex(item => item.url === selectedMedia.url);
    if (currentIndex === -1) return;

    const toPreload = [
      mediaList[currentIndex + 1],
      mediaList[currentIndex - 1]
    ].filter(Boolean);

    toPreload.forEach(item => {
      if (item.type === 'image') {
        const img = new Image();
        img.src = item.url;
      } else if (item.type === 'video') {
        // Use detached video element for FULL preload to prevent flashing
        const video = document.createElement('video');
        video.src = item.url;
        video.preload = 'auto'; // Changed from 'metadata' to 'auto' for aggressive buffering
        video.muted = true;
        // No need to append to DOM, creating and setting src triggers connection check
      }
    });

  }, [selectedMedia, mediaList, isOpen]);

  const handleDownload = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Try File System Access API first (for "Save As" dialog)
      if ('showSaveFilePicker' in window) {
        try {
            const name = filename || url.split('/').pop() || `download-${Date.now()}`;
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: name,
                types: [{
                    description: 'Media File',
                    accept: { [blob.type]: ['.' + (name.split('.').pop() || 'dat')] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (pickerError: any) {
            if (pickerError.name === 'AbortError') return; // User cancelled
            console.warn('File picker failed, falling back to blob link:', pickerError);
            // Fallthrough to link download
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const name = filename || url.split('/').pop() || `download-${Date.now()}`;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Last resort fallback
      window.open(url, '_blank');
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;

    const currentIndex = mediaList.findIndex(item => item.url === selectedMedia.url);
    let nextIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < mediaList.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== currentIndex) {
      // Animation Logic
      const cardWidth = window.innerWidth; // Simple full width
      const offset = direction === 'next' ? -cardWidth : cardWidth;
      
      // Animate current out
      // Ideally we double buffer but here we just slide out then switch
      // But user complained "screen moves but slide doesn't happen"
      // Let's simplify: Set offset to allow swipe animation, then switch.
      
      // If triggered by button:
      if (dragOffset === 0) {
          // No drag, just buttons
          setDragOffset(direction === 'next' ? -50 : 50); // Little bump? or just switch
          // Let's just switch for instant feel or add fade
           setSelectedMedia(mediaList[nextIndex]);
           return; 
      }
      
      // If triggered by drag, dragOffset is already set. 
      // We finish the slide.
      const finishOffset = direction === 'next' ? -window.innerWidth : window.innerWidth;
      
      // Animate to finishOffset?? NO, usually we switch state and reset offset 
      // but if we switch state immediately, the new image appears at offset 0.
      
      // Correct generic swipe logic handling:
      // 1. User drags (offset changes).
      // 2. User releases (dragEnd).
      // 3. If threshold met:
      //    a. Animate offset to off-screen (e.g. -100vw).
      //    b. Wait for animation.
      //    c. Update state to new image.
      //    d. Reset offset to +100vw (instant) then animate to 0? Or just 0.
      
      // Let's try simple "Switch and Fade/SlideIn" logic which is robust.
      // Current logic was:
      /*
      setDragOffset(-window.innerWidth * 0.3);
      setTimeout(() => {
        setSelectedMedia(mediaList[currentIndex + 1]);
        setDragOffset(window.innerWidth * 0.3);
        setTimeout(() => {
          setDragOffset(0);
        }, 20);
      }, 100);
      */
      // This logic provides a "slide out left, slide in from right" effect.
      
      const slideOutTarget = direction === 'next' ? -window.innerWidth : window.innerWidth;
      const slideInStart = direction === 'next' ? window.innerWidth : -window.innerWidth;
      
      setDragOffset(slideOutTarget);
      
      setTimeout(() => {
         setSelectedMedia(mediaList[nextIndex]);
         setDragOffset(slideInStart);
         // Force reflow/next tick?
         requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                 setDragOffset(0);
             });
         });
      }, 200); // Wait for transition
    } else {
        // Bounce back
        setDragOffset(0);
    }
  };

  useEffect(() => {
    if (!selectedMedia) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, mediaList, onClose]);

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
    
    // e.preventDefault() here can block scrolling, but we are fixed overlay.
    // However, it caused "click outside" issues? No.
    // Only prevent default if we are dragging horizontally significantly
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (scale > 1) {
      const deltaX = clientX - dragStartX.current;
      const deltaY = clientY - dragStartY.current;
      setPanX(lastPanX.current + deltaX);
      setPanY(lastPanY.current + deltaY);
    } else {
      const offset = clientX - dragStartX.current;
      setDragOffset(offset);
    }
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    
    // 중요: 약간의 움직임은 클릭으로 간주하고 드래그 처리 안함 (e.g. 비디오 토글 등)
    const clientX = 'touches' in e ? (e as React.TouchEvent).changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const dragDistance = clientX - dragStartX.current;
    
    // Prevent accidental swipes
    if (Math.abs(dragDistance) < 10) {
        setDragOffset(0);
        isDragging.current = false;
        return;
    }

    if (scale > 1) {
      isDragging.current = false;
      return;
    }
    
    const threshold = 100; // Increase threshold slightly

    if (Math.abs(dragDistance) > threshold) {
      // Check if navigation is valid
      const currentIndex = mediaList.findIndex(item => item.url === selectedMedia?.url);
      if (dragDistance > 0 && currentIndex > 0) {
         navigateImage('prev');
      } else if (dragDistance < 0 && currentIndex < mediaList.length - 1) {
         navigateImage('next');
      } else {
         setDragOffset(0); // Boundary bounce
      }
    } else {
      setDragOffset(0); // Return/Cancel
    }

    isDragging.current = false;
    dragStartX.current = 0;
  };

  if (!isOpen || !selectedMedia) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-hidden bg-white dark:bg-black/95 transition-colors duration-300"
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Header Bar - Fixed Top to prevent overlap */}
      <div className="w-full h-auto flex items-center justify-between px-6 pt-6 pb-2 bg-transparent z-50 shrink-0 select-none">
          {/* Left: Sender Info */}
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold backdrop-blur-md shadow-lg border border-black/10 dark:border-white/10 overflow-hidden shrink-0 text-zinc-800 dark:text-white">
                {selectedMedia.senderAvatarUrl ? (
                  <img 
                    src={selectedMedia.senderAvatarUrl} 
                    alt={selectedMedia.senderName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{selectedMedia.senderName.charAt(0)}</span>
                )}
             </div>
             <div className="flex flex-col drop-shadow-md text-zinc-900 dark:text-white">
                <span className="font-bold text-sm tracking-wide">{selectedMedia.senderName}</span>
                <span className="text-xs opacity-70 font-mono">{formatDate(selectedMedia.date)}</span>
             </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedMedia.url); }}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition text-zinc-800/90 hover:text-zinc-900 dark:text-white/90 dark:hover:text-white"
                title="Download"
              >
                <Download size={24} />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition text-zinc-800/90 hover:text-zinc-900 dark:text-white/90 dark:hover:text-white"
                title="Close"
              >
                <X size={28} />
              </button>
          </div>
      </div>

      {/* Media Content Area - Flex Grow to fill remaining space */}
      <div 
        className="flex-1 w-full min-h-0 flex items-center justify-center relative p-4 pt-2"
        style={{ 
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging.current ? 'none' : 'transform 250ms cubic-bezier(0.2, 0, 0, 1)'
        }}
        onClick={(e) => { 
           // Clicking background
        }}
      >
        {/* Media Wrapper for buttons positioning */}
        <div 
            className="relative flex items-center justify-center w-auto h-auto max-w-full max-h-full"
            onMouseMove={(e) => {
                // Trigger controls ONLY when moving INSIDE the media wrapper
                e.stopPropagation(); // Prevent bubbling if necessary
                resetControlsTimeout(); 
            }}
            onMouseLeave={() => {
                // Immediate hide when leaving media area IF playing
                if (isVideoPlaying) {
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                    setShowControls(false);
                }
            }}
            onClick={(e) => {
                 // Click on wrapper shouldn't necessarily toggle play unless handled by child video
                 // But we want to ensure interaction is registered
                 e.stopPropagation();
            }}
        >
            {selectedMedia.type === 'video' ? (
              <CustomVideoPlayer 
                src={selectedMedia.url} 
                opacity={imageOpacity} 
                isDragging={dragOffset !== 0} 
                showControls={showControls}
                onPlayStateChange={setIsVideoPlaying}
                onInteraction={resetControlsTimeout}
              />
            ) : (
              <img
                ref={imgRef}
                src={selectedMedia.url}
                alt="Selected Media"
                className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                style={{ 
                  opacity: imageOpacity,
                  transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
                  transition: isDragging.current ? 'none' : 'transform 200ms ease-out',
                  willChange: 'transform',
                  // Checkerboard background for transparency support
                  backgroundImage: `conic-gradient(
                    ${document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#f8f8f8'} 90deg, 
                    ${document.documentElement.classList.contains('dark') ? '#222222' : '#ffffff'} 90deg 180deg, 
                    ${document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#f8f8f8'} 180deg 270deg, 
                    ${document.documentElement.classList.contains('dark') ? '#222222' : '#ffffff'} 270deg
                  )`,
                  backgroundSize: '16px 16px'
                }}
                draggable={false}
              />
            )}

            {/* Navigation Buttons inside Media Wrapper - Centered vertically relative to MEDIA */}
            {mediaList.length > 1 && showNavButtons && (
                <>
                {mediaList.findIndex(item => item.url === selectedMedia.url) > 0 && (
                    <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                    className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full z-40 flex items-center justify-center group shadow-md transition-all
                        bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60
                        ${showControls && !isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                    >
                    <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-900 dark:text-white/90 drop-shadow-sm group-hover:scale-110 transition-transform" />
                    </button>
                )}

                {mediaList.findIndex(item => item.url === selectedMedia.url) < mediaList.length - 1 && (
                    <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                    className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full z-40 flex items-center justify-center group shadow-md transition-all
                        bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60
                        ${showControls && !isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                    >
                    <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-900 dark:text-white/90 drop-shadow-sm group-hover:scale-110 transition-transform" />
                    </button>
                )}
                </>
            )}
        </div>
      </div>
    </div>
  );
}
