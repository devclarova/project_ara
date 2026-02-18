import Button from '@/components/common/Buttons';
import type { Mode } from '@/types/settings';
import { Monitor, Moon, Sun } from 'lucide-react';

interface ThemeSelectProps {
  value: Mode; // ✅ 현재 테마값 (부모에서 내려줌)
  onChange: (mode: Mode) => void; // ✅ 클릭 시 부모 상태 업데이트
  onClose?: () => void; // 모달 닫기
  onSave?: () => void; // 저장
  onCancel?: () => void; // 취소
}

import { useTranslation } from 'react-i18next';

function ThemeSelect({ value, onChange, onClose, onSave, onCancel }: ThemeSelectProps) {
  const { t } = useTranslation();
  const options = [
    { key: 'light', label: t('settings.theme_options.light'), icon: <Sun className="w-4 h-4" /> },
    { key: 'dark', label: t('settings.theme_options.dark'), icon: <Moon className="w-4 h-4" /> },
    { key: 'system', label: t('settings.theme_options.system'), icon: <Monitor className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* 상단 영역 */}
      <div className="px-6 pt-5 pb-4 space-y-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.themeSelect', 'Select Theme')}
        </p>
        <div
          className="flex-col items-center gap-2 rounded-lg p-1.5"
          role="radiogroup"
          aria-label="테마 선택"
        >
          {options.map(({ key, label, icon }) => {
            const selected = value === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(key)}
                className={[
                  'flex items-center gap-2 px-4 py-3.5 mb-2 rounded-xl transition-all duration-200 text-sm font-medium w-full',
                  selected
                    ? 'bg-gradient-to-r from-primary/90 to-primary text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/60',
                ].join(' ')}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-secondary px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="ghost" size="md" onClick={onCancel ?? onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" size="md" onSave={onSave}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export default ThemeSelect;
