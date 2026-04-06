/**
 * 검색을 지원하는 고가역성 토글 스위치(High-Reversibility Toggle Switch with Search Support):
 * - 목적(Why): 설정 항목의 활성화/비활성화 상태를 직관적으로 제어하고 검색 쿼리에 따른 키워드 강조를 지원함
 * - 방법(How): 상태(checked)에 따른 배경색 및 노브(Knob) 위치 애니메이션, 그리고 HighlightText 컴포넌트를 통한 레이블/설명 텍스트 필터링을 수행함
 */
import HighlightText from '@/components/common/HighlightText';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  searchQuery?: string;
};

export default function Switch({ checked, onChange, label, description, searchQuery }: SwitchProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* 왼쪽 텍스트 영역 */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
            <HighlightText text={label} query={searchQuery} />
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <HighlightText text={description} query={searchQuery} />
          </span>
        )}
      </div>

      {/* 오른쪽 토글 */}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-y-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
