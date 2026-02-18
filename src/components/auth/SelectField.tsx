import * as React from 'react';
import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      {isOpen ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-400" />}
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
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = React.useState(false);

  const selectedOption = options.find(o => o.value === value) || null;

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => {
      const isFocusedInternal = state.isFocused || isFocused;
      const baseBorder = isFocusedInternal
        ? 'var(--ara-primary)'
        : error ? '#EF4444' : (isDark ? '#4b5563' : '#D1D5DB');
      
      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;

      return {
        ...provided,
        minHeight: isXs ? 44 : 48,
        height: isXs ? 44 : 48,
        borderRadius: 14,
        border: `1px solid ${baseBorder}`,
        boxShadow: isFocusedInternal ? '0 0 0 1px var(--ara-ring)' : 'none',
        backgroundColor: isDark ? 'hsl(var(--secondary))' : '#FFFFFF',
        paddingLeft: 12,
        paddingRight: 12,
        cursor: 'pointer',
        '&:hover': {
          borderColor: isFocusedInternal ? 'var(--ara-primary)' : (isDark ? '#4b5563' : '#d1d5db'),
        },
      };
    },
    valueContainer: (provided) => {
      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;
      return {
        ...provided,
        height: isXs ? 44 : 48,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
      };
    },
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#F3F4F6' : '#111827',
      fontSize: '14px',
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: isDark ? '#9CA3AF' : '#111827',
    }),
    indicatorsContainer: (provided) => {
      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;
      return {
        ...provided,
        height: isXs ? 44 : 48,
      };
    },
    dropdownIndicator: (provided) => ({
      ...provided,
      marginLeft: 8,
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      display: 'none',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
      borderRadius: 12,
      zIndex: 50,
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? (isDark ? 'hsl(var(--primary) / 0.22)' : 'rgba(59,130,246,0.1)')
        : state.isFocused ? (isDark ? 'hsl(var(--primary) / 0.12)' : 'rgba(59,130,246,0.08)') : 'transparent',
      color: isDark ? '#F3F4F6' : '#111827',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '10px 14px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(229,231,235,0.8)'}`,
      '&:last-of-type': { borderBottom: 'none' },
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
        onChange={(opt: SingleValue<OptionType>) => {
          onChange(opt?.value || '');
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        options={options}
        styles={customStyles}
        isDisabled={disabled}
        components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setIsFocused(true)}
        onMenuClose={() => {
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        placeholder={placeholder}
        isSearchable={false}
        menuPlacement="auto"
        openMenuOnFocus
      />
      <label
        htmlFor={id}
        className={`
          pointer-events-none absolute left-4 px-1 rounded transition-all duration-150 z-10
          ${(isFocused || value) ? '-top-3 text-sm' : 'top-2.5 text-sm xs:text-[14px]'}
          ${disabled
            ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-400'
            : (isFocused || value)
              ? `bg-white dark:bg-secondary ${isFocused ? 'text-primary' : 'text-gray-400'}`
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
