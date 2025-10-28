
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

/**
 * Dashboard header with debounced search
 * Uses router.replace to avoid polluting browser history
 */
export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
    },
    []
  );

  // Navigate on debounced query change
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/dashboard?search=${encodeURIComponent(debouncedQuery)}`);
    } else if (searchQuery === '') {
      router.replace('/dashboard');
    }
  }, [debouncedQuery, searchQuery, router]);

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
