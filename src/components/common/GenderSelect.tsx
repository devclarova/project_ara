import Select, { components, type SingleValue } from 'react-select';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type OptionType = { value: string; label: string };

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean; // ❗ 추가: 오류 여부
  className?: string;
}

const CustomDropdownIndicator = (props: any) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </components.DropdownIndicator>
  );
};

const customStyles = (hasError: boolean) => ({
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '3rem',
    height: '3rem',
    padding: '0 1rem',
    borderColor: hasError ? 'red' : state.isFocused ? '#00BFA5' : '#D1D5DB',
    borderWidth: hasError ? '2px' : '1px',
    borderRadius: '1rem',
    boxShadow: hasError
      ? '0 0 0 2px rgba(239, 68, 68, 0.3)'
      : state.isFocused
        ? '0 0 0 2px rgba(0,191,165,0.3)'
        : 'none',
    '&:hover': {
      borderColor: hasError ? 'red' : state.isFocused ? '#00BFA5' : '#D1D5DB',
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: '3rem',
    padding: '0 0',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (provided: any) => ({ ...provided, margin: 0, padding: 0 }),
  singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
  indicatorsContainer: (provided: any) => ({ ...provided, height: '3rem' }),
  dropdownIndicator: (provided: any) => ({ ...provided, marginLeft: '0.5rem' }),
  indicatorSeparator: (provided: any) => ({ ...provided }),
});

export default function GenderSelect({
  value,
  onChange,
  error = false, // ❗ 기본 false
}: GenderSelectProps) {
  const [options, setOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    const genders = ['남', '여'];
    setOptions(genders.map(g => ({ value: g, label: g })));
  }, []);

  const selectedOption = options.find(o => o.value === value) || null;

  return (
    <div className="w-full">
      <Select
        value={selectedOption}
        onChange={(opt: SingleValue<OptionType>) => {
          onChange(opt?.value || '');
          (document.activeElement as HTMLElement)?.blur();
        }}
        onMenuClose={() => (document.activeElement as HTMLElement)?.blur()}
        options={options}
        styles={customStyles(error)}
        components={{ DropdownIndicator: CustomDropdownIndicator }}
        className="w-full"
        classNamePrefix="react-select"
        placeholder="Gender"
      />
      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">성별을 선택해주세요.</p>}
    </div>
  );
}
