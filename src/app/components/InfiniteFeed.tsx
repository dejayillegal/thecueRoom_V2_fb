
"use client";
import { useEffect, useRef } from "react";
import FeedWall from "./FeedWall";
import { FeedItem } from "./HomeClient";

export default function InfiniteFeed({
  items, onTag, loadMore, hasMore, isLoading
}:{ 
  items: FeedItem[]; 
  onTag?: (t:string)=>void; 
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}) {
  const sentry = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentry.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentry.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, loadMore]);

  return (
    <>
      <FeedWall items={items} onTag={onTag} />
      <div ref={sentry} className="h-8" />
      <div className="flex justify-center py-4">
        {hasMore && (
          <button disabled={isLoading} onClick={loadMore}
            className="px-4 py-2 rounded-lg ring-1 ring-neutral-800 bg-[#0F0F10] text-sm hover:bg-[#151517]">
            {isLoading ? "Loading…" : "Load more"}
          </button>
        )}
         {!hasMore && !isLoading && items.length > 0 && (
          <p className="text-sm text-neutral-500">You've reached the end.</p>
        )}
        {items.length === 0 && !isLoading && (
            <p className="text-sm text-neutral-400">No articles found for this filter.</p>
        )}
      </div>
    </>
  );
}

