
'use client';

import { useState, useCallback } from 'react';
import { NewsFilters } from '@/components/News/NewsFilters';
import { NewsList } from '@/components/News/NewsList';

const DEFAULT_TAGS = ['techno', 'house', 'production', 'gear', 'events', 'interviews'];

export default function NewsPage() {
  const [filters, setFilters] = useState({
    search: '',
    tags: [] as string[],
  });

  const handleFiltersChange = useCallback((newFilters: { search: string; tags: string[] }) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">News</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <NewsFilters
            onFiltersChange={handleFiltersChange}
            availableTags={DEFAULT_TAGS}
          />
          <div className="lg:col-span-3">
            <NewsList filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
