import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  flag_url?: string | null;
  phone_code: number;
};

interface Country {
  id: number;
  name: string;
  phone_code: number;
  iso_code: string | null;
  flag_url: string | null;
}

interface CountrySelectProps {
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

export default function CountrySelect({ value, onChange, error = false }: CountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isFocused, setIsFocused] = useState(false);

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

  const options: Option[] = countries.map(c => ({
    value: String(c.id),
    label: c.name,
    flag_url: c.flag_url,
    phone_code: c.phone_code,
  }));

  const selectedOption = options.find(o => o.value === value) || null;

  // ✅ any 제거한 스타일 타입
  const customStyles: StylesConfig<Option, false> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: 48,
      height: 48,
      padding: '0 12px',
      borderRadius: 14,
      borderColor: isFocused ? 'var(--ara-primary)' : error && !value ? 'red' : '#D1D5DB',
      borderWidth: 1,
      outline: 'none',
      boxShadow: isFocused ? '0 0 0 3px var(--ara-ring)' : 'none',
      // hover 효과 제거 유지
      '&:hover': {
        borderColor: isFocused ? 'var(--ara-primary)' : error && !value ? 'red' : '#D1D5DB',
      },
      // 포털 + fixed일 때 가려지지 않도록 배경 지정
      backgroundColor: '#fff',
    }),
    valueContainer: provided => ({
      ...provided,
      height: 48,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    }),
    input: provided => ({ ...provided, margin: 0, padding: 0 }),
    singleValue: provided => ({ ...provided, color: '#111827' }),
    indicatorsContainer: provided => ({ ...provided, height: 48 }),
    dropdownIndicator: provided => ({ ...provided, marginLeft: 8 }),
    indicatorSeparator: provided => ({ ...provided, display: 'none' }),
    menu: provided => ({
      ...provided,
      zIndex: 50,
      marginBottom: 13, // 위로 뜨므로, 컨트롤과의 간격(라벨 가림 방지)
    }),
    menuPortal: provided => ({
      ...provided,
      zIndex: 9999, // 최상단 보장
    }),
  };

  // ✅ SingleValue 타입도 Option으로 명확화
  const handleChange = (opt: SingleValue<Option>) => {
    onChange(opt?.value || '');
    setIsFocused(false);
    (document.activeElement as HTMLElement)?.blur();
  };

  return (
    <div className="w-full relative">
      <Select
        value={selectedOption}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setIsFocused(true)}
        onMenuClose={() => {
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        options={options}
        formatOptionLabel={(opt: Option) => (
          <div className="flex items-center gap-2">
            <img
              src={opt.flag_url ?? '/images/flag_placeholder.svg'}
              alt=""
              className="w-5 h-4 rounded-sm object-cover"
            />
            <span>
              {opt.label} (+{opt.phone_code})
            </span>
          </div>
        )}
        styles={customStyles}
        components={{ DropdownIndicator: CustomDropdownIndicator }}
        className="w-full"
        classNamePrefix="react-select"
        placeholder=" "
        // ⬇️ 핵심: 아래 비면 위로 자동 배치
        menuPlacement="top"
        // ⬇️ 스크롤 컨테이너/overflow 숨김 환경에서도 안전
        menuPosition="fixed"
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        // 메뉴가 뷰포트로 스크롤되게
        menuShouldScrollIntoView
        // 메뉴 높이 제한(상·하 여백 최적화)
        maxMenuHeight={280}
        openMenuOnFocus
      />

      <label
        className={`absolute left-3 px-1 bg-white/95 rounded transition-all
          ${
            isFocused
              ? '-top-2 text-xs text-primary'
              : value
                ? '-top-2 text-xs text-gray-400'
                : 'top-3 text-sm text-gray-400'
          }
        `}
      >
        국적
      </label>

      {error && !value && <p className="text-red-500 text-sm mt-1">국적을 선택해주세요.</p>}
    </div>
  );
}
