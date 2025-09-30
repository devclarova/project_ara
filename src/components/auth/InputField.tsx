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
      className={`peer w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2
        ${error ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300 focus:ring-primary'}
        bg-white text-black text-sm sm:text-base`}
    />
    <label
      htmlFor={id}
      className={`absolute left-3 sm:left-4 transition-all
        ${value ? '-top-3 text-xs sm:text-sm' : 'top-2 sm:top-3 text-sm sm:text-base'}
        peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
        text-gray-400 bg-white/95 px-1 rounded`}
    >
      {label}
    </label>
    {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
  </div>
);

export default InputField;
