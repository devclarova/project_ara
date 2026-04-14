/**
 * 운영자 커뮤니티 콘텐츠 검수 툴(Admin Content Moderation Tool):
 * - 목적(Why): 부적절한 게시글 및 이미지를 격리 조치하여 건강한 커뮤니티 생태계를 유지함
 * - 방법(How): 사용자 신고 누적 데이터와 필터링 결과를 바탕으로 게시물 숨김 및 영구 삭제 처리를 수행함
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trash2, 
  MessageSquare, 
  FileText, 
  Search,
  Heart,
  Eye,
  EyeOff,
  Calendar,
  User as UserIcon,
  Loader2,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getErrorMessage } from '@/utils/errorMessage';
import DOMPurify from 'dompurify';
import UserProfileModal from './components/UserProfileModal';
import ModalImageSlider from '@/pages/community/tweet/components/ModalImageSlider';

type ContentType = 'post' | 'comment';

interface ModerationItem {
  id: string;
  parent_id: string;
  content: string;
  image_urls: string | string[] | null;
  created_at: string;
  author_id: string;
  nickname: string;
  avatar_url: string | null;
  email: string;
  content_type: ContentType;
  stats: {
    likes: number;
    replies: number;
    views: number;
  };
  is_hidden: boolean;
  total_count: number;
}

interface AdminProfile {
  id: string;
  profile_id: string;
  nickname: string;
  avatar_url: string | null;
  email: string;
  country: string | null;
  country_name?: string;
  country_flag_url?: string;
  user_id?: string;
  is_admin?: boolean;
}

const AdminContentModeration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ContentType>('post');
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem('admin-mod-search') || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ModerationItem[]>([]);
  const [page, setPage] = useState(() => {
    return Number(sessionStorage.getItem('admin-mod-page')) || 1;
  });
  const [perPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const restoredRef = useRef(false);
  const isInitialMount = useRef(true);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  
  // 사용자 프로필 상세 모달 상태 관리
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 미디어(이미지) 확대 보기 모달 상태 관리
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [mediaIndex, setMediaIndex] = useState(0);

  // 콘텐츠 영구 삭제 확인 모달 상태 관리
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 검색어 디바운싱 및 캐싱 — API 과호출 방지 및 상태 영속성 확보
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      sessionStorage.setItem('admin-mod-search', searchTerm);
      
      // Reset page when search changes, EXCEPT on initial restore/mount
      if (!isInitialMount.current && restoredRef.current) {
        setPage(1);
      }
      isInitialMount.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 컴포넌트 마운트 초기화 — 진입 시 탭/검색어/페이지 번호 기본값 강제 설정
  useEffect(() => {
    setActiveTab('post');
    setSearchTerm('');
    setPage(1);
    fetchContent();
  }, []);

  // 브라우징 컨텍스트 영속화 — 현재 상태를 sessionStorage에 실시간 동기화하여 탐색 경험 유지
  useEffect(() => {
    sessionStorage.setItem('admin-mod-tab', activeTab);
    sessionStorage.setItem('admin-mod-page', page.toString());
    sessionStorage.setItem('admin-mod-search', searchTerm);
  }, [activeTab, page, searchTerm]);

  // 스크롤 위치 실시간 추적 — 메인 컨테이너 및 윈도우 스크롤 상태 이중 감시 (Cross-target Tracking)
  useEffect(() => {
    const scrollContainer = document.querySelector('main.overflow-y-auto') || document.querySelector('main');
    
    const handleScroll = () => {
      if (restoredRef.current) {
        // Track both window and internal container
        const mainScroll = scrollContainer ? scrollContainer.scrollTop : 0;
        const windowScroll = window.scrollY;
        
        if (mainScroll > 0) {
          sessionStorage.setItem('admin-mod-scroll', mainScroll.toString());
          sessionStorage.setItem('admin-mod-scroll-target', 'main');
        } else if (windowScroll > 0) {
          sessionStorage.setItem('admin-mod-scroll', windowScroll.toString());
          sessionStorage.setItem('admin-mod-scroll-target', 'window');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      scrollContainerRef.current = scrollContainer as HTMLElement;
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [content]); // Re-attach when content changes

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('get_admin_moderation_content', {
        p_type: activeTab,
        p_search: debouncedSearch,
        p_page: page,
        p_per_page: perPage
      });

      if (error) throw error;
      
      setContent(data || []);
      setTotalItems((data as any)?.[0]?.total_count || 0);
    } catch (error: unknown) {
      console.error('Error fetching moderation content:', getErrorMessage(error));
      toast.error('콘텐츠를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page, perPage]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // 데이터 로드 후 스크롤 복구 — 비동기 렌더링 완료 시점의 뷰포트 위치 보정 로직
  useEffect(() => {
    if (!loading && !restoredRef.current) {
      const savedScroll = sessionStorage.getItem('admin-mod-scroll');
      const savedTarget = sessionStorage.getItem('admin-mod-scroll-target') || 'main';
      
      if (!savedScroll || savedScroll === '0') {
        restoredRef.current = true;
        return;
      }

      if (content.length > 0) {
        const scrollContainer = scrollContainerRef.current || document.querySelector('main');
        let attempts = 0;
        
        const tryScroll = () => {
          const scrollY = parseInt(savedScroll, 10);
          
          if (savedTarget === 'window') {
            window.scrollTo({ top: scrollY, behavior: 'auto' });
          } else if (scrollContainer) {
            scrollContainer.scrollTo({ top: scrollY, behavior: 'auto' });
          }
          
          const currentPos = savedTarget === 'window' ? window.scrollY : (scrollContainer?.scrollTop || 0);
          
          if (Math.abs(currentPos - scrollY) < 5 || attempts > 35) {
            // Confirm twice
            setTimeout(() => {
              if (savedTarget === 'window') window.scrollTo(0, scrollY);
              else if (scrollContainer) scrollContainer.scrollTo(0, scrollY);
              restoredRef.current = true;
            }, 100);
          } else {
            attempts++;
            setTimeout(tryScroll, 100);
          }
        };
        tryScroll();
      } else {
        restoredRef.current = true;
      }
    }
  }, [loading, content]);

  // 페이지네이션 이동 시 뷰포트 최상단 초기화 — 내부 네비게이션 일관성 확보
  useEffect(() => {
    if (restoredRef.current) {
      const scrollContainer = scrollContainerRef.current || document.querySelector('main');
      if (scrollContainer) {
        scrollContainer.scrollTo(0, 0);
      }
      window.scrollTo(0, 0);
    }
  }, [page]);

  const openDeleteModal = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await (supabase as any).rpc('delete_moderation_content', {
        p_type: activeTab,
        p_id: itemToDelete
      });

      if (error) throw error;
      
      toast.success(activeTab === 'post' ? '게시글이 삭제되었습니다.' : '댓글이 삭제되었습니다.');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchContent();
    } catch (error: unknown) {
      console.error('Error deleting content:', getErrorMessage(error));
      toast.error('삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleToggleHide = async (item: ModerationItem) => {
    const originalStatus = !!item.is_hidden;
    const newHiddenStatus = !originalStatus;
    
    // 1. 낙관적 업데이트(Optimistic Update) — 즉각적인 UI 반응성 제공을 위한 선행 상태 변경
    setContent(prev => prev.map((c: any) => c.id === item.id ? { ...c, is_hidden: newHiddenStatus } : c));
    
    try {
      const { error } = await (supabase as any).rpc('toggle_content_hidden', {
        p_type: item.content_type,
        p_id: item.id,
        p_hidden: newHiddenStatus
      });

      if (error) {
        // 2. 예외 처리 — API 서버 통신 실패 시 이전 상태로 정밀 롤백 수행
        setContent(prev => prev.map((c: any) => c.id === item.id ? { ...c, is_hidden: originalStatus } : c));
        throw error;
      }
      
      toast.success(newHiddenStatus ? '콘텐츠가 숨김 처리되었습니다.' : '숨김 처리가 해제되었습니다.');
    } catch (error: unknown) {
      console.error('Error toggling hide status:', getErrorMessage(error));
      toast.error('상태 변경 중 오류가 발생했습니다. DB 연동 상태를 확인해 주세요.');
    }
  };

  const handleUserClick = async (item: ModerationItem) => {
    try {
      // 기본 식별 데이터 로드 — 대상 사용자 기본 정보 수신
      const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('id', item.author_id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        toast.error('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 국가 데이터 계층 로드 — 데이터 무결성 확보를 위한 별도 검색 (Relation Error 방지)
      let countryData = null;
      if (profile.country) {
        const { data: country } = await (supabase.from('countries') as any)
          .select('name, flag_url')
          .or(`id.eq.${profile.country},iso_code.eq.${profile.country}`)
          .maybeSingle();
        countryData = country;
      }

      // 전역 모달 주입용 데이터 정규화 및 매핑
      const enrichedUser: AdminProfile = {
        ...profile,
        profile_id: profile.id,
        country_name: countryData?.name || profile.country,
        country_flag_url: countryData?.flag_url
      };
      
      setSelectedUser(enrichedUser);
      setShowProfileModal(true);
    } catch (error: unknown) {
      console.error('Error fetching user profile:', getErrorMessage(error));
      toast.error('사용자 정보를 불러오는 데 실패했습니다.');
    }
  };

  const handleContentClick = (item: ModerationItem, type: ContentType) => {
    // 페이지 이탈 직전 런타임 브라우징 컨텍스트 강제 저장
    const scrollContainer = scrollContainerRef.current || document.querySelector('main');
    const mainScroll = scrollContainer ? scrollContainer.scrollTop : 0;
    const windowScroll = window.scrollY;

    if (mainScroll > 0) {
      sessionStorage.setItem('admin-mod-scroll', mainScroll.toString());
      sessionStorage.setItem('admin-mod-scroll-target', 'main');
    } else {
      sessionStorage.setItem('admin-mod-scroll', windowScroll.toString());
      sessionStorage.setItem('admin-mod-scroll-target', 'window');
    }

    sessionStorage.setItem('admin-mod-tab', activeTab);
    sessionStorage.setItem('admin-mod-page', page.toString());
    sessionStorage.setItem('admin-mod-search', searchTerm);

    if (type === 'post') {
      if (!item.id) {
        toast.error('게시글 ID가 유효하지 않습니다.');
        return;
      }
      navigate(`/sns/${item.id}`, { 
        state: { 
          fromAdmin: true,
          scrollKey: Date.now()
        } 
      });
    } else if (type === 'comment') {
      // 데이터 무결성 검증 — 참조 식별자(parent_id) 누락 시 예외 처리 및 탐색 차단
      if (!item.parent_id) {
        toast.error('원문 게시글 정보를 찾을 수 없습니다. (SQL 마이그레이션 적용이 필요합니다)');
        return;
      }

      // 댓글 상세 이동 전략 — 원문 게시글로 이동 후 특정 식별자(ID) 강조 및 앵커 스크롤 수행
      navigate(`/sns/${item.parent_id}`, { 
        state: { 
          fromAdmin: true, 
          highlightCommentId: item.id,
          scrollType: 'comment',
          scrollKey: Date.now()
        } 
      });
    }
  };

  const handleMediaClick = (images: string[], index: number) => {
    setMediaList(images);
    setMediaIndex(index);
    setShowMediaModal(true);
  };

  const parseImages = (urls: string | string[] | null, htmlContent?: string): string[] => {
    let images: string[] = [];
    if (Array.isArray(urls)) {
      images = [...urls];
    } else if (typeof urls === 'string' && urls.trim()) {
      try {
        if (urls.trim().startsWith('[') || urls.trim().startsWith('{')) {
          const parsed = JSON.parse(urls) as string | string[] | { [key: string]: string };
          if (Array.isArray(parsed)) images = [...images, ...parsed.filter((u: any) => typeof u === 'string')];
          else if (typeof parsed === 'string') images.push(parsed);
        } else {
          images.push(urls);
        }
      } catch {
        images.push(urls);
      }
    }

    if (htmlContent) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const docImgs = Array.from(doc.querySelectorAll('img')).map(img => img.src);
      images = [...images, ...docImgs];
    }
    return Array.from(new Set(images.filter(img => typeof img === 'string' && img.startsWith('http'))));
  };

  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">게시물 및 댓글 관리</h1>
          <p className="text-muted-foreground mt-1">부적절한 게시글 및 댓글을 모니터링하고 관리합니다.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="내용 또는 닉네임 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-secondary border-2 border-gray-300 dark:border-gray-500 rounded-xl text-sm w-full md:w-72 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
        <div className="flex border-b border-gray-300 dark:border-gray-600">
          <button
            onClick={() => { setActiveTab('post'); setPage(1); }}
            className={`flex items-center gap-2 px-8 py-4 font-bold transition-all border-b-2 ${
              activeTab === 'post' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <FileText size={18} />
            게시글 (Posts)
          </button>
          <button
            onClick={() => { setActiveTab('comment'); setPage(1); }}
            className={`flex items-center gap-2 px-8 py-4 font-bold transition-all border-b-2 ${
              activeTab === 'comment' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <MessageSquare size={18} />
            댓글 (Comments)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p className="font-medium">콘텐츠 로딩 중...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-lg">표시할 콘텐츠가 없습니다.</p>
              <p className="text-sm">검색어나 탭을 다시 확인해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {content.map((item) => (
                <motion.div 
                  key={item.id} 
                  layout
                  className={`group relative bg-secondary border-2 ${
                    item.is_hidden 
                      ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/5' 
                      : 'border-gray-300 dark:border-gray-500'
                  } rounded-2xl overflow-hidden transition-all hover:shadow-md cursor-pointer active:scale-[0.995] p-4 md:p-5`}
                  onClick={() => handleContentClick(item, item.content_type)}
                >
                  <div className="flex gap-4 items-start">
                    {/* Left: Avatar */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(item);
                      }}
                      className="shrink-0 group/avatar mt-1"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-transparent group-hover/avatar:border-primary transition-all">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={item.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                            {item.nickname.charAt(0)}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="font-bold text-foreground hover:underline cursor-pointer truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(item);
                            }}
                          >
                            {item.nickname}
                          </span>
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">@{item.email?.split('@')[0] || 'user'}</span>
                          <span className="text-xs text-muted-foreground shrink-0">· {format(new Date(item.created_at), 'MM월 dd일 HH:mm', { locale: ko })}</span>
                          {item.is_hidden && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
                              숨김 처리됨
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHide(item);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 ${
                              item.is_hidden 
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 hover:bg-amber-500 hover:text-white'
                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 hover:bg-blue-500 hover:text-white'
                            } rounded-xl text-xs font-bold transition-all shadow-sm`}
                            title={item.is_hidden ? '숨김 해제' : '숨김 처리'}
                          >
                             {item.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                             {item.is_hidden ? '숨기기 해제' : '숨기기'}
                           </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(item.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Trash2 size={14} /> 삭제
                          </button>
                        </div>
                      </div>

                      <div className="group/content py-1">
                        {/* Content Text */}
                        <div 
                          className="text-foreground text-sm leading-relaxed mb-3 break-words whitespace-pre-wrap moderation-content-area group-hover/content:text-primary transition-colors"
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(item.content, { FORBID_TAGS: ['img'] }) 
                          }}
                        />

                        {/* Content Images (Simplified for Moderation) */}
                        {(() => {
                          const images = parseImages(item.image_urls, item.content);
                          if (images.length === 0) return null;
                          return (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                              {images.map((img: string, idx: number) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt="attachment" 
                                  className="h-24 min-w-[6rem] max-w-[12rem] rounded-xl object-cover border-2 border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform cursor-pointer" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMediaClick(images, idx);
                                  }}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Heart size={14} className={item.stats.likes > 0 ? 'text-rose-500 fill-rose-500' : ''} />
                          {item.stats.likes.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <MessageSquare size={14} />
                          {item.stats.replies.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Eye size={14} />
                          {item.stats.views.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-gray-300 dark:border-gray-600 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            전체 <span className="text-foreground">{totalItems.toLocaleString()}</span>개 중 {content.length > 0 ? (page-1)*perPage+1 : 0} - {Math.min(page*perPage, totalItems)} 표시
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1 px-4 text-sm font-bold">
              <span className="text-primary">{page}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span>{totalPages || 1}</span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal Integration */}
      {selectedUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={selectedUser as any}
        />
      )}

      {/* Media Detail Modal Integration */}
      {showMediaModal && (
        <ModalImageSlider
          allImages={mediaList}
          modalIndex={mediaIndex}
          setModalIndex={setMediaIndex}
          onClose={() => setShowMediaModal(false)}
        />
      )}

      {/* Premium Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border dark:border-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">콘텐츠를 삭제하시겠습니까?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                {activeTab === 'post' 
                  ? '이 게시글을 삭제하면 해당 게시글에 달린 모든 댓글과 통계 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'
                  : '이 댓글을 삭제하면 복구할 수 없습니다. 삭제를 진행하시겠습니까?'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl font-bold transition-all order-2 sm:order-1 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 order-1 sm:order-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '영구 삭제'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentModeration;
