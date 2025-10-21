import * as React from 'react';

type CheckResult = 'available' | 'taken' | '';

type InputFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;

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
  onCheck,
  isChecking,
  checkResult,
  className,
  inputProps,
}) => {
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
          placeholder=" "
          className={`peer w-full h-12 px-4 pr-20 border bg-white text-gray-900 text-sm
            ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded ${error ? '' : 'border-gray-300'}`}
          {...inputProps}
        />

        {/* 라벨: 포커스/값 있을 때 동일 위치(더 위)로 고정 */}
        <label
          htmlFor={id}
          className={`
            pointer-events-none absolute left-3 sm:left-4 bg-white/95 px-1 rounded
            text-gray-400 transition-all duration-150
            ${value ? '-top-2 text-xs' : 'top-3 text-sm'}
            peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary
          `}
        >
          {label}
        </label>

        {/* 버튼: 인풋 래퍼 높이에만 종속 → 더 이상 안 움직임 */}
        {hasCheck && (
          <button
            type="button"
            onClick={onCheck}
            disabled={isChecking}
            className="absolute right-2 top-1/2 -translate-y-1/2
              text-xs sm:text-sm font-medium text-primary border border-primary
              rounded-lg px-2 py-1 hover:bg-primary hover:text-white
              transition-colors disabled:opacity-50"
          >
            {isChecking ? '확인 중...' : '중복확인'}
          </button>
        )}
      </div>

      {/* 메시지: 살짝 더 안쪽(오른쪽)으로 들여쓰기 */}
      {error ? (
        <p className="text-red-500 text-xs mt-1 ml-3">{error}</p>
      ) : checkResult === 'available' ? (
        <p className="text-green-600 text-xs mt-1 ml-3">사용 가능합니다.</p>
      ) : checkResult === 'taken' ? (
        <p className="text-red-500 text-xs mt-1 ml-3">이미 사용 중입니다.</p>
      ) : null}
    </div>
  );
};

export default InputField;
