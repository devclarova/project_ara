import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  isDisabled?: boolean;
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

export default function CountrySelect({ value, onChange, error = false, isDisabled }: CountrySelectProps) {
  const { t } = useTranslation();
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

  // 🌙 전역 다크 여부
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // ✅ InputField/GenderSelect와 동일한 톤 적용 (다크만)
  const customStyles: StylesConfig<Option, false> = {
    control: (provided, state) => {
      const baseBorder = state.isFocused
        ? 'var(--ara-primary)'
        : error && !value
          ? 'red'
          : isDark
            ? '#4b5563' // 다크: gray-600
            : '#D1D5DB'; // 라이트: 기존 톤 유지
      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;
      return {
        ...provided,
        minHeight: isXs ? 44 : 48,
        height: isXs ? 44 : 48,
        padding: '0 12px',
        borderRadius: 14,
        border: `1px solid ${baseBorder}`,
        borderColor: baseBorder,
        borderWidth: 1,
        outline: 'none',
        boxShadow: state.isFocused ? '0 0 0 3px var(--ara-ring)' : 'none',
        backgroundColor: state.isDisabled 
          ? (isDark ? 'hsl(var(--secondary) / 0.5)' : '#f3f4f6') 
          : (isDark ? 'hsl(var(--secondary))' : '#fff'),
        color: isDark ? '#9CA3AF' : '#111827',
        opacity: state.isDisabled ? 0.7 : 1,
        '&:hover': {
          borderColor: state.isFocused
            ? 'var(--ara-primary)'
            : error && !value
              ? 'red'
              : isDark
                ? '#4b5563'
                : '#D1D5DB',
        },
      };
    },
    valueContainer: provided => {
      // const isXs = typeof window !== 'undefined' && window.innerWidth < 450;
      return {
        ...provided,
        // height: isXs ? 44 : 48, // Remove fixed height causing misalignment
        padding: '0 4px', // Adjust padding slightly
        // display: 'flex', // Remove flex
        // alignItems: 'center', // Remove alignment
      };
    },
    input: provided => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: isDark ? '#9CA3AF' : '#111827', // 다크: gray-400
    }),
    singleValue: provided => ({
      ...provided,
      color: isDark ? '#9CA3AF' : '#111827', // 다크: gray-400
    }),
    indicatorsContainer: provided => {
      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;
      return {
        ...provided,
        height: isXs ? 44 : 48,
        color: isDark ? '#9CA3AF' : provided.color,
      };
    },
    dropdownIndicator: provided => ({
      ...provided,
      marginLeft: 8,
      color: isDark ? '#9CA3AF' : provided.color,
    }),
    indicatorSeparator: provided => ({
      ...provided,
      display: 'none',
    }),
    menu: provided => ({
      ...provided,
      zIndex: 50,
      marginBottom: 13,
      backgroundColor: isDark ? 'hsl(var(--secondary))' : provided.backgroundColor,
      color: isDark ? '#9CA3AF' : '#111827',
      border: `1px solid ${isDark ? '#4b5563' : '#E5E7EB'}`, // 다크 보더 통일
      borderRadius: 12,
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDark
          ? 'hsl(var(--primary) / 0.22)'
          : 'rgba(59,130,246,0.12)'
        : state.isFocused
          ? isDark
            ? 'hsl(var(--primary) / 0.12)'
            : 'rgba(59,130,246,0.08)'
          : 'transparent',
      color: isDark ? '#9CA3AF' : '#111827',
      cursor: 'pointer',
    }),
    menuPortal: provided => ({
      ...provided,
      zIndex: 9999,
    }),
  };

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
        isDisabled={isDisabled}
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
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        menuShouldScrollIntoView
        maxMenuHeight={280}
        openMenuOnFocus
      />

      <label
        className={`absolute left-4 px-1 bg-white transition-all dark:bg-secondary pointer-events-none z-10
          ${
            isFocused || value
              ? '-top-3 text-sm text-primary'
              : 'top-2.5 text-sm xs:text-[14px] text-gray-400'
          }
          ${!isFocused && value ? 'text-gray-400' : ''}
        `}
      >
        {t('signup.label_country')}
      </label>

      {error && !value && <p className="text-red-500 text-sm mt-1">{t('signup.error_country_required')}</p>}
    </div>
  );
}
