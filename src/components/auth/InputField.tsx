interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}
const InputField = ({ id, label, type = 'text', value, onChange, error }: InputFieldProps) => (
  <div className="relative">
    <input
      type={type}
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder=" "
      className={`peer w-full px-4 py-3 border bg-white text-gray-900 text-sm ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded ${error ? '' : 'border-gray-300'}`}
    />
    <label
      htmlFor={id}
      className={`absolute left-3 sm:left-4 transition-all
        ${
          value
            ? '-top-3 text-sm sm:-top-3 sm:text-sm md:-top-2.5 md:text-sm lg:-top-3 lg:text-sm xl:-top-[14px]'
            : 'top-3 text-sm sm:top-3 sm:text-sm md:top-3 md:text-sm lg:top-3 lg:text-sm'
        }
        peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
        text-gray-400 bg-white/95 px-1 rounded`}
    >
      {label}
    </label>
    {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
  </div>
);

export default InputField;

// import * as React from 'react';

// type CheckResult = 'available' | 'taken' | '';

// type InputFieldProps = {
//   id: string;
//   label: string;
//   type?: string;
//   value: string;
//   onChange: (val: string) => void;
//   error?: string;

//   // ⬇️ 추가된 선택 props (중복확인/블러)
//   onBlur?: React.FocusEventHandler<HTMLInputElement>;
//   onCheck?: () => void;
//   isChecking?: boolean;
//   checkResult?: CheckResult;

//   // (선택) 커스터마이즈 여지를 위해
//   className?: string;
//   inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
// };

// const InputField: React.FC<InputFieldProps> = ({
//   id,
//   label,
//   type = 'text',
//   value,
//   onChange,
//   onBlur,
//   error,
//   onCheck,
//   isChecking,
//   checkResult,
//   className,
//   inputProps,
// }) => {
//   const hasCheck = typeof onCheck === 'function';

//   return (
//     <div className={`relative ${className ?? ''}`}>
//       <input
//         type={type}
//         id={id}
//         value={value}
//         onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
//         onBlur={onBlur}
//         placeholder=" "
//         className={`peer w-full px-4 py-3 ${hasCheck ? 'pr-20' : ''}
//           border bg-white text-gray-900 text-sm
//           ${error ? 'ara-focus--error' : 'ara-focus'} ara-rounded
//           ${error ? '' : 'border-gray-300'}`}
//         {...inputProps}
//       />

//       <label
//         htmlFor={id}
//         className={`absolute left-3 transition-all bg-white/95 px-1 rounded
//           ${value ? '-top-3 text-xs' : 'top-2 text-sm'}
//           peer-focus:-top-3 peer-focus:text-xs peer-focus:text-primary text-gray-400`}
//       >
//         {label}
//       </label>

//       {hasCheck && (
//         <button
//           type="button"
//           onClick={onCheck}
//           disabled={isChecking}
//           className="absolute right-2 top-1/2 -translate-y-1/2
//             text-xs sm:text-sm font-medium text-primary border border-primary
//             rounded-lg px-2 py-1 hover:bg-primary hover:text-white
//             transition-colors disabled:opacity-50"
//         >
//           {isChecking ? 'Checking...' : 'Check'}
//         </button>
//       )}

//       {checkResult && !error && (
//         <p
//           className={`mt-1 text-xs ${checkResult === 'available' ? 'text-green-600' : 'text-red-500'}`}
//         >
//           {checkResult === 'available' ? 'Available ✓' : 'Already taken ✗'}
//         </p>
//       )}

//       {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
//     </div>
//   );
// };

// export default InputField;
