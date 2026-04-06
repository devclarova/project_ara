/**
 * 고도화된 시맨틱 입력 엔진(Advanced Semantic Input Engine):
 * - 목적(Why): 인증 및 폼 입력 시 사용자 데이터를 정밀하게 수집하고 실시간 유효성 피드백을 제공하여 데이터 품질을 극대화함
 * - 방법(How): 부동 라벨(Floating Label) 애니메이션, 비밀번호 가시성 토글, 그리고 실시간 중복 확인(onCheck) 로직을 결합하여 고품질 UX를 구현함
 */
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

  // 확장 인터페이스(Extended Props) — 중복 확인(onCheck) 및 포커스 해제(onBlur) 등 비즈니스 로직 연동을 위한 선택적 속성 정의
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onCheck?: () => void;
  isChecking?: boolean;
  checkResult?: CheckResult;

  // 스타일 확장성 — 외부 컨테이너 클래스 주입 및 기본 input 속성(HTMLAttributes)의 투과적 전달 지원
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
      {/* 입력 요소 래퍼 — 부동 라벨(Floating Label)의 절대 위치(Absolute) 기준점 제공 및 고정 레이아웃 유지 */}
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

        {/* 동적 부동 라벨(Semantic Floating Label) — 값의 유무 및 포커스 상태에 따라 트랜지션 애니메이션과 레이어 깊이(Z-index) 조정 */}
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

        {/* 비밀번호 가시성 토글 — 민감한 데이터 노출 여부를 실시간으로 전환하여 사용자 편의성 제공 */}
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
