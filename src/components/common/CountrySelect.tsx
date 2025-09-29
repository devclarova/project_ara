import Select, { components } from 'react-select';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Country {
  id: number;
  name: string;
  phone_code: number;
  iso_code: string;
  flag_url: string;
}

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
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

const customStyles = {
  // Select 컨트롤 전체
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '3rem', // input py-3 기준 높이
    height: '3rem',
    padding: '0 1rem', // px-4
    borderColor: state.isFocused ? '#00BFA5' : '#D1D5DB', // focus ring color / default gray
    borderRadius: '1rem', // rounded-lg
    boxShadow: state.isFocused ? '0 0 0 2px rgba(0,191,165,0.5)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#00BFA5' : '#D1D5DB',
    },
  }),

  // 값 영역
  valueContainer: (provided: any) => ({
    ...provided,
    height: '3rem',
    padding: '0 0', // padding은 control에서 처리
    display: 'flex',
    alignItems: 'center', // 텍스트 수직 가운데 정렬
  }),

  // 실제 입력 텍스트
  input: (provided: any) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),

  // 선택된 단일 값 텍스트
  singleValue: (provided: any) => ({
    ...provided,
    color: '#111827', // text-gray-800
  }),

  // 오른쪽 화살표 컨테이너
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: '3rem', // 전체 높이 맞춤
  }),

  // dropdown 화살표
  dropdownIndicator: (provided: any) => ({
    ...provided,
    marginLeft: '0.5rem', // 화살표만 오른쪽으로 이동
  }),

  // 구분선 바는 그대로
  indicatorSeparator: (provided: any) => ({
    ...provided,
  }),
};

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, phone_code, iso_code, flag_url')
        .order('id', { ascending: true });
      if (!error && data) setCountries(data);
      else console.error(error);
    };
    fetchCountries();
  }, []);

  const options = countries.map(c => ({
    value: c.id.toString(),
    label: c.name,
    flag_url: c.flag_url,
    phone_code: c.phone_code,
  }));

  const selectedOption = options.find(o => o.value === value) || null;

  return (
    <Select
      value={selectedOption}
      onChange={opt => {
        onChange(opt?.value || '');
        // 선택 후 focus 해제
        (document.activeElement as HTMLElement)?.blur();
      }}
      onMenuClose={() => (document.activeElement as HTMLElement)?.blur()}
      options={options}
      formatOptionLabel={opt => (
        <div className="flex items-center gap-2">
          <img src={opt.flag_url} alt={opt.label} className="w-5 h-3" />
          <span>
            {opt.label} (+{opt.phone_code})
          </span>
        </div>
      )}
      styles={customStyles}
      components={{ DropdownIndicator: CustomDropdownIndicator }}
      className="w-full"
      classNamePrefix="react-select"
    />
  );
}
