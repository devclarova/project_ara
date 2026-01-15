import * as React from 'react';
import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';

type OptionType = { value: string; label: string };

export type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  options: OptionType[];
  placeholder?: string;
};

const CustomDropdownIndicator = (props: any) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </components.DropdownIndicator>
  );
};

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  className,
  options,
  placeholder = " ",
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [menuIsOpen, setMenuIsOpen] = React.useState(false);

  const selectedOption = options.find(o => o.value === value) || null;

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: 44,
      height: 44,
      borderRadius: 14,
      border: `1px solid ${state.isFocused 
        ? 'var(--ara-primary)' 
        : error ? '#EF4444' : '#D1D5DB'}`,
      boxShadow: state.isFocused ? '0 0 0 1px var(--ara-ring)' : 'none',
      backgroundColor: isDark ? '#262626' : '#FFFFFF',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--ara-primary)' : undefined,
      },
      cursor: 'pointer', // Hand cursor
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#F3F4F6' : '#111827',
      fontSize: '14px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
      borderRadius: 12,
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)')
        : state.isFocused ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 'transparent',
      color: isDark ? '#F3F4F6' : '#111827',
      cursor: 'pointer',
      fontSize: '14px',
    }),
    placeholder: (provided) => ({
        ...provided,
        display: 'none',
    })
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Select
        id={id}
        instanceId={id}
        value={selectedOption}
        onChange={(opt: SingleValue<OptionType>) => onChange(opt?.value || '')}
        options={options}
        styles={customStyles}
        isDisabled={disabled}
        components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        menuIsOpen={menuIsOpen} // Completely controlled
        placeholder={placeholder}
        isSearchable={false}
        maxMenuHeight={160}
        menuPlacement="auto"
      />
      <label
        htmlFor={id}
        className={`
          pointer-events-none absolute left-3 px-1 rounded transition-all duration-150 z-10
          ${(menuIsOpen || value) ? '-top-2 text-xs' : 'top-3 text-[14px]'}
          ${disabled
            ? 'bg-transparent text-gray-400'
            : (menuIsOpen || value)
              ? `bg-white dark:bg-[#1F2937] ${isFocused ? 'text-primary' : 'text-gray-400'}`
              : 'bg-transparent text-gray-400'
          }
        `}
      >
        {label}
      </label>
      {error && (
        <p className="text-red-500 text-xs mt-1 ml-3">{error}</p>
      )}
    </div>
  );
};

export default SelectField;
