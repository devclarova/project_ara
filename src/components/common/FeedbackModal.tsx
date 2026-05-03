import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import type { DatabaseWithRPC } from '@/types/supabase-augment';

type FeedbackInsert = DatabaseWithRPC['public']['Tables']['feedback']['Insert'];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoTriggered?: boolean;
}

type FeedbackArea = '전체 서비스' | '학습' | '단어장' | '커뮤니티' | '프로필' | '설정' | '구독·결제' | '굿즈샵' | '번역 기능' | '챗봇' | '기타';
type FeedbackCategory = 'UI/UX' | '기능 개선' | '버그 신고' | '학습 콘텐츠' | '번역 품질' | '기타';

const AREAS: FeedbackArea[] = ['전체 서비스', '학습', '단어장', '커뮤니티', '프로필', '설정', '구독·결제', '굿즈샵', '번역 기능', '챗봇', '기타'];
const CATEGORIES: FeedbackCategory[] = ['UI/UX', '기능 개선', '버그 신고', '학습 콘텐츠', '번역 품질', '기타'];

const PATH_TO_LABEL: Record<string, string> = {
  '/': '랜딩 페이지',
  '/study': '학습',
  '/study/voca': '단어장',
  '/community': '커뮤니티',
  '/profile': '프로필',
  '/settings': '설정',
  '/subscription': '구독/결제',
  '/goods': '굿즈샵',
  '/admin': '관리자',
  '/notifications': '알림',
};

export default function FeedbackModal({ isOpen, onClose, isAutoTriggered = false }: FeedbackModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [selectedArea, setSelectedArea] = useState<FeedbackArea | ''>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | ''>('');
  const [content, setContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPageLabel = (path: string) => {
    // 가장 구체적인 매칭을 위해 길이를 기준으로 정렬하여 체크
    const sortedPaths = Object.keys(PATH_TO_LABEL).sort((a, b) => b.length - a.length);
    
    // Exact match first for root
    if (path === '/') return PATH_TO_LABEL['/'];
    
    const matchedPath = sortedPaths.find(p => p !== '/' && path.startsWith(p));
    return matchedPath ? PATH_TO_LABEL[matchedPath] : path;
  };

  const currentPagePath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pageLabel = getPageLabel(currentPagePath);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedArea('');
        setSelectedRating(null);
        setSelectedCategory('');
        setContent('');
        setIsSuccess(false);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 10 || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload: FeedbackInsert = {
        user_id: user.id,
        page_path: currentPagePath,
        area: selectedArea || null,
        category: selectedCategory || null,
        rating: selectedRating,
        content: content.trim()
      };
      const { error: insertError } = await (supabase as any)
        .from('feedback')
        .insert([payload]);

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Feedback submission error:', err);
      setError(t('common.feedback_error', '피드백 전송 중 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[480px]">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-[#00BFA5]/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-[#00BFA5]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('common.feedback_thanks_title', '소중한 의견 감사합니다!')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('common.feedback_thanks_desc', '보내주신 피드백을 바탕으로 더 나은 ARA를 만들겠습니다.')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 px-8 py-2.5 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white font-semibold rounded-xl transition-colors"
          >
            {t('common.close', '닫기')}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('common.feedback_modal_title', '더 나은 ARA를 위해')}
      className="max-w-[480px]"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Current Page Tag */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('common.current_page', '현재 위치')}</span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-medium text-gray-600 dark:text-gray-400">
            {pageLabel}
          </span>
        </div>

        {/* Area Selection Dropdown */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {t('common.feedback_area_select', '어떤 페이지 또는 기능에 대한 의견인가요?')}
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value as FeedbackArea)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-[#00BFA5] focus:ring-1 focus:ring-[#00BFA5] outline-none transition-all appearance-none"
          >
            <option value="">{t('common.select_area', '선택해주세요')}</option>
            {AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {t('common.feedback_rating', 'ARA의 이번 서비스 경험은 어떠셨나요?')}
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star 
                  size={28} 
                  className={cn(
                    "transition-colors",
                    (selectedRating || 0) >= star 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-200 dark:text-gray-700"
                  )} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {t('common.feedback_category', '카테고리')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-[#00BFA5] focus:ring-1 focus:ring-[#00BFA5] outline-none transition-all appearance-none"
          >
            <option value="">{t('common.select_category', '선택해주세요')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Content Textarea */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('common.feedback_content', '상세 내용')} <span className="text-red-500">*</span>
            </label>
            <span className={cn(
              "text-[10px] font-medium",
              content.length >= 10 ? "text-[#00BFA5]" : "text-gray-400"
            )}>
              {content.length} / 1000
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            placeholder={t('common.feedback_placeholder', '의견을 10자 이상 남겨주세요. 더 나은 서비스를 만드는 데 큰 도움이 됩니다.')}
            className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-[#00BFA5] focus:ring-1 focus:ring-[#00BFA5] outline-none transition-all resize-none"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {t('common.cancel', '취소')}
            </button>
            <button
              type="submit"
              disabled={isLoading || content.length < 10}
              className="flex-[2] py-3 bg-[#00BFA5] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#00BFA5]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                t('common.submit', '제출하기')
              )}
            </button>
          </div>

          {isAutoTriggered && (
            <p className="text-center text-[11px] text-gray-400 animate-in fade-in duration-700 delay-300">
              {t('common.feedback_guide_floating', '오른쪽 하단 버튼으로 언제든 피드백을 남길 수 있어요')}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
