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

function ThemeSelect({ value, onChange, onClose, onSave, onCancel }: ThemeSelectProps) {
  const options = [
    { key: 'light', label: '라이트', icon: <Sun className="w-4 h-4" /> },
    { key: 'dark', label: '다크', icon: <Moon className="w-4 h-4" /> },
    { key: 'system', label: '시스템', icon: <Monitor className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex flex-col min-h-[420px]">
      {/* 상단 영역 */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">표시 테마</p>
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
                  'flex items-center gap-1.5 px-4 py-2 mb-2 rounded-lg transition-all duration-200 text-sm font-medium w-full h-12',
                  selected
                    ? 'bg-gradient-to-r from-primary/80 to-primary text-white shadow-md scale-[1.03]'
                    : 'text-gray-700 dark:text-gray-300 border border-transparent hover:bg-white/40 dark:hover:bg-gray-700/60',
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
      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-secondary px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="ghost" size="md" onClick={onCancel ?? onClose}>
          취소
        </Button>
        <Button type="submit" variant="primary" size="md" onSave={onSave}>
          저장
        </Button>
      </div>
    </div>
  );
}

export default ThemeSelect;
