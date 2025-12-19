import * as React from 'react';
import { useTranslation } from 'react-i18next';

type CheckResult = 'available' | 'taken' | '';

export type InputFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;

  // 추가된 선택 props (중복확인/블러)
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onCheck?: () => void;
  isChecking?: boolean;
  checkResult?: CheckResult;

  // (선택) 커스터마이즈 여지를 위해
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  disabled,
  onCheck,
  isChecking,
  checkResult,
  className,
  inputProps,
}) => {
  const { t } = useTranslation();
  const hasCheck = typeof onCheck === 'function';

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* 인풋 전용 고정 높이 래퍼 */}
      <div className="relative h-12">
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder=" "
          className={`peer w-full h-12 px-4 pr-20 border text-gray-900 text-sm dark:text-gray-100
            ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded ${error ? '' : 'border-gray-300'}
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 cursor-default' 
              : 'bg-white dark:bg-secondary'
            }
            placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-gray-500
          `}
          {...inputProps}
        />

        {/* 라벨: 포커스/값 있을 때 동일 위치(더 위)로 고정 */}
        <label
          htmlFor={id}
          className={`
            pointer-events-none absolute left-3 sm:left-4 px-1 rounded transition-all duration-150
            ${value ? '-top-2 text-xs' : 'top-3 text-sm'}
            ${disabled
              ? 'bg-white dark:bg-secondary text-gray-400'
              : 'bg-white/95 dark:bg-secondary text-gray-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary'
            }
          `}
        >
          {label}
        </label>

        {/* 버튼: 인풋 래퍼 높이에만 종속 → 더 이상 안 움직임 */}
        {hasCheck && (
          <button
            type="button"
            onClick={onCheck}
            disabled={isChecking || disabled}
            className={`absolute right-2 top-1/2 -translate-y-1/2
              text-xs sm:text-sm font-medium rounded-lg px-2 py-1
              transition-colors
              ${disabled
                ? 'text-gray-400 border border-gray-300 pointer-events-none bg-gray-100 dark:bg-gray-800 dark:border-gray-700'
                : 'text-primary border border-primary hover:bg-primary hover:text-white cursor-pointer'
              }
            `}
          >
            {isChecking ? t('signup.checking') : t('signup.check_duplicate')}
          </button>
        )}
      </div>

      {/* 메시지: 살짝 더 안쪽(오른쪽)으로 들여쓰기 */}
      {error ? (
        <p className="text-red-500 text-xs mt-1 ml-3">{error}</p>
      ) : checkResult === 'available' ? (
        <p className="text-green-600 text-xs mt-1 ml-3">{t('signup.available')}</p>
      ) : checkResult === 'taken' ? (
        <p className="text-red-500 text-xs mt-1 ml-3">{t('signup.already_in_use')}</p>
      ) : null}
    </div>
  );
};

export default InputField;
