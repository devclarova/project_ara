/**
 * 스퀘어 타입 체크박스 데이터 입력 유닛(Square Checkbox Input Unit):
 * - 목적(Why): 사용자로부터 불리언(Boolean) 입력을 받기 위한 고유한 시각적 아이덴티티를 가진 선택 도구를 제공함
 * - 방법(How): 숨겨진 네이티브 체크박스와 연동된 SVG 시각적 상태(Checked, Indeterminate)를 제어하여 웹 표준 접근성과 심미성을 동시에 확보함
 */
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

function useAutoId(prefix = 'chk') {
  const ref = useRef<string>();
  if (!ref.current) ref.current = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  return ref.current;
}

export default function CheckboxSquare({
  checked,
  onChange,
  label,
  required = false,
  id,
  className = '',
  visualState,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  required?: boolean;
  id?: string;
  className?: string;
  visualState?: 'checked' | 'indeterminate' | 'unchecked';
}) {
  const { t } = useTranslation();
  const autoId = useAutoId();
  const inputId = id || autoId;

  const vars = {
    '--ara-checkbox-bg': 'var(--ara-surface, #ffffff)',
    '--ara-checkbox-border': 'var(--ara-border, #d1d5db)',
    '--ara-checkbox-ring': 'var(--ara-ring, rgba(0,191,165,.3))',
    '--ara-checkbox-check': 'var(--ara-ink, #111111)',
  } as React.CSSProperties;

  const state: 'checked' | 'indeterminate' | 'unchecked' =
    visualState ?? (checked ? 'checked' : 'unchecked');

  return (
    <label
      htmlFor={inputId}
      className={[
        'flex items-start gap-3 xs:gap-1.5 cursor-pointer select-none text-gray-800 dark:text-gray-100', 
        className,
      ].join(' ')}
      style={vars}
    >
      {/* Accessibility Bridge: Hidden native checkbox synchronizes state while allowing peer-based visual focus styling. */}
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only peer"
      />

      {/* Custom Visual Surface: Renders deterministic SVG states (checked, indeterminate) while preventing redundant screen reader announcements via aria-hidden. */}
      <span
        className="mt-0.5 w-5 h-5 xs:w-[18px] xs:h-[18px] rounded-[6px] border grid place-items-center flex-shrink-0
                   bg-[var(--ara-checkbox-bg)] border-[var(--ara-checkbox-border)]
                   pointer-events-none
                   dark:bg-gray-700 dark:border-gray-500 dark:[--ara-checkbox-check:#ffffff]"
        role="presentation"
        aria-hidden="true"
      >
        {state === 'checked' && (
          <svg className="w-4 h-4 xs:w-3.5 xs:h-3.5 opacity-100" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 10.5l3 3 7-7"
              stroke="var(--ara-checkbox-check)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {state === 'indeterminate' && (
          <svg className="w-4 h-4 xs:w-3.5 xs:h-3.5 opacity-100" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 10h10"
              stroke="var(--ara-checkbox-check)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {state === 'unchecked' && (
          <svg className="w-4 h-4 xs:w-3.5 xs:h-3.5 opacity-0" viewBox="0 0 20 20" aria-hidden="true" />
        )}
      </span>

      <span className="font-semibold text-base xs:text-[14px] min-w-0 flex-1" style={{ overflowWrap: 'break-word' }}>
        {label}{' '}
        {required && (
          <em className="not-italic text-red-600 dark:text-red-400 ml-1 xs:ml-0.5 whitespace-nowrap text-xs">
            {t('signup.required_mark')}
          </em>
        )}
      </span>
    </label>
  );
}
