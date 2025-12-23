import React, { useState } from 'react';
import { Search, Edit, Trash2, Eye, EyeOff, ChevronDown, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminStudyManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<number | null>(null);

  // Mock data with visibility state
  const [studies, setStudies] = useState([
    {
      id: 1,
      title: 'Breaking Bad - Season 1',
      category: 'Drama',
      episodes: 7,
      status: 'active',
      visible: true,
      createdAt: '2024-01-15',
      views: 1234,
    },
    {
      id: 2,
      title: 'Friends - Season 1',
      category: 'Comedy',
      episodes: 24,
      status: 'active',
      visible: true,
      createdAt: '2024-01-10',
      views: 2341,
    },
    {
      id: 3,
      title: 'Game of Thrones - Season 1',
      category: 'Fantasy',
      episodes: 10,
      status: 'draft',
      visible: false,
      createdAt: '2024-01-20',
      views: 567,
    },
  ]);

  const handleToggleVisibility = (id: number) => {
    setStudies(studies.map(study => 
      study.id === id ? { ...study, visible: !study.visible } : study
    ));
    const study = studies.find(s => s.id === id);
    toast.success(study?.visible ? t('admin.study_hidden') : t('admin.study_visible'));
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/study/edit/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedStudy(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedStudy) {
      setStudies(studies.filter(s => s.id !== selectedStudy));
      toast.success(t('admin.study_deleted'));
      setDeleteModalOpen(false);
      setSelectedStudy(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">학습 콘텐츠 관리</h1>
          <p className="text-muted-foreground mt-1">등록된 학습 콘텐츠를 관리합니다</p>
        </div>
        <button
          onClick={() => navigate('/admin/study/upload')}
          className="w-full md:w-auto px-4 py-2 bg-primary hover:bg-primary-600 dark:bg-primary dark:hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <BookOpen size={18} />
          새 콘텐츠 등록
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-secondary rounded-xl border-2 border-gray-300 dark:border-gray-500 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="draft">작성중</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select className="appearance-none px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground">
              <option value="all">전체 카테고리</option>
              <option value="drama">드라마</option>
              <option value="comedy">코미디</option>
              <option value="fantasy">판타지</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-secondary rounded-xl border-2 border-gray-300 dark:border-gray-500 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted border-b border-gray-300 dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">제목</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">카테고리</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">에피소드</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">상태</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">조회수</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">표시</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">등록일</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {studies.map((study) => (
              <tr key={study.id} className="hover:bg-muted dark:hover:bg-accent700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{study.title}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground">{study.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground">{study.episodes}개</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      study.status === 'active'
                        ? 'bg-emerald-100 dark:bg-primary-900/30 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {study.status === 'active' ? '활성' : '작성중'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground">{study.views.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleVisibility(study.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      study.visible ? 'bg-primary dark:bg-primary' : 'bg-muted '
                    }`}
                    title={study.visible ? '숨기기' : '표시하기'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-muted transition-transform ${
                        study.visible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={14} />
                    {study.createdAt}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(study.id)}
                      className="p-2 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(study.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">총 {studies.length}개 항목</span>
        <div className="flex gap-2">
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            이전
          </button>
          <button className="px-3 py-2 bg-primary dark:bg-primary text-white rounded-lg">1</button>
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            2
          </button>
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            다음
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-2">학습 콘텐츠 삭제</h3>
            <p className="text-muted-foreground mb-6">
              정말로 이 학습 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedStudy(null);
                }}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudyManagement;
