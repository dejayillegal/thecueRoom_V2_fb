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
    <Link href={link}>
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 hover:scale-[1.02] hover:border-[#333] transition-all duration-300 group h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {usage.newTemplates > 0 && (
            <Badge variant="outline" className="text-xs bg-[#D7FF3C]/10 text-[#D7FF3C] border-[#D7FF3C]/20">
              {usage.newTemplates} New
            </Badge>
          )}
        </div>

        <h3 className="text-white text-lg font-semibold mb-2 group-hover:text-[#D7FF3C] transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          {description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp className="h-3 w-3" />
            <span>{usage.usage} uses this week</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-[#1a1a1a] text-xs"
          >
            Create Now →
          </Button>
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
        const response = await fetch(`/api/dashboard/overview`);
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
          link="/ai/cover-art?from=dashboard"
          accentColor="from-purple-500 to-pink-500"
        />
        
        <AIToolCard
          title="EPK Generator"
          description="Generate professional Electronic Press Kits instantly"
          icon={<FileText className="h-6 w-6 text-white" />}
          usage={aiToolsData.epk}
          link="/epk?from=dashboard"
          accentColor="from-blue-500 to-cyan-500"
        />
        
        <AIToolCard
          title="Meme Generator"
          description="Create viral music memes for social media"
          icon={<Laugh className="h-6 w-6 text-white" />}
          usage={aiToolsData.meme}
          link="/meme?from=dashboard"
          accentColor="from-orange-500 to-yellow-500"
        />
      </div>
    </div>
  );
}
