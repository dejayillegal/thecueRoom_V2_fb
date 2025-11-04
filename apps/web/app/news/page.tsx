
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewsFilters, NewsFilterValues } from '@/components/News/NewsFilters';
import { NewsList } from '@/components/News/NewsList';

const DEFAULT_TAGS = ['techno', 'house', 'production', 'gear', 'events', 'interviews'];

function getInitialFiltersFromURL(searchParams: URLSearchParams): NewsFilterValues {
  return {
    search: searchParams.get('search') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    platform: (searchParams.get('platform') as any) || 'all',
    sort: (searchParams.get('sort') as 'latest' | 'popular') || 'latest',
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true' || undefined,
  };
}

export default function NewsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NewsFilterValues>(() => 
    getInitialFiltersFromURL(searchParams)
  );

  const handleFiltersChange = useCallback((newFilters: NewsFilterValues) => {
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
            initialFilters={filters}
          />
          <div className="lg:col-span-3">
            <NewsList filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
