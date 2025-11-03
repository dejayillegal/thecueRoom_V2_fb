'use client';

import { CategorySidebar } from './CategorySidebar';
import { ThreadsList } from './ThreadsList';
import { ForumSidebar } from './ForumSidebar';
import Link from 'next/link';

export function ForumList() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-2">
            <CategorySidebar />
          </div>

          <div className="lg:col-span-7">
            <ThreadsList />
          </div>

          <div className="lg:col-span-3">
            <ForumSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}