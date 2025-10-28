
'use client';

import React, { useState, useCallback, memo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/../../src/hooks/use-debounce';

export const Header = memo(function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const router = useRouter();

  React.useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/news?search=${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery, router]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <header className="h-16 bg-[#0f0f0f] border-b border-[#1a1a1a] flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <Search className="text-gray-500" size={20} />
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search news, tracks, events..."
          className="bg-[#1a1a1a] border-none text-white placeholder:text-gray-500"
        />
      </div>
    </header>
  );
});
