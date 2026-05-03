import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  Search,
  RotateCw,
  ArrowRight,
  Filter,
  Calendar,
  Clock,
  User,
  Star,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorMessage';
import FeedbackActionModal, { type Feedback } from './components/FeedbackActionModal';
import UserProfileModal from './components/UserProfileModal';

// Extend Feedback type to include user profile info if joined
type FeedbackWithUser = Feedback & {
  profiles?: {
    user_id: string;
    nickname: string;
    avatar_url: string | null;
  } | null;
};

const PATH_TO_LABEL: Record<string, string> = {
  '/': '랜딩 페이지',
  '/sns': '커뮤니티 피드',
  '/community': '커뮤니티',
  '/chat': '채팅',
  '/login': '로그인',
  '/signin': '로그인',
  '/register': '회원가입',
  '/signup': '회원가입',
  '/profile': '프로필',
  '/profile/': '프로필',
  '/settings': '설정',
  '/subscription': '구독/결제',
  '/goods': '굿즈샵',
  '/goods/': '굿즈 상세',
  '/study': '학습',
  '/study/': '학습 상세',
  '/study/voca': '단어장',
  '/admin': '관리자',
  '/notifications': '알림',
};

const getPageLabel = (path: string | null) => {
  if (!path) return '-';
  const sortedPaths = Object.keys(PATH_TO_LABEL).sort((a, b) => b.length - a.length);
  if (path === '/') return PATH_TO_LABEL['/'];
  const matchedPath = sortedPaths.find(p => p !== '/' && path.startsWith(p));
  return matchedPath ? PATH_TO_LABEL[matchedPath] : path;
};

const AdminFeedback = () => {
  const { t } = useTranslation();
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Available categories for filter dropdown (could be dynamic, but static for now based on what we have)
  const categories = ['all', 'bug', 'feature', 'ui', 'content', 'other'];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get total count for pagination
      let countQuery = (supabase.from('feedback') as any)
        .select('*', { count: 'exact', head: true });
      
      if (filterStatus !== 'all') {
        countQuery = countQuery.eq('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        countQuery = countQuery.eq('category', filterCategory);
      }
      if (filterRating !== 'all') {
        countQuery = countQuery.eq('rating', parseInt(filterRating));
      }

      const { count, error: countError } = await countQuery;
      if (countError) {
        console.warn('Count query failed:', countError);
      }
      setTotalCount(count || 0);

      // 2. Get paginated data
      console.log('query params:', { page, filterStatus, filterCategory, filterRating });
      console.log('range:', (page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
      let query = (supabase.from('feedback') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating));
      }

      const { data, error } = await query;
      console.log('feedback data:', data);
      console.log('feedback error:', error);
      if (error) throw error;
      
      const feedbacksData = data || [];
      
      // 사용자 프로필 수동 매핑 — 조인 에러 방지 및 다른 관리자 페이지 패턴 준수
      const userIds = Array.from(new Set(feedbacksData.map((f: any) => f.user_id).filter(Boolean)));
      
      let enhancedFeedbacks = feedbacksData;
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await (supabase.from('profiles') as any)
          .select('user_id, nickname, avatar_url')
          .in('user_id', userIds);
          
        if (!profilesError && profiles) {
          enhancedFeedbacks = feedbacksData.map((f: any) => ({
            ...f,
            profiles: profiles.find((p: any) => p.user_id === f.user_id) || null
          }));
        }
      }
      
      setFeedbacks(enhancedFeedbacks);
    } catch (error: unknown) {
      console.error('Error fetching feedbacks:', getErrorMessage(error));
      toast.error('피드백 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterRating, page, debouncedSearch]); // Note: local debounced search filtering handled in client if needed, but here we just rely on DB for now. (Actually, search is hard to do across all text fields easily without RPC, so we will do client side filter for search term if needed, or just let DB do exact match. For now, we will do basic DB fetch and client-side search text filtering if it's small, but pagination makes client search tricky. We will use ilike if we had it, but we can't easily. So we will just fetch and then filter locally? No, let's keep it simple.)

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleOpenModal = async (feedback: FeedbackWithUser) => {
    // unread 상태면 모달에도 바로 read로 전달
    const updatedFeedback = (feedback.status === 'unread' || !feedback.status)
      ? { ...feedback, status: 'read' as const }
      : feedback;

    setSelectedFeedback(updatedFeedback);
    setIsModalOpen(true);
    
    // unread 상태면 read로 업데이트
    if (feedback.status === 'unread') {
      try {
        console.log('feedback status:', feedback.status);
        console.log('updating to read...');
        const { error } = await (supabase as any)
          .from('feedback')
          .update({ status: 'read' })
          .eq('id', feedback.id);
        
        console.log('update error:', error);
        
        if (error) throw error;
        
        // 로컬 상태도 업데이트
        setFeedbacks(prev => prev.map(f => 
          f.id === feedback.id ? { ...f, status: 'read' } : f
        ));
      } catch (error) {
        console.error('Error updating feedback status:', error);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col p-4 md:p-6 gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap [word-break:keep-all]">
             <MessageSquare className="text-primary" /> 피드백 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            사용자가 남긴 소중한 피드백을 확인하고 답변을 등록하세요.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Status Filter */}
          <div className="flex bg-secondary border border-border rounded-xl p-1 shadow-sm">
            {(['all', 'unread', 'read', 'replied'] as const).map((status) => (
                <button 
                    key={status}
                    onClick={() => { setFilterStatus(status); setPage(1); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize
                        ${filterStatus === status 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                >
                {status === 'all' ? '전체' : 
                 status === 'unread' ? '안읽음' : 
                 status === 'read' ? '읽음' : '답변완료'}
                </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-muted-foreground hover:text-foreground outline-none"
          >
            <option value="all">모든 카테고리</option>
            <option value="bug">버그</option>
            <option value="feature">기능 제안</option>
            <option value="ui">UI/UX</option>
            <option value="content">콘텐츠</option>
            <option value="other">기타</option>
          </select>

          {/* Rating Filter */}
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value as any); setPage(1); }}
            className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-muted-foreground hover:text-foreground outline-none"
          >
            <option value="all">모든 별점</option>
            <option value="5">★★★★★ (5점)</option>
            <option value="4">★★★★☆ (4점)</option>
            <option value="3">★★★☆☆ (3점)</option>
            <option value="2">★★☆☆☆ (2점)</option>
            <option value="1">★☆☆☆☆ (1점)</option>
          </select>

          <button 
             onClick={fetchFeedbacks}
             className="p-2 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground shadow-sm ml-auto"
             title="새로고침"
          >
            <RotateCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border border-border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        {loading && feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <RotateCw className="animate-spin" size={32} />
                <p className="text-sm">피드백 데이터를 불러오는 중입니다...</p>
            </div>
        ) : (
        <div className="flex flex-col h-full">
            <div className="overflow-auto flex-1"> 
            <table className="w-full min-w-[1200px] text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm border-b border-border">
                <tr>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">상태</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">제출 일시</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">작성자</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">카테고리</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">별점</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">내용 (미리보기)</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">발생 페이지/영역</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-[100px]">관리</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {feedbacks
                    .filter(f => !debouncedSearch || f.content.toLowerCase().includes(debouncedSearch.toLowerCase()))
                    .map((feedback) => (
                    <tr 
                        key={feedback.id} 
                        className={`hover:bg-background/50 transition-colors group cursor-pointer ${feedback.status === 'unread' || !feedback.status ? 'bg-background/30 font-medium' : ''}`}
                        onClick={() => handleOpenModal(feedback)}
                    >
                    <td className="py-4 px-6 whitespace-nowrap">
                        {(!feedback.status || feedback.status === 'unread') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-900/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> 안읽음
                        </span>
                        )}
                        {feedback.status === 'read' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30">
                            <Eye size={10} className="fill-current" /> 읽음
                        </span>
                        )}
                        {feedback.status === 'replied' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30">
                            <CheckCircle size={10} className="fill-current" /> 답변완료
                        </span>
                        )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleString('ko-KR', { 
                            year: '2-digit', month: '2-digit', day: '2-digit', 
                            hour: '2-digit', minute: '2-digit', hour12: false 
                        }).replace(/\. /g, '.').replace(/\.$/, '')}
                    </td>
                    <td className="py-4 px-6">
                        <div 
                           className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                           onClick={(e) => {
                               e.stopPropagation();
                               if (feedback.profiles) {
                                   setSelectedUser(feedback.profiles);
                                   setShowUserProfileModal(true);
                               }
                           }}
                        >
                            <div className="w-6 h-6 rounded-full bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                {feedback.profiles?.avatar_url ? (
                                    <img src={feedback.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={12} className="text-muted-foreground"/>
                                )}
                            </div>
                            <span className="text-sm truncate max-w-[80px]">
                                {feedback.profiles?.nickname || '익명'}
                            </span>
                        </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                        <span className="capitalize text-[11px] font-bold px-2 py-1 rounded-md border shadow-sm bg-background">
                            {feedback.category || '기타'}
                        </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < (feedback.rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}>
                                ★
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <p className="text-sm text-foreground/90 truncate max-w-[300px]">
                            {feedback.content.length > 50 ? `${feedback.content.substring(0, 50)}...` : feedback.content}
                        </p>
                    </td>
                    <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={feedback.page_path || '-'}>
                                    {getPageLabel(feedback.page_path)}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px] pl-0.5" title={feedback.area || '-'}>
                                {feedback.area || '-'}
                            </span>
                        </div>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(feedback); }}
                            className="px-3 py-1.5 text-primary hover:text-white hover:bg-primary rounded-lg transition-all border border-primary/20 hover:border-primary shadow-sm active:scale-95 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                            상세 <ArrowRight size={12} />
                        </button>
                    </td>
                    </tr>
                ))}
                {feedbacks.length === 0 && !loading && (
                    <tr>
                        <td colSpan={8} className="py-20 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-3 opacity-50">
                                <CheckCircle size={48} strokeWidth={1.5} />
                                <p className="text-lg font-medium">피드백 내역이 없습니다</p>
                            </div>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/50">
                    <span className="text-xs text-muted-foreground">
                        총 {totalCount}개 중 {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, totalCount)}
                    </span>
                    <div className="flex gap-1">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 text-sm border border-border rounded-md hover:bg-background disabled:opacity-50"
                        >
                            이전
                        </button>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 text-sm border border-border rounded-md hover:bg-background disabled:opacity-50"
                        >
                            다음
                        </button>
                    </div>
                </div>
            )}
        </div>
        )}
      </div>

      <FeedbackActionModal 
        isOpen={isModalOpen} 
        feedback={selectedFeedback} 
        onClose={handleModalClose} 
        onResolve={() => {
            fetchFeedbacks();
        }} 
      />

      <UserProfileModal 
        isOpen={showUserProfileModal} 
        onClose={() => setShowUserProfileModal(false)} 
        user={selectedUser} 
      />
    </div>
  );
};

export default AdminFeedback;
