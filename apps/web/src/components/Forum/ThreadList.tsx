"use client";

import { useThreads } from "../../hooks/use-threads";
import { VirtualizedList } from "../VirtualizedList";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "../UserAvatar";
import { getArtistProfileHref } from "@/lib/navigation";

interface Thread {
  id: string;
  title: string;
  content: string;
  author: { username: string; verified: boolean; profile?: any };
  isPinned: boolean;
  viewCount: number;
  replyCount: number;
  likesCount: number;
  createdAt: string;
  category?: { name: string };
}

interface ThreadListProps {
  categoryId?: string;
  limit?: number;
}

export default function ThreadList({
  categoryId,
  limit = 25,
}: ThreadListProps) {
  const { threads, loading, error, loadMore, hasMore } = useThreads({
    categoryId,
    limit,
  });

  if (loading && !threads.length) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-4 rounded-lg animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg">
        <p className="font-semibold">Error loading threads</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Separate pinned and regular threads
  const pinnedThreads = threads.filter((t: Thread) => t.isPinned);
  const regularThreads = threads.filter((t: Thread) => !t.isPinned);
  const sortedThreads = [...pinnedThreads, ...regularThreads];

  const renderThread = (thread: Thread, index: number) => (
    <Link
      key={thread.id}
      href={`/community/thread/${thread.id}`}
      className="block bg-gray-800 hover:bg-gray-750 p-4 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {thread.isPinned && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2L13 8L19 9L14.5 13L16 19L10 16L4 19L5.5 13L1 9L7 8L10 2Z" />
                </svg>
                Pinned
              </span>
            )}
            {thread.category && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                {thread.category.name}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-1 truncate">
            {thread.title}
          </h3>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Link href={getArtistProfileHref(thread.author.username)} className="flex items-center gap-2 hover:text-[#D1FF3D] transition-colors">
              <UserAvatar profile={thread.author.profile} user={thread.author} size="sm" />
              <div className="flex flex-col">
                <span className="font-bold">{thread.author.profile?.artistName || thread.author.username}</span>
                <span className="text-[10px] text-zinc-500">@{thread.author.username}</span>
              </div>
              {thread.author.verified && (
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </Link>
            <span>
              {formatDistanceToNow(new Date(thread.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1" title="Views">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {thread.viewCount}
            </span>
            <span className="flex items-center gap-1" title="Replies">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {thread.replyCount}
            </span>
            <span className="flex items-center gap-1" title="Likes">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {thread.likesCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      <VirtualizedList
        items={sortedThreads}
        renderItem={renderThread}
        itemHeight={120}
        overscan={5}
        className="space-y-4"
      />

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
