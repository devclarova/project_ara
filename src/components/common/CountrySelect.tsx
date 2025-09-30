import Select, { components, type SingleValue } from 'react-select';
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

  const options = countries.map(c => ({
    value: c.id.toString(),
    label: c.name,
    flag_url: c.flag_url,
    phone_code: c.phone_code,
  }));

  const selectedOption = options.find(o => o.value === value) || null;

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: 48,
      height: 48,
      padding: '0 12px',
      borderRadius: 14,
      borderColor: isFocused ? '#00BFA5' : error && !value ? 'red' : '#D1D5DB',
      borderWidth: isFocused ? 1 : error && !value ? 3 : 1,
      boxShadow: isFocused ? '0 0 0 2px rgba(0,191,165,0.3)' : 'none',
      '&:hover': {
        borderColor: isFocused ? '#00BFA5' : error && !value ? 'red' : '#D1D5DB',
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

  const handleChange = (opt: SingleValue<any>) => {
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
        placeholder=" "
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
        Nationality
      </label>

      {error && !value && (
        <p className="text-red-500 text-sm mt-1">Please select your nationality.</p>
      )}
    </div>
  );
}
