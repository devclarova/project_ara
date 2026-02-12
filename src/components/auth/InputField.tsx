import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

type CheckResult = 'available' | 'taken' | '' | 'same_as_primary';

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
  const isPasswordField = type === 'password';
  const [showPassword, setShowPassword] = React.useState(false);

  // Determine actual input type
  const actualType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* 인풋 전용 고정 높이 래퍼 */}
      <div className="relative">
        <input
          id={id}
          type={actualType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder=" "
          className={`peer w-full px-4 py-2.5
            ${isPasswordField ? 'pr-12' : hasCheck ? 'pr-24' : 'pr-4'} 
            border text-sm xs:text-[14px]
            ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded
            ${error ? '' : 'border-gray-300 dark:border-gray-600'}
            bg-white dark:bg-secondary
            ${disabled 
              ? 'text-gray-500 dark:text-gray-400 opacity-60 cursor-not-allowed' 
              : 'text-gray-900 dark:text-gray-100'
            }
            placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-gray-500
          `}
          {...inputProps}
        />

        {/* 라벨: 포커스/값 있을 때 동일 위치(더 위)로 고정 */}
        <label
          htmlFor={id}
          className={`
            pointer-events-none absolute left-4 px-1 rounded transition-all duration-150 z-10
            ${value ? '-top-3 text-sm max-w-full' : `top-2.5 text-sm xs:text-[14px] ${hasCheck ? 'max-w-[calc(100%-6.5rem)]' : 'max-w-[calc(100%-2rem)]'} truncate`}
            bg-white dark:bg-secondary
            ${disabled
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-400 dark:text-gray-300 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-primary peer-focus:max-w-full'
            }
          `}
        >
          {label}
        </label>

        {/* 비밀번호 표시/숨기기 아이콘 */}
        {isPasswordField && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity z-10"
            aria-label={showPassword ? t('settings.hide') : t('settings.show')}
          >
            <i className={showPassword ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
          </button>
        )}

        {/* 버튼: 인풋 래퍼 높이에만 종속 → 더 이상 안 움직임 */}
        {hasCheck && (
          <button
            type="button"
            onClick={onCheck}
            disabled={isChecking || disabled}
            className={`absolute right-2 top-1/2 -translate-y-1/2
              text-xs xs:text-[10px] sm:text-sm font-medium rounded-lg px-1.5 py-1 xs:py-0.5
              transition-colors whitespace-nowrap
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
