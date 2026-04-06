/**
 * 다중 행 리치 텍스트 입력 유닛(Multi-line Rich Text Input Unit):
 * - 목적(Why): 게시글 작성이나 프로필 소개와 같은 장문 데이터 입력 시 가독성과 입력 편의성을 보장함
 * - 방법(How): 글자 수 카운팅(MaxLength) 레이어와 부동 라벨 트랜지션을 통합하여 제한된 영역 내에서 명확한 입력 가이드를 실시간으로 제공함
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

export type TextAreaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  
  // Optional customizations
  className?: string;
  containerClassName?: string;
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  rows = 3,
  maxLength,
  placeholder,
  className,
  containerClassName,
  inputProps,
}) => {
  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      {/* 다중 행 입력 엔진(Multi-line Input Engine) — 사용자 바이오(Bio) 등 긴 텍스트 수집을 위한 가변적 텍스트 영역 및 스타일링 구성 */}
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder=" "
          className={`peer w-full px-4 pt-4 pb-7 border bg-white text-gray-900 text-sm dark:bg-secondary dark:text-gray-100
            ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded ${error ? '' : 'border-gray-300'}
            resize-none placeholder-transparent ${className ?? ''}`}
          {...inputProps}
        />

        {/* 부동 라벨 제어(Floating Label Control) — 입력 가시성에 따라 라벨의 위치와 크기를 동적으로 조정하여 UX 직관성 확보 */}
        <label
          htmlFor={id}
          className={`
            pointer-events-none absolute left-3 sm:left-4 bg-white/95 px-1 rounded dark:bg-secondary
            text-gray-400 transition-all duration-150
            ${value ? '-top-2 text-xs' : 'top-3 text-sm'}
            peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary
          `}
        >
          {label}
        </label>

        {/* 입력 제한 모니터링 — 실시간 글자 수 카운팅 및 최대 길이(MaxLength) 가이드를 사용자에게 시각적으로 제공 */}
        {maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none bg-white/80 dark:bg-secondary/80 px-1 rounded">
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-red-500 text-xs mt-1 ml-3">{error}</p>
      ) : null}
    </div>
  );
};

export default TextAreaField;
