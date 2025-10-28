
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import Image from 'next/image';

interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  source: string;
  tags: string[];
  publishedAt: string;
}

export default function NewsPage() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeds();
  }, [selectedTags, searchQuery]);

  const fetchFeeds = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTags.length) params.set('tags', selectedTags.join(','));

      const response = await fetch(`/api/feeds?${params}`);
      const data = await response.json();
      setFeeds(data.data || []);
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = ['techno', 'house', 'production', 'gear', 'events', 'interviews'];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">News</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className="pl-10 bg-[#111111] border-[#1a1a1a] text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="bg-[#111111] border-[#1a1a1a] p-4 h-fit">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <div className="space-y-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
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
          </Card>

          {/* Feed Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <p className="text-gray-500 col-span-2">Loading...</p>
            ) : feeds.length === 0 ? (
              <p className="text-gray-500 col-span-2">No news found</p>
            ) : (
              feeds.map((item) => (
                <Card key={item.id} className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:border-[#333333] transition-colors">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.image && (
                      <div className="aspect-video bg-[#0a0a0a] relative">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-medium mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#D1FF3D]">{item.source}</span>
                        <span className="text-gray-500">{new Date(item.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </a>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
