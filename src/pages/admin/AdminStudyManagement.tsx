/**
 * 관리자 학습 콘텐츠 매니저 (Admin Study Management):
 * - 목적(Why): 학습 비디오 리소스, 대본 분절 데이터 및 단어장 세트의 상태를 한눈에 통제하기 위함
 * - 방법(How): 복합 필터(난이도, 카테고리) 기반의 데이터 조회와 하위 에셋 일괄 삭제 무결성 처리를 수행함
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Edit, Trash2, Eye, EyeOff, ChevronDown, Calendar, BookOpen, 
  Star, StarOff, RefreshCw, ChevronLeft, ChevronRight, Loader2,
  Film, BarChart3, EyeIcon, ImageIcon, AlertCircle, X, FileText, Tag, Upload, Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────
interface VideoData {
  id: number;
  categories: string | null;
  contents: string | null;
  episode: string | null;
  level: string | null;
  scene: string | null;
  runtime: number | null;
  video_url: string | null;
  image_url: string | null;
  runtime_bucket: string | null;
  video_start_time: number | null;
  video_end_time: number | null;
}

interface StudyItem {
  id: number;
  title: string;
  category: string | null;
  short_description: string | null;
  poster_image_url: string | null;
  is_featured: boolean;
  is_hidden: boolean;
  required_plan: string;
  created_at: string;
  video: VideoData[];
}

const PER_PAGE = 10;
const ALL_CATEGORIES = ['전체', '드라마', '영화', '예능', '음악'];
const ALL_LEVELS = ['전체', '초급', '중급', '고급'];

// ─── Component ───────────────────────────────────────────────
const AdminStudyManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 메인 콘텐츠 리스트 및 통계 데이터 상태 관리
  const [studies, setStudies] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);

  // 검색, 필터링 및 페이지네이션 제어 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');
  const [page, setPage] = useState(1);

  // 모달 제어 상태 — 상세 미리보기 및 삭제 확약 레이어 관리
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);
  const [previewStudy, setPreviewStudy] = useState<StudyItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'basic' | 'source' | 'content'>('basic');
  const [previewWords, setPreviewWords] = useState<any[]>([]);
  const [previewNotes, setPreviewNotes] = useState<any[]>([]);
  const [previewDataLoading, setPreviewDataLoading] = useState(false);

  // ─── Fetch Data ────────────────────────────────────────────
  // 학습 콘텐츠 목록 수신 — 검색/카테고리/난이도 복합 필터링 및 고성능 페이지네이션 적용
  const fetchStudies = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;

      // Determine if we need inner join for filtering
      const needsVideoFilter = filterCategory !== '전체' || filterLevel !== '전체';

      let query = supabase
        .from('study')
        .select(needsVideoFilter ? '*, video!inner(*)' : '*, video(*)', { count: 'exact' })
        .order('id', { ascending: false });

      // Search
      if (searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      // Category filter (on video table)
      if (filterCategory !== '전체') {
        query = query.eq('video.categories', filterCategory);
      }

      // Level filter (on video table)
      if (filterLevel !== '전체') {
        query = query.eq('video.level', filterLevel);
      }

      // Paginate
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('학습 목록 로드 실패:', error);
        toast.error('학습 목록을 불러오지 못했습니다.');
        return;
      }

      setStudies((data ?? []) as StudyItem[]);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('학습 목록 로드 오류:', err);
      toast.error('학습 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterCategory, filterLevel]);

  // 추천 콘텐츠 통계 지표 별도 수신 — 대시보드 요약 정보 동시성 확보
  const fetchStats = useCallback(async () => {
    const { count } = await supabase
      .from('study')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true);
    setFeaturedCount(count ?? 0);
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 모달 활성화 시 배경 레이아웃 고정 — 스크롤 잠금을 통한 UX 안정성 확보
  useEffect(() => {
    if (previewModalOpen || deleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewModalOpen, deleteModalOpen]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // 추천(Featured) 상태 실시간 전환 — 메인 큐레이션 노출 정책 제어
  const handleToggleFeatured = async (study: StudyItem) => {
    const newValue = !study.is_featured;
    const { error } = await supabase
      .from('study')
      .update({ is_featured: newValue })
      .eq('id', study.id);

    if (error) {
      console.error('Featured toggle error:', error);
      toast.error(`추천 상태 변경에 실패했습니다: ${error.message}`);
      return;
    }

    setStudies(prev => prev.map(s => 
      s.id === study.id ? { ...s, is_featured: newValue } : s
    ));
    setFeaturedCount(prev => newValue ? prev + 1 : prev - 1);
    toast.success(newValue ? '추천 콘텐츠로 설정되었습니다.' : '추천이 해제되었습니다.', {
      style: { background: '#00BFA5', color: '#fff' }
    });
  };

  // 콘텐츠 가시성(Hidden) 제어 및 낙관적 UI 업데이트(Optimistic Update) 적용
  const handleToggleHidden = async (study: StudyItem) => {
    const newValue = !study.is_hidden;
    
    // Optimistic UI Update
    setStudies(prev => prev.map(s => 
      s.id === study.id ? { ...s, is_hidden: newValue } : s
    ));

    const { error } = await supabase
      .from('study')
      .update({ is_hidden: newValue })
      .eq('id', study.id);

    if (error) {
      console.error('Hidden toggle error:', error);
      toast.error(`숨김 상태 변경 실패: ${error.message}`);
      // Rollback
      setStudies(prev => prev.map(s => 
        s.id === study.id ? { ...s, is_hidden: !newValue } : s
      ));
      return;
    }

    toast.success(newValue ? '콘텐츠가 숨김 처리되었습니다.' : '콘텐츠가 다시 노출됩니다.', {
      style: { background: '#00BFA5', color: '#fff' }
    });
  };

  const handleDeleteClick = (study: StudyItem) => {
    setSelectedStudy(study);
    setDeleteModalOpen(true);
  };

  // 콘텐츠 완전 폐기 — 연관 엔티티(단어, 문화노트, 영상) 통합 삭제 트랜잭션 수행
  const handleDeleteConfirm = async () => {
    if (!selectedStudy) return;
    setDeleteLoading(true);

    try {
      // Delete related data first
      await supabase.from('word').delete().eq('study_id', selectedStudy.id);
      // culture_note 2단계: contents → note 순서 삭제
      const { data: existingNotes } = await supabase.from('culture_note').select('id').eq('study_id', selectedStudy.id);
      if (existingNotes && existingNotes.length > 0) {
        const noteIds = existingNotes.map(n => n.id);
        await supabase.from('culture_note_contents').delete().in('culture_note_id', noteIds);
      }
      await supabase.from('culture_note').delete().eq('study_id', selectedStudy.id);
      await supabase.from('video').delete().eq('study_id', selectedStudy.id);
      
      const { error } = await supabase.from('study').delete().eq('id', selectedStudy.id);

      if (error) {
        toast.error('삭제에 실패했습니다: ' + error.message);
        return;
      }

      toast.success(`"${selectedStudy.title}" 콘텐츠가 삭제되었습니다.`);
      setDeleteModalOpen(false);
      setSelectedStudy(null);
      fetchStudies();
      fetchStats();
    } catch (err) {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 콘텐츠 상세 미리보기 로드 — 연관 데이터(단어/노트/자막) 비동기 병렬 수신
  const handlePreviewClick = async (study: StudyItem) => {
    setPreviewStudy(study);
    setPreviewModalOpen(true);
    setPreviewTab('basic');
    setPreviewDataLoading(true);

    try {
      // 1. 단어 데이터
      const { data: words } = await supabase.from('word').select('*').eq('study_id', study.id).order('id');
      setPreviewWords(words || []);

      // 2. 문화 노트 데이터
      const { data: notes } = await supabase.from('culture_note').select('*').eq('study_id', study.id).order('id');
      if (notes && notes.length > 0) {
        const noteIds = notes.map(n => n.id);
        const { data: noteContents } = await supabase.from('culture_note_contents').select('*').in('culture_note_id', noteIds);
        const mapped = notes.map(n => ({
          ...n,
          contentRows: (noteContents || []).filter(c => c.culture_note_id === n.id)
        }));
        setPreviewNotes(mapped);
      } else {
        setPreviewNotes([]);
      }
    } catch (err) {
      console.error('Preview data fetch error:', err);
    } finally {
      setPreviewDataLoading(false);
    }
  };

  // ─── Derived ───────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const getFirstVideo = (study: StudyItem): VideoData | null => {
    return study.video && study.video.length > 0 ? study.video[0] : null;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch { return dateStr; }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* 관리자 헤더 — 페이지 정체성 확립 및 전역 액션(등록/새로고침) 버튼 배치 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">학습 콘텐츠 관리</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">등록된 학습 콘텐츠를 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStudies()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="새로고침"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate('/admin/study/upload')}
            className="px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">새 콘텐츠 등록</span>
            <span className="sm:hidden">등록</span>
          </button>
        </div>
      </div>

      {/* 현황 요약 배너 — 인벤토리 핵심 지표 실시간 모니터링 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film size={14} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">전체 콘텐츠</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">{totalCount}</span>
        </div>
        <div className="bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">추천 콘텐츠</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">{featuredCount}</span>
        </div>
        <div className="hidden sm:block bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-emerald-500" />
            <span className="text-xs text-muted-foreground">현재 페이지</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">{page} / {totalPages || 1}</span>
        </div>
      </div>

      {/* 검색 및 정밀 필터링 인터페이스 — 다차원 조건을 통한 콘텐츠 조회 가속화 */}
      <div className="bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="제목으로 검색..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {/* Category Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="w-full sm:w-auto appearance-none px-3 py-2 pr-8 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground outline-none cursor-pointer"
              >
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c === '전체' ? '전체 카테고리' : c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            </div>

            {/* Level Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterLevel}
                onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
                className="w-full sm:w-auto appearance-none px-3 py-2 pr-8 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground outline-none cursor-pointer"
              >
                {ALL_LEVELS.map(l => (
                  <option key={l} value={l}>{l === '전체' ? '전체 난이도' : l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">불러오는 중...</span>
        </div>
      ) : studies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen size={40} className="mb-3 opacity-30" />
          <p className="text-sm">등록된 학습 콘텐츠가 없습니다.</p>
          <button
            onClick={() => navigate('/admin/study/upload')}
            className="mt-3 text-sm text-primary hover:underline"
          >
            새 콘텐츠 등록하기
          </button>
        </div>
      ) : (
        <>
          {/* 데스크탑 데이터 그리드 — 상세 속성 가시성 확보를 위한 테이블 레이아웃 */}
          <div className="hidden md:block bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">콘텐츠</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">카테고리</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">에피소드</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">난이도</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">추천</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">등록일</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {studies.map((study) => {
                    const video = getFirstVideo(study);
                    return (
                      <tr key={study.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Content info with thumbnail */}
                        <td className="px-4 py-3 cursor-pointer" onClick={() => handlePreviewClick(study)}>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-gray-200 dark:border-gray-700">
                              {study.poster_image_url ? (
                                <img 
                                  src={study.poster_image_url} 
                                  alt={study.title} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon size={14} className="text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-foreground truncate max-w-[200px] lg:max-w-[300px]">
                                {study.title}
                              </div>
                              {study.short_description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px] lg:max-w-[300px] mt-0.5">
                                  {study.short_description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[85px] whitespace-nowrap">
                          {video?.categories ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              {video.categories}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground min-w-[100px] break-keep">
                          {video?.episode || '-'}
                        </td>
                        <td className="px-4 py-3 min-w-[80px] whitespace-nowrap">
                          {video?.level ? (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              (video.level === 'Easy' || video.level === '초급') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                              (video.level === 'Normal' || video.level === '중급') ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                              'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {video.level === 'Easy' || video.level === '초급' ? '초급' : 
                               video.level === 'Normal' || video.level === '중급' ? '중급' : '고급'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center min-w-[95px] whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleToggleFeatured(study)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                study.is_featured 
                                  ? 'text-[#00BFA5] bg-[#00BFA5]/10 hover:bg-[#00BFA5]/20' 
                                  : 'text-muted-foreground/40 hover:text-[#00BFA5] hover:bg-muted'
                              }`}
                              title={study.is_featured ? '추천 해제' : '추천 설정'}
                            >
                              {study.is_featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                            </button>
                            <button
                              onClick={() => handleToggleHidden(study)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                study.is_hidden 
                                  ? 'text-[#00F0FF] bg-[#00BFA5]/10 hover:bg-[#00BFA5]/20' 
                                  : 'text-muted-foreground/40 hover:text-[#00BFA5] hover:bg-muted'
                              }`}
                              title={study.is_hidden ? '표시하기' : '숨기기'}
                            >
                              {study.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {formatDate(study.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/study/edit/${study.id}`)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(study)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 모바일 카드 리스트 — 터치 기반 탐색 및 가독성 최적화 스택 레이아웃 */}
          <div className="md:hidden space-y-3">
            {studies.map((study) => {
              const video = getFirstVideo(study);
              return (
                <div key={study.id} className="bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {study.poster_image_url ? (
                        <img 
                          src={study.poster_image_url} 
                          alt={study.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePreviewClick(study)}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground max-w-[200px] truncate">{study.title}</span>
                        {study.required_plan === 'premium' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00BFA5]/20 text-[#00F0FF]">
                            👑 Premium
                          </span>
                        )}
                        {study.required_plan === 'basic' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100/50 text-blue-600">
                            Basic
                          </span>
                        )}
                        {video?.categories && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            {video.categories}
                          </span>
                        )}
                        {video?.level && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            (video.level === 'Easy' || video.level === '초급') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                            (video.level === 'Normal' || video.level === '중급') ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {video.level === 'Easy' || video.level === '초급' ? '초급' : 
                             video.level === 'Normal' || video.level === '중급' ? '중급' : '고급'}
                          </span>
                        )}
                        {study.is_hidden && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            숨김
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{formatDate(study.created_at)}</div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFeatured(study)}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                          study.is_featured 
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                            : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
                        }`}
                      >
                        {study.is_featured ? <Star size={12} /> : <StarOff size={12} />}
                      </button>
                      <button
                        onClick={() => handleToggleHidden(study)}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                          study.is_hidden 
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                            : 'text-muted-foreground hover:text-primary hover:bg-muted'
                        }`}
                      >
                        {study.is_hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePreviewClick(study)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="미리보기"
                      >
                        <EyeIcon size={14} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/study/edit/${study.id}`)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(study)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 하단 페이지네이션 — 대량 인벤토리 탐색을 위한 동적 컨트롤러 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            총 {totalCount}개 중 {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, totalCount)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 데이터 폐기 최종 확인 레이어 — 물리적 삭제 전 무결성 손실 방지용 확약 모달 */}
      {deleteModalOpen && selectedStudy && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">학습 콘텐츠 삭제</h3>
            <p className="text-sm text-muted-foreground mb-1">
              <strong className="text-foreground">"{selectedStudy.title}"</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              이 콘텐츠와 관련된 모든 영상, 자막, 단어, 문화노트 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedStudy(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전역 미리보기 모달 — 사용자 페이지(SNS/Study)와 동일한 형태의 결과값 검증 환경 제공 */}
      {previewModalOpen && previewStudy && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-[100] p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-background rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col scale-in animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground truncate text-sm sm:text-base leading-tight">{previewStudy.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">콘텐츠 미리보기</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-all active:scale-90 hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Hero Image Section */}
              <div className="relative w-full aspect-video bg-muted overflow-hidden sm:rounded-b-2xl shadow-inner">
                {previewStudy.poster_image_url ? (
                  <img src={previewStudy.poster_image_url} alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/50">
                    <ImageIcon size={48} />
                    <span className="text-xs font-bold mt-2 uppercase tracking-tighter">등록된 이미지가 없습니다</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {previewStudy.is_featured && (
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-lg shadow-amber-400/30">
                      <Star size={10} fill="currentColor" /> 추천 콘텐츠
                    </span>
                  )}
                  {previewStudy.is_hidden && (
                    <span className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-lg shadow-red-500/30">
                      <EyeOff size={10} /> 숨김 처리
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-black uppercase tracking-wider">
                    ID: {previewStudy.id}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Custom Tab Navigation */}
                <div className="flex p-1 bg-secondary/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 sticky top-2 z-20 shadow-sm">
                  {[
                    { id: 'basic', label: '기본 정보', icon: FileText },
                    { id: 'source', label: '영상 소스', icon: Video },
                    { id: 'content', label: '학습 콘텐츠', icon: BookOpen }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPreviewTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        previewTab === tab.id 
                          ? 'bg-background text-primary shadow-sm border border-gray-100 dark:border-gray-800' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                      }`}
                    >
                      <tab.icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content Areas */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {previewTab === 'basic' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-secondary/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 transition-colors">
                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5 flex items-center gap-1">
                            <Tag size={10} /> 카테고리
                          </div>
                          <p className="text-sm font-bold text-foreground">{getFirstVideo(previewStudy)?.categories || '-'}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/20 transition-colors">
                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5 flex items-center gap-1">
                            <BarChart3 size={10} /> 난이도
                          </div>
                          <p className="text-sm font-bold text-foreground">{getFirstVideo(previewStudy)?.level || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">학습 상세 설명</div>
                        <p className="text-sm text-foreground leading-relaxed font-medium whitespace-pre-wrap">
                          {previewStudy.short_description || '등록된 설명이 없습니다.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-1">
                        <Calendar size={12} /> 등록 일시: {new Date(previewStudy.created_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  )}

                  {previewTab === 'source' && (
                    <div className="space-y-4">
                      <div className="bg-primary/[0.03] rounded-2xl p-5 border border-primary/10 shadow-sm group">
                        <div className="text-xs font-black text-primary mb-4 flex items-center gap-2 uppercase tracking-widest">
                          <Film size={14} /> 영상 주소 및 설정 정보
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-tighter">시리즈/에피소드</span>
                            <span className="text-sm font-bold text-foreground">{getFirstVideo(previewStudy)?.episode || '-'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-tighter">장면 번호</span>
                            <span className="text-sm font-bold text-foreground">{getFirstVideo(previewStudy)?.scene || '-'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-tighter">총 재생 시간</span>
                            <span className="text-sm font-bold text-foreground">{getFirstVideo(previewStudy)?.runtime ? `${getFirstVideo(previewStudy)?.runtime}분` : '0분'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-tighter">학습 구간 설정</span>
                            <span className="text-sm font-bold text-foreground text-primary">
                              {getFirstVideo(previewStudy)?.video_start_time || 0}초 ~ {getFirstVideo(previewStudy)?.video_end_time || 0}초
                            </span>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-primary/5">
                          <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1.5 flex items-center gap-1">
                            <Upload size={10} /> 영상 소스 경로 (URL/Path)
                          </div>
                          <div className="text-xs p-3 bg-white dark:bg-black/20 rounded-lg border border-gray-100 dark:border-gray-800 break-all font-mono text-muted-foreground select-all">
                            {getFirstVideo(previewStudy)?.video_url || '등록된 소스 주소가 없습니다.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTab === 'content' && (
                    <div className="space-y-6">
                      {previewDataLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <Loader2 size={24} className="animate-spin text-primary" />
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">학습 상세 자료를 불러오는 중...</p>
                        </div>
                      ) : (
                        <>
                          {/* Culture Notes Summary */}
                          <div className="space-y-4">
                            <div className="text-[11px] font-black text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
                              <BookOpen size={14} className="text-primary" /> 문화 노트 ({previewNotes.length})
                            </div>
                            {previewNotes.length > 0 ? (
                              <div className="space-y-4">
                                {previewNotes.map((note, idx) => (
                                  <div key={idx} className="p-5 bg-secondary/30 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/20 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-extrabold text-sm text-primary group-hover:scale-105 transition-transform origin-left">{note.title || '제목 없음'}</h4>
                                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase shadow-sm">Note {idx + 1}</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground mb-2 leading-relaxed">{note.subtitle || '-'}</p>
                                    
                                    {note.contents && (
                                      <p className="text-[11px] text-muted-foreground/80 mb-3 italic leading-relaxed whitespace-pre-wrap bg-muted/30 p-2 rounded-lg">
                                        {note.contents}
                                      </p>
                                    )}

                                    {/* Culture Note Contents Rows */}
                                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                      {note.contentRows && note.contentRows.length > 0 ? (
                                        note.contentRows.map((row: any, i: number) => (
                                          <div key={i} className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{row.content_value}</p>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[10px] text-muted-foreground italic">상세 내용이 없습니다.</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                                <Search className="mx-auto mb-3 text-muted-foreground/30" size={32} />
                                <p className="text-xs text-muted-foreground font-medium">등록된 문화 노트가 없습니다.</p>
                              </div>
                            )}
                          </div>

                          {/* Words Summary */}
                          <div className="space-y-4 pt-4">
                            <div className="text-[11px] font-black text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
                              <FileText size={14} className="text-emerald-500" /> 핵심 단어 ({previewWords.length})
                            </div>
                            {previewWords.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {previewWords.map((w, idx) => (
                                  <div key={idx} className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 hover:border-emerald-500/20 transition-all">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-emerald-500/20">
                                        {idx + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-sm font-black text-foreground">{w.words}</span>
                                          {w.parts_of_speech && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">[{w.parts_of_speech}]</span>}
                                        </div>
                                        {w.pronunciation && <p className="text-[10px] text-muted-foreground italic">/{w.pronunciation}/</p>}
                                      </div>
                                    </div>
                                    <div className="pl-10 space-y-2">
                                      <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-emerald-50 dark:border-emerald-900/30">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase block mb-0.5 tracking-tighter">Meaning</span>
                                        <p className="text-xs font-bold text-foreground">{w.means}</p>
                                      </div>
                                      {w.example && (
                                        <div className="p-2 bg-white/50 dark:bg-black/10 rounded-lg border border-gray-100 dark:border-gray-800">
                                          <span className="text-[10px] text-muted-foreground font-black uppercase block mb-0.5 tracking-tighter">Example</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed italic">"{w.example}"</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                                <Search className="mx-auto mb-3 text-muted-foreground/30" size={32} />
                                <p className="text-xs text-muted-foreground font-medium">등록된 핵심 단어가 없습니다.</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Info / Links */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-amber-800 dark:text-amber-300">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    퀴즈, 상세 자막 및 실제 학습 화면은 사이트 메인 페이지에서 <span className="font-black underline underline-offset-2">사용자 모드</span>로 확인 가능합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-background/50 backdrop-blur-md flex gap-3">
              <button 
                onClick={() => setPreviewModalOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all border border-gray-200 dark:border-gray-700 active:scale-95 flex items-center justify-center gap-2"
              >
                닫기 (Close)
              </button>
              <button 
                onClick={() => {
                  setPreviewModalOpen(false);
                  navigate(`/admin/study/edit/${previewStudy.id}`);
                }}
                className="flex-[1.5] py-3 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transform active:-translate-y-0.5"
              >
                <Edit size={16} /> 상세 정보 수정하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStudyManagement;
