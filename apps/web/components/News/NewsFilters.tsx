
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { useDebounce } from '@/../../src/hooks/use-debounce';

interface NewsFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    tags: string[];
  }) => void;
  availableTags?: string[];
}

export function NewsFilters({ onFiltersChange, availableTags = [] }: NewsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
  }, []);

  // Trigger filter change when debounced search or tags change
  useEffect(() => {
    onFiltersChange({
      search: debouncedSearch,
      tags: selectedTags,
    });
  }, [debouncedSearch, selectedTags]);

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
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tags Filter */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        <div className="space-y-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`w-full text-left px-3 py-2 rounded text-sm capitalize transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-[#D1FF3D] text-black'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {(selectedTags.length > 0 || searchQuery) && (
          <Button
            onClick={clearFilters}
            variant="outline"
            className="w-full mt-3 border-[#1a1a1a] hover:bg-[#1a1a1a]"
          >
            Clear All
          </Button>
        )}
      </Card>
    </div>
  );
}
