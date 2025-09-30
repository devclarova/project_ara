import Select, { components, type SingleValue } from 'react-select';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type OptionType = { value: string; label: string };

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
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

export default function GenderSelect({ value, onChange, error = false }: GenderSelectProps) {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const genders = ['Male', 'Female'];
    setOptions(genders.map(g => ({ value: g, label: g })));
  }, []);

  const selectedOption = options.find(o => o.value === value) || null;

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: 48,
      height: 48,
      borderRadius: 14,
      borderColor: state.isFocused
        ? '#00BFA5' // 포커스 우선 → primary
        : error
          ? 'red' // 포커스 없을 때 에러
          : '#D1D5DB', // 기본 회색
      borderWidth: state.isFocused
        ? 1 // 포커스 시 굵기 기본
        : error
          ? 3 // 포커스 없을 때 에러 굵게
          : 1,
      boxShadow: state.isFocused
        ? '0 0 0 2px rgba(0,191,165,0.3)' // 포커스 시 primary 강조
        : 'none',
      paddingLeft: 12,
      paddingRight: 12,
      '&:hover': {
        borderColor: state.isFocused ? '#00BFA5' : error ? 'red' : '#D1D5DB',
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: 48,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided: any) => ({ ...provided, margin: 0, padding: 0 }),
    singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
    indicatorsContainer: (provided: any) => ({ ...provided, height: 48 }),
    dropdownIndicator: (provided: any) => ({ ...provided, marginLeft: 8 }),
    indicatorSeparator: (provided: any) => ({ ...provided }),
  };

  return (
    <div className="w-full relative">
      <Select
        value={selectedOption}
        onChange={(opt: SingleValue<OptionType>) => {
          onChange(opt?.value || '');
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setIsFocused(true)} // 메뉴 열 때 포커스
        onMenuClose={() => {
          setIsFocused(false); // 메뉴 닫으면 포커스 해제
          (document.activeElement as HTMLElement)?.blur(); // 커서 제거
        }}
        options={options}
        styles={customStyles}
        components={{ DropdownIndicator: CustomDropdownIndicator }}
        className="w-full"
        classNamePrefix="react-select"
        placeholder=" "
      />
      <label
        className={`absolute left-3 px-1 bg-white/95 rounded transition-all
    ${
      isFocused
        ? '-top-2 text-xs text-primary' // 포커스 시 항상 위 + primary
        : value
          ? '-top-2 text-xs text-gray-400' // 값 있으면 위 + 회색
          : 'top-3 text-sm text-gray-400' // 기본 중앙
    }
  `}
      >
        Gender
      </label>
      {error && <p className="text-red-500 text-sm mt-1">Please select your gender.</p>}
    </div>
  );
}
