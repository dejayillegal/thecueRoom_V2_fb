'use client';

import { useState, type ReactNode } from 'react';
import { MessageSquare, Disc3, Mic, Headphones, Radio, Settings, Plus } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: ReactNode;
  count: number;
  color: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All Threads', icon: <MessageSquare className="w-4 h-4" />, count: 1247, color: '#D7FF3C' },
  { id: 'gear', name: 'Gear Talk', icon: <Disc3 className="w-4 h-4" />, count: 423, color: '#9B5CFF' },
  { id: 'production', name: 'Production', icon: <Mic className="w-4 h-4" />, count: 312, color: '#FF5C9B' },
  { id: 'listening', name: 'Listening Room', icon: <Headphones className="w-4 h-4" />, count: 198, color: '#5CFFDB' },
  { id: 'industry', name: 'Industry News', icon: <Radio className="w-4 h-4" />, count: 145, color: '#FFD75C' },
  { id: 'general', name: 'General', icon: <Settings className="w-4 h-4" />, count: 169, color: '#9999FF' },
];

export function CategorySidebar() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="sticky top-6">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Categories</h3>
          <button className="p-1 hover:bg-[#1a1a1a] rounded transition-colors">
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <nav className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                transition-all duration-150 group
                ${activeCategory === category.id 
                  ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
                  : 'hover:bg-[#111111]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg
                    ${activeCategory === category.id ? 'bg-opacity-20' : 'bg-opacity-10'}
                    transition-all
                  `}
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div style={{ color: category.color }}>
                    {category.icon}
                  </div>
                </div>
                <span className={`
                  text-sm font-medium transition-colors
                  ${activeCategory === category.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                `}>
                  {category.name}
                </span>
              </div>
              <span className={`
                text-xs font-medium px-2 py-0.5 rounded-full
                ${activeCategory === category.id 
                  ? 'bg-[#D7FF3C] text-black' 
                  : 'bg-[#1a1a1a] text-gray-500'
                }
              `}>
                {category.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
          <Link 
            href="/community/forum/compose"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        </div>
      </div>
    </div>
  );
}
