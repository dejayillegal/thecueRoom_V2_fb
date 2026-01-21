"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image as ImageIcon, FileText, Laugh, TrendingUp } from "lucide-react";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

interface AIToolUsage {
  usage: number;
  newTemplates: number;
  recentCount?: number;
}

interface AIToolsData {
  coverArt: AIToolUsage;
  epk: AIToolUsage;
  meme: AIToolUsage;
}

interface AIToolsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  usage: AIToolUsage;
  link: string;
  accentColor: string;
}

function AIToolCard({ title, description, icon, usage, link, accentColor }: AIToolsCardProps) {
  return (
    <Link href={link} className="h-full block group">
      <Card className="bg-[#111] border-white/5 p-6 hover:scale-[1.02] hover:border-[#D7FF3C]/30 transition-all duration-500 relative overflow-hidden h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D7FF3C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
              {icon}
            </div>
            {usage.newTemplates > 0 && (
              <Badge variant="outline" className="text-[10px] bg-[#D7FF3C]/10 text-[#D7FF3C] border-[#D7FF3C]/20 font-black uppercase tracking-widest px-2 py-0.5">
                {usage.newTemplates} New
              </Badge>
            )}
          </div>

          <h3 className="text-white text-xl font-black mb-2 group-hover:text-[#D7FF3C] transition-colors tracking-tight">
            {title}
          </h3>
          <p className="text-gray-400 text-sm mb-6 flex-1 font-medium leading-relaxed">
            {description}
          </p>

          <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5 text-[#D7FF3C]/50" />
              <span>{usage.usage} active</span>
            </div>
            <div className="text-[#D7FF3C] group-hover:translate-x-1 transition-transform duration-300">
              <span className="text-xs font-black uppercase tracking-tighter">Start →</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface AIToolsBoardProps {
  className?: string;
}

export function AIToolsBoard({ className = "" }: AIToolsBoardProps) {
  const [aiToolsData, setAiToolsData] = useState<AIToolsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAITools = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/overview`, { cache: "no-store" });
        const data = await response.json();
        
        if (data.aiTools) {
          setAiToolsData(data.aiTools);
        }
      } catch (err) {
        console.error("Failed to fetch AI tools data:", err);
        setError("Failed to load AI tools");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAITools();
    
    // Refresh AI tools data every 2 minutes
    const interval = setInterval(fetchAITools, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        <SkeletonCard variant="compact" />
        <SkeletonCard variant="compact" />
        <SkeletonCard variant="compact" />
      </div>
    );
  }

  if (error || !aiToolsData) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-[#D7FF3C]" />
        <h2 className="text-white text-2xl font-bold">AI Tools</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AIToolCard
          title="Cover Art Generator"
          description="Create stunning album covers and track artwork with AI"
          icon={<ImageIcon className="h-6 w-6 text-white" />}
          usage={aiToolsData.coverArt}
          link="/ai/cover-art"
          accentColor="from-purple-500 to-pink-500"
        />
        
        <AIToolCard
          title="EPK Generator"
          description="Generate professional Electronic Press Kits instantly"
          icon={<FileText className="h-6 w-6 text-white" />}
          usage={aiToolsData.epk}
          link="/ai/epk-generator"
          accentColor="from-blue-500 to-cyan-500"
        />
        
        <AIToolCard
          title="Meme Studio"
          description="Create viral music memes for social media"
          icon={<Laugh className="h-6 w-6 text-white" />}
          usage={aiToolsData.meme}
          link="/ai/meme-studio"
          accentColor="from-orange-500 to-yellow-500"
        />
      </div>
    </div>
  );
}
