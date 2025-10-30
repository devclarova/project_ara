import React, { useRef } from 'react';

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
  label: string;
  required?: boolean;
  id?: string;
  className?: string;
  visualState?: 'checked' | 'indeterminate' | 'unchecked';
}) {
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
      className={['flex items-center gap-3 cursor-pointer select-none', className].join(' ')}
      style={vars}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className="w-5 h-5 rounded-[6px] border grid place-items-center bg-[var(--ara-checkbox-bg)] border-[var(--ara-checkbox-border)] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ara-checkbox-ring)]"
        tabIndex={-1}
        aria-hidden="true"
      >
        {state === 'checked' && (
          <svg className="w-4 h-4 opacity-100" viewBox="0 0 20 20" fill="none">
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
          <svg className="w-4 h-4 opacity-100" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 10h10"
              stroke="var(--ara-checkbox-check)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {state === 'unchecked' && <svg className="w-4 h-4 opacity-0" viewBox="0 0 20 20" />}
      </span>
      <span className="font-semibold text-gray-800">
        {label} {required && <em className="not-italic text-red-600 ml-1">(필수)</em>}
      </span>
    </label>
  );
}
