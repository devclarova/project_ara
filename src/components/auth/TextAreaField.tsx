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

        {/* Character count floating inside at bottom right */}
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
