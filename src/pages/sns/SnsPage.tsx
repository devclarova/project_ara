import { useState } from 'react';
import Home from '../homes/Home';
import SnsLayout from './SnsLayout';

export default function SnsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SnsLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} hideSearchBar={false}>
      <Home searchQuery={searchQuery} />
    </SnsLayout>
  );
}
