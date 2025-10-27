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
  const [done, setDone] = useState(false);

  const loadMore = useCallback(async () => {
    if (loadingMore || done) return;

    setLoadingMore(true);
    try {
      const currentOffset = allItems.length;
      const res = await fetch(`/api/feeds?limit=60&offset=${currentOffset}`);
      const newItems = await res.json();

      if (newItems.length === 0) {
        setDone(true);
      } else {
        setAllItems(prev => [...prev, ...newItems]);
      }
    } catch (error) {
      console.error("Failed to fetch more feed items:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, done, allItems.length]);

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      setLoading(true);
      fetch('/api/feeds?limit=44')
        .then(res => res.json())
        .then(items => {
          setAllItems(items);
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
                hasMore={!done && !selectedTag} // Only enable infinite scroll if no tag is selected
                isLoading={loadingMore}
            />
        </div>
      </section>
    </div>
  );
}
