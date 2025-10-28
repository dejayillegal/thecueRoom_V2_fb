
'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

/**
 * Dashboard header with debounced search
 */
export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      // TODO: Implement search functionality with debouncedQuery
    },
    []
  );

  return (
    <header className="sticky top-0 z-10 bg-[#0B0B0B] border-b border-[#1a1a1a] px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10 bg-[#111111] border-[#1a1a1a] text-white"
          />
        </div>
      </div>
    </header>
  );
}
