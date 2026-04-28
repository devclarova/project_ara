import Select, { components, type SingleValue, type StylesConfig, type DropdownIndicatorProps } from 'react-select';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type OptionType = { value: string; label: string };

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const CustomDropdownIndicator = (props: DropdownIndicatorProps<OptionType, false>) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </components.DropdownIndicator>
  );
};

export default function GenderSelect({ value, onChange, error = false }: GenderSelectProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<OptionType[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // 성별 옵션 초기화 — 다국어 지원(i18n) 및 비이진 성별(Non-binary)을 포함한 포용적 서술형 선택지 구성
    const genders = [
      // { value: 'other', label: t('signup.gender_other', 'Other'), icon: '✨' },
      { value: 'Male', label: t('signup.gender_male') },
      { value: 'Female', label: t('signup.gender_female') }
    ];
    setOptions(genders);
  }, [t]);

  const selectedOption = options.find(o => o.value === value) || null;

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // 컴포넌트 외관 모델링(Styling Engine) — 시스템 테마(Dark/Light) 및 인터페이스 가동성(Viewport)에 최적화된 반응형 스타일 세트 정의
  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => {
      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      const baseBorderColor = state.isFocused
        ? 'var(--ara-primary)'
        : error
          ? 'red'
          : isDark
            ? '#4b5563' // 🌙 gray-600
            : '#D1D5DB';

      const isXs = typeof window !== 'undefined' && window.innerWidth < 450;

      return {
        ...provided,
        minHeight: isXs ? 44 : 48,
        height: isXs ? 44 : 48,
        borderRadius: 14,
        border: `1px solid ${baseBorderColor}`,
        outline: 'none',
        boxShadow: state.isFocused ? '0 0 0 1px var(--ara-ring)' : 'none',
        paddingLeft: 12,
        paddingRight: 12,
        backgroundColor: isDark ? 'hsl(var(--secondary))' : '#FFFFFF',
        color: isDark ? 'hsl(var(--secondary-foreground))' : '#111827',
        '&:hover': {
          borderColor: state.isFocused
            ? 'var(--ara-primary)'
            : error
              ? 'red'
              : isDark
                ? '#4b5563'
                : '#D1D5DB',
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
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: isDark ? '#9CA3AF' : '#111827',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDark ? '#F3F4F6' : '#111827',
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
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDark ? 'hsl(var(--secondary))' : '#FFFFFF',
      color: isDark ? 'hsl(var(--secondary-foreground))' : '#111827',
      border: `1px solid ${isDark ? '#4b5563' : '#E5E7EB'}`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 50,
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
      color: isDark ? 'hsl(var(--secondary-foreground))' : '#111827',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(229,231,235,0.8)'}`,
      cursor: 'pointer',
      padding: '10px 14px',
      '&:last-of-type': { borderBottom: 'none' },
    }),
  };

  return (
    <div className="w-full relative">
      {/* 성별 선택 필드 — 시각적 일관성을 위해 부동 라벨(Floating Label) 시스템과 커스텀 셀렉트 라이브러리 통합 */}
      <Select
        value={selectedOption}
        onChange={(opt: SingleValue<OptionType>) => {
          onChange(opt?.value || '');
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMenuOpen={() => setIsFocused(true)}
        onMenuClose={() => {
          setIsFocused(false);
          (document.activeElement as HTMLElement)?.blur();
        }}
        options={options}
        styles={customStyles}
        components={{ DropdownIndicator: CustomDropdownIndicator }}
        className="w-full"
        classNamePrefix="react-select"
        placeholder=" "
        openMenuOnFocus
      />
      <label
        className={`absolute left-4 px-1 bg-white transition-all dark:bg-secondary pointer-events-none z-10
    ${isFocused || value ? '-top-3 text-sm' : 'top-2.5 text-sm xs:text-[14px] text-gray-400'}
    ${isFocused ? 'text-primary' : 'text-gray-400'}
  `}
      >
        {t('signup.label_gender')}
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{t('signup.error_gender_required')}</p>}
    </div>
  );
}
