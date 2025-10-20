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
    <div className="relative">
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
        />

        {/* 라벨: 고정 높이 래퍼를 기준으로만 이동 → 컨테이너 높이 변화와 무관 */}
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3 sm:left-4 transition-all
        ${
          value
            ? '-top-3 text-sm sm:-top-3 sm:text-sm md:-top-2.5 md:text-sm lg:-top-3 lg:text-sm xl:-top-[14px]'
            : 'top-3 text-sm sm:top-3 sm:text-sm md:top-3 md:text-sm lg:top-3 lg:text-sm'
        }
        peer-focus:-top-2 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
        text-gray-400 bg-white/95 px-1 rounded`}
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

      {/* 에러 메시지는 인풋 래퍼 바깥에 배치 → 버튼 위치에 영향 없음 */}
      {error ? (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      ) : checkResult === 'available' ? (
        <p className="text-green-600 text-xs mt-1">사용 가능합니다.</p>
      ) : checkResult === 'taken' ? (
        <p className="text-red-500 text-xs mt-1">이미 사용 중입니다.</p>
      ) : null}
    </div>
  );
};

export default InputField;
