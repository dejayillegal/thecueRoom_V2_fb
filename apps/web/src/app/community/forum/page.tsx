"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  ThumbsUp,
  Award,
  Pin,
  ChevronRight,
  Users,
  Menu,
  X,
} from "lucide-react";

interface Thread {
  id: string;
  title: string;
  slug: string;
  body: string;
  viewCount: number;
  replyCount: number;
  likesCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    username: string;
    verified: boolean;
  };
  profile: {
    displayName: string;
    artistName: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

export default function ForumPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { name: "All Threads", slug: null },
    { name: "General Discussion", slug: "general" },
    { name: "Production Tips", slug: "production" },
    { name: "Collaborations", slug: "collaborations" },
    { name: "Industry News", slug: "industry-news" },
    { name: "Feedback & Reviews", slug: "feedback" },
  ];

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forum/thread?sort=newest&limit=20");
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = selectedCategory
    ? threads.filter((t) => t.category?.slug === selectedCategory)
    : threads;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Community Forum
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              Connect with fellow music creators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileCategories(!showMobileCategories)}
              className="lg:hidden p-2 bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {showMobileCategories ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Button
              onClick={() => router.push("/community/forum/new")}
              className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Thread</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {showMobileCategories && (
          <div className="lg:hidden mb-4 bg-[#111111] border border-[#1a1a1a] rounded-lg p-3">
            <h3 className="text-white font-semibold mb-2 text-sm">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug ?? "all"}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setShowMobileCategories(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-[#D1FF3D] text-black"
                      : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="hidden lg:block bg-[#111111] border-[#1a1a1a] p-4 h-fit">
            <h3 className="text-white font-semibold mb-3 text-sm">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.slug ?? "all"}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-[#D1FF3D]/10 text-[#D1FF3D]"
                      : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="bg-[#111111] border-[#1a1a1a] p-4 animate-pulse"
                  >
                    <div className="h-5 bg-[#1a1a1a] rounded w-3/4 mb-3" />
                    <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <Card className="bg-[#111111] border-[#1a1a1a] p-6 sm:p-8 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-600 mb-3" />
                <h3 className="text-white font-medium mb-1 text-sm sm:text-base">
                  No threads yet
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mb-4">
                  Be the first to start a conversation!
                </p>
                <Button
                  onClick={() => router.push("/community/forum/new")}
                  className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] text-xs sm:text-sm"
                >
                  Create Thread
                </Button>
              </Card>
            ) : (
              filteredThreads.map((thread) => (
                <Card
                  key={thread.id}
                  onClick={() =>
                    router.push(`/community/forum/thread/${thread.slug}`)
                  }
                  className="bg-[#111111] border-[#1a1a1a] p-3 sm:p-4 hover:border-[#333333] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && (
                          <Pin className="w-3 h-3 text-[#D1FF3D] flex-shrink-0" />
                        )}
                        <h3 className="text-white font-medium text-sm sm:text-base truncate group-hover:text-[#D1FF3D] transition-colors">
                          {thread.title}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-2">
                        {thread.body.substring(0, 120)}...
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span className="text-[#D1FF3D]/70">
                          {thread.category?.name}
                        </span>
                        <span className="hidden sm:inline">
                          by {thread.user?.username}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {thread.replyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {thread.likesCount}
                        </span>
                        <span className="hidden sm:inline">
                          {formatDate(thread.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#D1FF3D] transition-colors flex-shrink-0 mt-1" />
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="hidden lg:block bg-[#111111] border-[#1a1a1a] p-4 h-fit">
            <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {["admin", "test1", "test2"].map((name, i) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D1FF3D] to-[#a8cc31] flex items-center justify-center text-black text-xs font-bold">
                      {name[0].toUpperCase()}
                    </div>
                    {i === 0 && (
                      <Award className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{name}</p>
                    <p className="text-xs text-gray-500">
                      {["Creator", "Member", "Member"][i]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
