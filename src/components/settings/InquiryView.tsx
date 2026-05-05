import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MessageSquare, List, CheckCircle2, Clock, ChevronRight, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Select, { components, type SingleValue, type StylesConfig, type DropdownIndicatorProps } from 'react-select';

interface InquiryViewProps {
  onClose?: () => void;
}

type Tab = 'write' | 'list';

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: '서비스 이용', label: '서비스 이용' },
  { value: '결제/구독', label: '결제/구독' },
  { value: '계정', label: '계정' },
  { value: '버그 신고', label: '버그 신고' },
  { value: '기타', label: '기타' }
];

const CustomDropdownIndicator = (props: DropdownIndicatorProps<CategoryOption, false>) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-gray-400" />}
    </components.DropdownIndicator>
  );
};

export default function InquiryView({ onClose }: InquiryViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('write');
  
  // Form state
  const [category, setCategory] = useState<CategoryOption | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // List state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const customStyles: StylesConfig<CategoryOption, false> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: 46,
      borderRadius: '0.75rem',
      backgroundColor: isDark ? 'rgb(17 24 39)' : 'rgb(249 250 251)',
      border: `1px solid ${state.isFocused ? 'hsl(var(--primary))' : (isDark ? 'rgb(31 41 55)' : 'rgb(229 231 235)')}`,
      boxShadow: state.isFocused ? '0 0 0 1px var(--ara-primary)' : 'none',
      '&:hover': {
        borderColor: 'var(--ara-primary)',
      },
      padding: '0 8px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#f3f4f6' : '#111827',
      fontSize: '0.875rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? 'hsl(var(--secondary))' : '#fff',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '12px',
      marginTop: '8px',
      overflow: 'hidden',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'var(--ara-primary)' 
        : state.isFocused 
          ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') 
          : 'transparent',
      color: state.isSelected ? '#fff' : (isDark ? '#f3f4f6' : '#111827'),
      fontSize: '0.875rem',
      padding: '10px 16px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--ara-primary)',
        color: '#fff',
      },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  useEffect(() => {
    if (activeTab === 'list' && user) {
      fetchInquiries();
    }
  }, [activeTab, user]);

  const fetchInquiries = async () => {
    if (!user) return;
    setIsLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || content.length < 10 || !category || !subject) return;

    setIsSubmitting(true);
    try {
      // @ts-expect-error: Suppress type error for dynamic table 'inquiries'
      const { error } = await supabase.from('inquiries').insert([
        {
          user_id: user.id,
          category: category.value,
          subject,
          content,
          status: 'unread',
          page_path: window.location.pathname
        },
      ]);

      if (error) throw error;
      setIsSuccess(true);
      setCategory(null);
      setSubject('');
      setContent('');
      // 2초 후 탭 이동
      setTimeout(() => {
        setIsSuccess(false);
        setActiveTab('list');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
      alert(t('common.error', '오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('auth.login_needed', '로그인이 필요합니다')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          1:1 문의를 이용하시려면 로그인이 필요합니다.
        </p>
        <button
          onClick={() => window.location.href = '/signin'}
          className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          {t('auth.login', '로그인')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-secondary">
      {/* Header Info */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Mail size={16} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">koreara25@gmail.com</p>
            <p className="text-xs">메일로도 문의가 가능합니다.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => { setActiveTab('write'); setSelectedInquiry(null); }}
          className={cn(
            "flex-1 py-4 text-sm font-bold transition-colors border-b-2",
            activeTab === 'write' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare size={16} />
            문의 작성
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('list'); setSelectedInquiry(null); }}
          className={cn(
            "flex-1 py-4 text-sm font-bold transition-colors border-b-2",
            activeTab === 'list' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <List size={16} />
            내 문의 내역
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'write' ? (
          <div className="p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">문의가 접수되었습니다</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">빠른 시일 내에 답변 드리겠습니다.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">카테고리</label>
                  <Select
                    value={category}
                    onChange={(opt) => setCategory(opt)}
                    options={CATEGORIES}
                    styles={customStyles}
                    components={{ DropdownIndicator: CustomDropdownIndicator }}
                    placeholder="카테고리를 선택해주세요"
                    isSearchable={false}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">제목</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="제목을 입력해주세요"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[0.75rem] text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    style={{ outline: 'none' }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">내용</label>
                    <span className={cn("text-[10px]", content.length >= 10 ? "text-primary" : "text-gray-400")}>
                      {content.length} / 1000
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="문의 내용을 10자 이상 입력해주세요."
                    required
                    maxLength={1000}
                    className="w-full h-48 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                    style={{ outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || content.length < 10 || !category || !subject}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '문의 제출하기'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="p-0">
            {selectedInquiry ? (
              <div className="p-6 animate-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => setSelectedInquiry(null)}
                  className="text-sm text-primary font-bold mb-4 flex items-center gap-1"
                >
                  <i className="ri-arrow-left-s-line" /> 목록으로 돌아가기
                </button>
                
                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-500 rounded">
                        {selectedInquiry.category}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 text-[11px] font-bold rounded",
                        selectedInquiry.status === 'replied' 
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" 
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                      )}>
                        {selectedInquiry.status === 'replied' ? '답변완료' : '미답변'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedInquiry.subject}</h4>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(selectedInquiry.created_at), 'yyyy.MM.dd HH:mm')}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedInquiry.content}</p>
                  </div>

                  {selectedInquiry.admin_reply && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <i className="ri-reply-line font-bold" />
                        <span className="text-sm font-bold">운영팀 답변</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {selectedInquiry.replied_at && format(new Date(selectedInquiry.replied_at), 'yyyy.MM.dd HH:mm')}
                        </span>
                      </div>
                      <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/10">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">
                          {selectedInquiry.admin_reply}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {isLoadingList ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-gray-300" />
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                    <AlertCircle size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">문의 내역이 없습니다.</p>
                  </div>
                ) : (
                  inquiries.map(inquiry => (
                    <button
                      key={inquiry.id}
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[10px] font-bold",
                            inquiry.status === 'replied' ? "text-emerald-500" : "text-orange-500"
                          )}>
                            {inquiry.status === 'replied' ? '답변완료' : '미답변'}
                          </span>
                          <span className="text-[10px] text-gray-400">{inquiry.category}</span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">
                          {inquiry.subject}
                        </h5>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {format(new Date(inquiry.created_at), 'yyyy.MM.dd')}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
