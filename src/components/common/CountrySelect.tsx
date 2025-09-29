import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [countries, setCountries] = useState<{ id: number; phone_code: number; name: string }[]>(
    [],
  );

  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase.from('countries').select('id, phone_code, name');
      if (!error) setCountries(data || []);
      else console.error('Error fetching countries:', error);
    };
    fetchCountries();
  }, []);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Select country</option>
      {countries.map(c => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
