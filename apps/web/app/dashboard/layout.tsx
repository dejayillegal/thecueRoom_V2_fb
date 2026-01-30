import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Shield, Home, MessageSquare, User, Settings, Music, LayoutDashboard } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isArtist = session?.role === 'artist' || session?.role === 'admin';
  
  return (
    <div className="flex h-screen bg-[#0B0B0B] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D1FF3D] rounded-sm flex items-center justify-center">
              <span className="text-black font-bold text-xl">C</span>
            </div>
            <span className="font-bold tracking-tighter uppercase text-xl">thecueRoom</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <LayoutDashboard size={18} className="group-hover:text-[#D1FF3D]" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Dashboard</span>
          </Link>
          
          <Link href="/community/forum" className="flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <MessageSquare size={18} className="group-hover:text-[#D1FF3D]" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Community Forum</span>
          </Link>
          
          {isArtist && (
            <Link href="/artist" className="flex items-center gap-3 p-3 text-[#D1FF3D] bg-[#D1FF3D]/5 hover:bg-[#D1FF3D]/10 transition-all group border border-[#D1FF3D]/20">
              <Shield size={18} className="animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Artist Social</span>
            </Link>
          )}

          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="px-3 text-[8px] uppercase tracking-[0.4em] text-zinc-600 mb-2">Creative Tools</p>
            <Link href="/ai/epk-generator" className="flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
              <Music size={18} className="group-hover:text-[#D1FF3D]" />
              <span className="text-[10px] uppercase tracking-[0.2em]">EPK Generator</span>
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/settings" className="flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <Settings size={18} />
            <span className="text-[10px] uppercase tracking-[0.2em]">Settings</span>
          </Link>
          <div className="flex items-center gap-3 p-3 text-zinc-400 border border-white/5 bg-zinc-900/50">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
              <User size={14} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] uppercase font-bold truncate">{session?.username || session?.email}</p>
              <p className="text-[7px] uppercase text-zinc-600 tracking-widest truncate">{session?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-black/20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            <span>System</span>
            <span className="text-zinc-700">/</span>
            <span className="text-white">Active</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D1FF3D] rounded-full animate-pulse shadow-[0_0_8px_#D1FF3D]" />
              <span className="text-[9px] font-mono text-[#D1FF3D]">Node Online</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
