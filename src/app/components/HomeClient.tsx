"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import HeroDeck from "./HeroDeck";
import InfiniteFeed from "./InfiniteFeed";
import { Skeleton } from "@/components/ui/skeleton";

export type FeedItem = { title:string; source:string; url:string; publishedAt:string; summary:string; image:string; tags:string[]; excerpt?: string; };

export default function HomeClient({ initialItems }: { initialItems: FeedItem[] }) {
  const [allItems, setAllItems] = useState<FeedItem[]>(initialItems || []);
  const [loading, setLoading] = useState(!initialItems || initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const url = nextCursor 
        ? `/api/feeds?limit=48&cursor=${nextCursor}`
        : `/api/feeds?limit=48&offset=${allItems.length}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch feeds');
      
      const json = await res.json();
      const newItems = json.data || [];
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setAllItems(prev => [...prev, ...newItems]);
        setNextCursor(json.nextCursor || null);
        setHasMore(json.hasMore ?? false);
      }
    } catch (error) {
      console.error("Failed to fetch more feed items:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, allItems.length, nextCursor]);

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      setLoading(true);
      fetch('/api/feeds?limit=48')
        .then(async res => {
          if (!res.ok) throw new Error('Failed to fetch feeds');
          const json = await res.json();
          const items = json.data || [];
          setAllItems(items);
          setNextCursor(json.nextCursor || null);
          setHasMore(json.hasMore ?? false);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch feed items:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [initialItems]);
  
  const handleTagClick = (tag: string) => {
    setSelectedTag(tag.toLowerCase());
    const feedPane = document.getElementById('feed-pane');
    if (feedPane) {
      feedPane.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearFilter = () => {
    setSelectedTag(null);
  };

  const filteredItems = useMemo(() => {
    if (!selectedTag) return allItems;
    return allItems.filter(item => 
      item.tags && item.tags.map(t => t.toLowerCase()).includes(selectedTag)
    );
  }, [allItems, selectedTag]);

  const heroItems = useMemo(() => {
    return filteredItems.slice(0, 8);
  }, [filteredItems]);

  const feedItems = useMemo(() => {
    return filteredItems.slice(8);
  }, [filteredItems]);


  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-[50vh] md:h-[56vh] w-full" />
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="mb-6 break-inside-avoid">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section id="feed-pane">
        <HeroDeck items={heroItems} autoPlay loop layout="landing"/>
        <div className="relative mt-4">
            {selectedTag && (
                <div className="flex justify-end mb-2">
                    <button onClick={clearFilter} className="tcr-hash">
                        Clear filter &times;
                    </button>
                </div>
            )}
            <InfiniteFeed 
                items={feedItems}
                onTag={handleTagClick} 
                loadMore={loadMore}
                hasMore={hasMore && !selectedTag}
                isLoading={loadingMore}
            />
        </div>
      </section>
    </div>
  );
}
