import { getSession } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0B0B]">
      <div className="flex flex-1 flex-col overflow-hidden">
        <nav className="p-4 border-b border-white/5 flex gap-4 bg-black/40 backdrop-blur-md">
           <Link href="/dashboard" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Home</Link>
           {(session?.role === 'artist' || session?.role === 'admin') && (
             <Link href="/artist" className="text-[10px] uppercase tracking-widest text-[#D1FF3D] font-bold animate-pulse">Artist Social</Link>
           )}
        </nav>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
