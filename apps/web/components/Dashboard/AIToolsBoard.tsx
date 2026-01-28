"use client";

import { motion } from "framer-motion";
import { Sparkles, FileText, Image, MessageSquare } from "lucide-react";
import Link from "next/link";

const TOOLS = [
  {
    id: "cover-art",
    title: "Cover Art Studio",
    desc: "AI-driven professional music artwork generation with SVG presets.",
    icon: Image,
    href: "/dashboard/ai-cover-art",
    tag: "NEW"
  },
  {
    id: "epk",
    title: "EPK Generator",
    desc: "Professional press kits with AI bios and technical riders.",
    icon: FileText,
    href: "/dashboard/ai-epk",
    tag: "IMPROVED"
  },
  {
    id: "meme",
    title: "Viral Meme Lab",
    desc: "Music culture specific meme generation for rapid engagement.",
    icon: MessageSquare,
    href: "/dashboard/ai-meme",
    tag: "BETA"
  }
];

export function AIToolsBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-white/5">
      {TOOLS.map((tool, idx) => (
        <Link 
          key={tool.id} 
          href={tool.href}
          className="group relative p-12 transition-all hover:bg-white/[0.02]"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#D7FF3C]/30 transition-all duration-500">
                <tool.icon className="w-6 h-6 text-[#9B5CFF] group-hover:text-[#D7FF3C] transition-colors" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D7FF3C] border border-[#D7FF3C]/20 px-2 py-0.5 rounded">
                {tool.tag}
              </span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white tracking-tight">{tool.title}</h4>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                {tool.desc}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <div className="h-px flex-1 bg-white/5 group-hover:bg-[#D7FF3C]/10 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-[#D7FF3C] transition-all">
                START
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
