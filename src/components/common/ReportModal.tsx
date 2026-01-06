import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal'; // 공용 모달 사용
import TextAreaField from '@/components/auth/TextAreaField'; // 공용 Textarea 사용
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ReportTargetType = 'tweet' | 'reply' | 'user' | 'chat';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  previewContent?: React.ReactNode; // UI에 표시할 미리보기 컨텐츠
  additionalInfo?: string; // DB description에 추가할 텍스트
  onSuccess?: () => void;
  metadata?: Record<string, any>;
  contentSnapshot?: any; // Snapshot of the content at time of reporting
}

const REPORT_REASONS = [
  'spam',
  'abuse',
  'harmful',
  'inappropriate',
  'other',
] as const;

type ReasonOption = {
  value: string;
  label: string;
};

// React-Select Custom Indicator
const CustomDropdownIndicator = (props: any) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </components.DropdownIndicator>
  );
};

export default function ReportModal({ isOpen, onClose, targetType, targetId, previewContent, additionalInfo, onSuccess, metadata, contentSnapshot }: ReportModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 다크 모드 감지 (CountrySelect와 동일 방식)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // React-Select Styles (CountrySelect 스타일 차용)
  const customStyles: StylesConfig<ReasonOption, false> = {
    control: (provided, state) => {
      const baseBorder = state.isFocused
        ? 'var(--ara-primary)'
        : isDark
          ? '#D1D5DB'
          : '#D1D5DB';
      return {
        ...provided,
        minHeight: 48,
        height: 48,
        padding: '0 12px',
        borderRadius: 14,
        border: `1px solid ${baseBorder}`,
        borderColor: baseBorder,
        width: '100%',
        boxShadow: state.isFocused ? '0 0 0 3px var(--ara-ring)' : 'none',
        backgroundColor: state.isDisabled 
          ? (isDark ? 'hsl(var(--secondary) / 0.5)' : '#f3f4f6') 
          : (isDark ? 'hsl(var(--secondary))' : '#fff'),
        color: isDark ? '#9CA3AF' : '#111827',
        '&:hover': {
          borderColor: state.isFocused ? 'var(--ara-primary)' : '#D1D5DB',
        },
      };
    },
    valueContainer: provided => ({
      ...provided,
      height: 48,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    }),
    input: provided => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: isDark ? '#9CA3AF' : '#111827',
    }),
    singleValue: provided => ({
      ...provided,
      color: isDark ? '#9CA3AF' : '#111827',
    }),
    indicatorsContainer: provided => ({
      ...provided,
      height: 48,
      color: isDark ? '#9CA3AF' : provided.color,
    }),
    dropdownIndicator: provided => ({
      ...provided,
      padding: 8,
      color: isDark ? '#9CA3AF' : provided.color,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: provided => ({
      ...provided,
      zIndex: 9999, // Modal 위에 떠야 함
      backgroundColor: isDark ? 'hsl(var(--secondary))' : '#fff',
      border: `1px solid ${isDark ? '#D1D5DB' : '#E5E7EB'}`,
      borderRadius: 12,
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDark ? 'hsl(var(--primary) / 0.22)' : 'rgba(59,130,246,0.12)'
        : state.isFocused
          ? isDark ? 'hsl(var(--primary) / 0.12)' : 'rgba(59,130,246,0.08)'
          : 'transparent',
      color: isDark ? '#9CA3AF' : '#111827',
      cursor: 'pointer',
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
  };

  const reasonOptions: ReasonOption[] = REPORT_REASONS.map(r => ({
    value: r,
    label: t(`report.reasons.${r}`, r === 'other' ? '기타 (직접 입력)' : r),
  }));

  const selectedOption = reasonOptions.find(o => o.value === reason) || null;

  const handleSubmit = async () => {
    if (!user) return;
    if (!reason) {
      toast.error(t('report.select_reason', '신고 사유를 선택해주세요.'));
      return;
    }
    if (reason === 'other' && !description.trim()) {
      toast.error(t('report.enter_description', '상세 사유를 입력해주세요.'));
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const finalDescription = targetType === 'chat' 
        ? (reason === 'other' ? description : null) // 채팅 신고는 additionalInfo 포함 안 함
        : [
            (reason === 'other' ? description : ''), 
            additionalInfo
          ].filter(Boolean).join('\n\n---\n');

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: profile.id,
          target_type: targetType,
          target_id: targetId,
          reason,
          description: finalDescription || null,
          status: 'pending',
          metadata: metadata || null,
          content_snapshot: contentSnapshot || null, // Persist snapshot
        });

      if (error) throw error;

      toast.success(t('report.success', '신고가 접수되었습니다.'));
      onSuccess?.();
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error(t('common.error', '오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('report.title', '신고하기')}
      className="max-w-md h-auto" // 높이 자동 조정
      contentClassName="p-6 overflow-visible" // Select 메뉴 잘림 방지 (overflow-visible)
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('report.desc', '신고 사유를 선택해 주세요. 타당한 사유가 없을 경우 처리가 지연될 수 있습니다.')}
        </p>

        {/* Preview Content (e.g. Selected Chat Messages) */}
        {previewContent && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto border border-gray-100 dark:border-gray-700">
            {previewContent}
          </div>
        )}

        {/* Reason Select (Floating Label) */}
        <div className="relative">
          <Select
            options={reasonOptions}
            value={selectedOption}
            onChange={(opt: SingleValue<ReasonOption>) => setReason(opt?.value || '')}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onMenuOpen={() => setIsFocused(true)}
            onMenuClose={() => setIsFocused(false)}
            styles={customStyles}
            components={{ DropdownIndicator: CustomDropdownIndicator }}
            placeholder=" "
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            classNamePrefix="react-select"
          />
          <label
            className={`absolute left-3 px-1 bg-white dark:bg-secondary rounded transition-all pointer-events-none
              ${
                isFocused || reason
                  ? '-top-2 text-xs text-primary'
                  : 'top-3 text-sm text-gray-400'
              }
            `}
          >
            {t('report.reason_label', '사유 선택')}
          </label>
        </div>

        {/* Description Textarea with Animation */}
        <AnimatePresence>
          {reason === 'other' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-2"> {/* Padding to prevent cut-off during animation */}
                <TextAreaField
                  id="report-desc"
                  label={t('report.description_label', '상세 내용')}
                  value={description}
                  onChange={setDescription}
                  placeholder={t('report.description_placeholder', '신고 사유를 자세히 적어주세요.')}
                  maxLength={300} // 공백 포함 300자 (한글/영문 충분)
                  rows={4}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 mt-8">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-500 rounded-full hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
          >
            {t('common.cancel', '취소')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/80 dark:bg-gray-900 hover:dark:bg-gray-800 rounded-full font-medium transition disabled:opacity-60"
          >
            {isSubmitting ? t('common.submitting', '제출 중...') : t('common.submit', '제출')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
