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
