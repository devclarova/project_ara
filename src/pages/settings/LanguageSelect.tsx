import Button from '@/components/common/Buttons';
import type { Lang } from '@/types/settings';

interface LanguageSelectProps {
  value: Lang; // ✅ 현재 선택값 (부모에서 내려줌)
  onChange: (lang: Lang) => void; // ✅ 옵션 클릭 시 부모 상태 업데이트
  onClose?: () => void; // 모달 닫기
  onSave?: () => void; // 저장(부모에서 최종 적용)
  onCancel?: () => void; // 취소(부모에서 원복)
}

function LanguageSelect({ value, onChange, onClose, onSave, onCancel }: LanguageSelectProps) {
  const options: { code: Lang; label: string }[] = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
  ];

  return (
    <div className="flex flex-col min-h-[420px] text-gray-900 dark:text-gray-100 transition-colors">
      {/* 상단 영역 */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">언어 설정</p>

        {/* 버튼형 라디오 (ThemeSelect와 톤 통일) */}
        <div
          className="flex-col items-center gap-2 rounded-lg p-1.5"
          role="radiogroup"
          aria-label="언어 선택"
        >
          {options.map(({ code, label }) => {
            const selected = value === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(code)}
                className={[
                  'flex items-center justify-between gap-2 px-4 py-2 mb-2 rounded-lg transition-all duration-200 text-sm font-medium w-full h-12',
                  selected
                    ? 'bg-gradient-to-r from-primary/80 to-primary text-white shadow-md scale-[1.03]'
                    : 'text-gray-700 dark:text-gray-300 border border-transparent hover:bg-white/40 dark:hover:bg-gray-700/60',
                ].join(' ')}
              >
                <span>{label}</span>
                <span
                  className={[
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] tracking-wide',
                    selected
                      ? 'bg-white/90 text-primary'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                  ].join(' ')}
                >
                  {code.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
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

export default LanguageSelect;
