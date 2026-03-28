import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Image, Plus, Edit, Trash2, Eye, EyeOff, BarChart3, Search,
  ExternalLink, Calendar, Monitor, Loader2, X, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Upload } from 'lucide-react';

// ────────────────── Types ──────────────────
interface MarketingBanner {
  id: string;
  title: string;
  banner_type: 'top_bar' | 'popup' | 'hero_slide' | 'inline_card';
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  target_page: string;
  target_audience: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const BANNER_TYPES = [
  { value: 'top_bar', label: '상단 바', icon: '📢', ratio: '텍스트 위주 (이미지 불필요)', size: '-' },
  { value: 'popup', label: '팝업', icon: '💬', ratio: '16:9', size: '800 × 450px' },
  { value: 'hero_slide', label: '히어로 슬라이드', icon: '🖼️', ratio: '32:9 (권장)', size: '1920 × 540px' },
  { value: 'inline_card', label: '인라인 카드', icon: '📋', ratio: '4:3', size: '600 × 450px' },
];

const TARGET_PAGES = [
  { value: 'all', label: '전체 페이지' },
  { value: 'study', label: '학습 페이지' },
  { value: 'goods', label: '굿즈샵' },
  { value: 'sns', label: '커뮤니티' },
  { value: 'landing', label: '랜딩 페이지' },
];

const TARGET_AUDIENCES = [
  { value: 'all', label: '전체 사용자' },
  { value: 'guest', label: '비로그인 사용자' },
  { value: 'free', label: '무료 회원' },
  { value: 'subscriber', label: '구독자' },
];

// ────────────────── Component ──────────────────
const AdminBannerManager = () => {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MarketingBanner | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    banner_type: 'top_bar' as MarketingBanner['banner_type'],
    content: '',
    image_url: '',
    link_url: '',
    bg_color: '#6366f1',
    text_color: '#ffffff',
    target_page: 'all',
    target_audience: 'all',
    priority: 0,
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

  // ── Fetch ──
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_banners')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      console.error('Fetch banners error:', err);
      toast.error('배너 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // ── Form helpers ──
  const resetForm = () => {
    setForm({
      title: '',
      banner_type: 'top_bar',
      content: '',
      image_url: '',
      link_url: '',
      bg_color: '#6366f1',
      text_color: '#ffffff',
      target_page: 'all',
      target_audience: 'all',
      priority: 0,
      starts_at: '',
      ends_at: '',
      is_active: true,
    });
    setEditingBanner(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (banner: MarketingBanner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      banner_type: banner.banner_type,
      content: banner.content || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      bg_color: banner.bg_color,
      text_color: banner.text_color,
      target_page: banner.target_page,
      target_audience: banner.target_audience,
      priority: banner.priority,
      starts_at: banner.starts_at ? banner.starts_at.slice(0, 16) : '',
      ends_at: banner.ends_at ? banner.ends_at.slice(0, 16) : '',
      is_active: banner.is_active,
    });
    setShowForm(true);
  };

  // ── Save (Create / Update) ──
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('배너 제목을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        banner_type: form.banner_type,
        content: form.content.trim() || null,
        image_url: form.image_url.trim() || null,
        link_url: form.link_url.trim() || null,
        bg_color: form.bg_color,
        text_color: form.text_color,
        target_page: form.target_page,
        target_audience: form.target_audience,
        priority: form.priority,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('marketing_banners')
          .update(payload)
          .eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('배너가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('marketing_banners')
          .insert(payload);
        if (error) throw error;
        toast.success('배너가 생성되었습니다.');
      }

      setShowForm(false);
      resetForm();
      fetchBanners();
    } catch (err: any) {
      console.error('Save banner error:', err);
      toast.error('배너 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active ──
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('marketing_banners')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentActive } : b));
      toast.success(!currentActive ? '배너가 활성화되었습니다.' : '배너가 비활성화되었습니다.');
    } catch (err: any) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const { error } = await supabase
        .from('marketing_banners')
        .delete()
        .eq('id', deleteModal);
      if (error) throw error;
      setBanners(prev => prev.filter(b => b.id !== deleteModal));
      toast.success('배너가 삭제되었습니다.');
      setDeleteModal(null);
    } catch (err: any) {
      toast.error('삭제에 실패했습니다.');
    }
  };

  // ── Filtered list ──
  const filtered = banners.filter(b => {
    const matchSearch = !searchTerm || b.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || b.banner_type === filterType;
    return matchSearch && matchType;
  });

  // ── Status helpers ──
  const getBannerStatus = (banner: MarketingBanner) => {
    if (!banner.is_active) return { label: '비활성', color: 'text-gray-400 bg-gray-100 dark:bg-zinc-800' };
    const now = new Date();
    if (banner.starts_at && new Date(banner.starts_at) > now) return { label: '예약됨', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' };
    if (banner.ends_at && new Date(banner.ends_at) < now) return { label: '만료됨', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' };
    return { label: '노출 중', color: 'text-primary bg-primary/10' };
  };

  const getTypeLabel = (type: string) => BANNER_TYPES.find(t => t.value === type);

  const getCTR = (banner: MarketingBanner) => {
    if (!banner.view_count) return '0.0';
    return ((banner.click_count / banner.view_count) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">배너 관리</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">마케팅 배너와 팝업을 관리합니다</p>
          </div>
          <button
            onClick={openCreateForm}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            새 배너 만들기
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '전체 배너', value: banners.length, icon: Image },
            { label: '노출 중', value: banners.filter(b => b.is_active).length, icon: Eye },
            { label: '총 클릭 수', value: banners.reduce((s, b) => s + b.click_count, 0).toLocaleString(), icon: ExternalLink },
            { label: '총 노출 수', value: banners.reduce((s, b) => s + b.view_count, 0).toLocaleString(), icon: BarChart3 },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/5 shadow-lg shadow-black/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <stat.icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="배너 제목으로 검색..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">모든 타입</option>
              {BANNER_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Banner List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 font-medium">
              {searchTerm || filterType !== 'all' ? '검색 조건에 맞는 배너가 없습니다.' : '등록된 배너가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(banner => {
              const status = getBannerStatus(banner);
              const typeInfo = getTypeLabel(banner.banner_type);
              return (
                <div
                  key={banner.id}
                  className="group p-6 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-lg shadow-black/5 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Preview */}
                    <div
                      className="w-full lg:w-48 h-24 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
                      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
                    >
                      {banner.image_url ? (
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="px-3 text-center text-xs leading-tight opacity-90">
                          {banner.content || banner.title}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{banner.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Monitor size={12} /> {typeInfo?.icon} {typeInfo?.label}
                        </span>
                        <span>대상: {TARGET_PAGES.find(p => p.value === banner.target_page)?.label}</span>
                        {banner.starts_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} />
                            {format(new Date(banner.starts_at), 'MM/dd')}
                            {banner.ends_at && ` ~ ${format(new Date(banner.ends_at), 'MM/dd')}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-center shrink-0">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">노출</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{banner.view_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">클릭</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{banner.click_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">CTR</p>
                        <p className="text-sm font-bold text-primary">{getCTR(banner)}%</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className={`p-2.5 rounded-xl transition-colors ${banner.is_active ? 'hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500' : 'hover:bg-primary/10 text-gray-400 hover:text-primary'}`}
                        title={banner.is_active ? '비활성화' : '활성화'}
                      >
                        {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => openEditForm(banner)}
                        className="p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-colors"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteModal(banner.id)}
                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────── Create/Edit Modal (Portal) ────── */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 p-8 pb-4 border-b border-gray-100 dark:border-white/5 rounded-t-[2rem] z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {editingBanner ? '배너 수정' : '새 배너 만들기'}
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 pt-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">배너 제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: 봄맞이 20% 할인 이벤트"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none text-sm"
                />
              </div>

              {/* Type + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">배너 타입 *</label>
                  <select
                    value={form.banner_type}
                    onChange={e => setForm(f => ({ ...f, banner_type: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 outline-none text-sm"
                  >
                    {BANNER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">상태</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-colors ${form.is_active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border border-transparent'}`}
                  >
                    {form.is_active ? '✅ 활성' : '⏸️ 비활성'}
                  </button>
                </div>
              </div>

              {/* 타입별 권장 비율 가이드 */}
              {(() => {
                const typeInfo = BANNER_TYPES.find(t => t.value === form.banner_type);
                if (!typeInfo || typeInfo.value === 'top_bar') return null;
                return (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                    <div
                      className="shrink-0 rounded-lg bg-blue-200 dark:bg-blue-500/20 border-2 border-blue-300 dark:border-blue-500/30"
                      style={{
                        width: form.banner_type === 'hero_slide' ? 63 : form.banner_type === 'popup' ? 48 : 40,
                        height: form.banner_type === 'hero_slide' ? 27 : form.banner_type === 'popup' ? 27 : 30,
                      }}
                    />
                    <div>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        권장 비율: {typeInfo.ratio}
                      </p>
                      <p className="text-[10px] text-blue-500 dark:text-blue-400">
                        권장 크기: {typeInfo.size}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* ═══ 상단 바 전용: 텍스트 + 색상 ═══ */}
              {form.banner_type === 'top_bar' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">배너 텍스트 *</label>
                    <input
                      type="text"
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="예: 🎉 봄맞이 전상품 20% 할인 중!"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none text-sm"
                    />
                  </div>

                  {/* 링크 URL */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">링크 URL</label>
                    <input
                      type="url"
                      value={form.link_url}
                      onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                      placeholder="클릭 시 이동할 URL (선택)"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 outline-none text-sm"
                    />
                  </div>

                  {/* 색상 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">배경색</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <input type="text" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">글자색</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <input type="text" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* 상단 바 미리보기 */}
                  {form.content && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">미리보기</label>
                      <div
                        className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                        style={{ backgroundColor: form.bg_color, color: form.text_color }}
                      >
                        <span>📢</span>
                        <span>{form.content}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ═══ 이미지 배너 전용: 팝업 / 히어로 / 인라인 ═══ */}
              {form.banner_type !== 'top_bar' && (
                <>
                  {/* 이미지 업로드 */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">배너 이미지 *</label>
                    <div className="mb-2">
                      <label className={`flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                        uploading ? 'border-primary/40 bg-primary/5' : 'border-gray-200 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('파일 크기는 5MB 이하로 제한됩니다.');
                              return;
                            }
                            setUploading(true);
                            try {
                              const ext = file.name.split('.').pop();
                              const fileName = `banners/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
                              const { error: upErr } = await supabase.storage.from('products').upload(fileName, file);
                              if (upErr) throw upErr;
                              const { data } = supabase.storage.from('products').getPublicUrl(fileName);
                              setForm(f => ({ ...f, image_url: data.publicUrl }));
                              toast.success('이미지가 업로드되었습니다.');
                            } catch (err: any) {
                              console.error('Upload error:', err);
                              toast.error('이미지 업로드에 실패했습니다.');
                            } finally {
                              setUploading(false);
                              e.target.value = '';
                            }
                          }}
                        />
                        {uploading ? (
                          <Loader2 size={18} className="animate-spin text-primary" />
                        ) : (
                          <Upload size={18} className="text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-500">
                          {uploading ? '업로드 중...' : '클릭하여 이미지 업로드 (5MB 이하)'}
                        </span>
                      </label>
                    </div>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="또는 이미지 URL 직접 입력"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 outline-none text-sm"
                    />
                  </div>

                  {/* 링크 URL */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">링크 URL</label>
                    <input
                      type="url"
                      value={form.link_url}
                      onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                      placeholder="클릭 시 이동할 URL (선택)"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-primary/20 outline-none text-sm"
                    />
                  </div>

                  {/* 이미지 미리보기 (비율 반영) */}
                  {form.image_url && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        미리보기 — {BANNER_TYPES.find(t => t.value === form.banner_type)?.ratio}
                      </label>
                      <div
                        className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 group"
                        style={{
                          aspectRatio: form.banner_type === 'hero_slide' ? '21/9' : form.banner_type === 'popup' ? '16/9' : '4/3',
                        }}
                      >
                        <img
                          src={form.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {editingBanner ? '수정 완료' : '배너 생성'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ────── Delete Confirmation Modal (Portal) ────── */}
      {deleteModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative z-10 border border-white/10 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">배너 삭제</h3>
            <p className="text-sm text-gray-500 mb-8">삭제된 배너는 복구할 수 없습니다. 정말 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                삭제
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminBannerManager;
