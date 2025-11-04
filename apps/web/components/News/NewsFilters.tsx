
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Calendar, SortDesc } from 'lucide-react';
import { useDebounce } from '@/../../src/hooks/use-debounce';

export interface NewsFilterValues {
  search: string;
  tags: string[];
  platform?: string;
  sort?: 'latest' | 'popular';
  dateFrom?: string;
  dateTo?: string;
  verifiedOnly?: boolean;
}

interface NewsFiltersProps {
  onFiltersChange: (filters: NewsFilterValues) => void;
  availableTags?: string[];
  initialFilters?: Partial<NewsFilterValues>;
}

export function NewsFilters({ onFiltersChange, availableTags = [], initialFilters }: NewsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.tags || []);
  const [platform, setPlatform] = useState<string>(initialFilters?.platform || 'all');
  const [sort, setSort] = useState<'latest' | 'popular'>(initialFilters?.sort || 'latest');
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo || '');
  const [verifiedOnly, setVerifiedOnly] = useState(initialFilters?.verifiedOnly || false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      
      return newTags;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setPlatform('all');
    setSort('latest');
    setDateFrom('');
    setDateTo('');
    setVerifiedOnly(false);
  }, []);

  const hasActiveFilters = 
    searchQuery ||
    selectedTags.length > 0 ||
    platform !== 'all' ||
    sort !== 'latest' ||
    dateFrom ||
    dateTo ||
    verifiedOnly;

  // Trigger filter change when any filter value changes
  useEffect(() => {
    onFiltersChange({
      search: debouncedSearch,
      tags: selectedTags,
      platform: platform !== 'all' ? platform : undefined,
      sort,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      verifiedOnly: verifiedOnly || undefined,
    });
  }, [debouncedSearch, selectedTags, platform, sort, dateFrom, dateTo, verifiedOnly, onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search news..."
          className="pl-10 bg-[#111111] border-[#1a1a1a] text-white"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sort & Platform */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sort" className="text-gray-400 text-xs mb-1.5 block">
            <SortDesc className="w-3 h-3 inline mr-1" />
            Sort By
          </Label>
          <Select value={sort} onValueChange={(value) => setSort(value as 'latest' | 'popular')}>
            <SelectTrigger id="sort" className="bg-[#111111] border-[#1a1a1a] text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#1a1a1a]">
              <SelectItem value="latest" className="text-white">Latest</SelectItem>
              <SelectItem value="popular" className="text-white">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="platform" className="text-gray-400 text-xs mb-1.5 block">
            Platform
          </Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger id="platform" className="bg-[#111111] border-[#1a1a1a] text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#1a1a1a]">
              <SelectItem value="all" className="text-white">All Platforms</SelectItem>
              <SelectItem value="spotify" className="text-white">Spotify</SelectItem>
              <SelectItem value="soundcloud" className="text-white">SoundCloud</SelectItem>
              <SelectItem value="bandcamp" className="text-white">Bandcamp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-3">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-xs">
          <Calendar className="w-3 h-3" />
          Date Range
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="dateFrom" className="text-gray-400 text-xs mb-1 block">From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-xs"
            />
          </div>
          <div>
            <Label htmlFor="dateTo" className="text-gray-400 text-xs mb-1 block">To</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Tags Filter */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-3">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4" />
          Tags
        </h3>
        <div className="space-y-1">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-[#D1FF3D] text-black font-medium'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Verified Only Toggle */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="verified-only" className="text-white text-sm cursor-pointer">
            Only Verified Sources
          </Label>
          <Switch
            id="verified-only"
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
        </div>
      </Card>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          onClick={clearFilters}
          variant="outline"
          size="sm"
          className="w-full border-[#1a1a1a] hover:bg-[#1a1a1a] text-xs"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
