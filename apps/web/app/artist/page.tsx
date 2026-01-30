import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbClient } from "@thecueroom/db/client";
import { users } from "@thecueroom/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function ArtistDirectoryPage() {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    redirect('/dashboard');
  }

  const db = getDbClient();
  const artists = await db.select().from(users).where(eq(users.role, 'artist'));

  return (
    <div className="p-8 space-y-8 bg-[#0B0B0B] min-h-screen text-white">
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase flex items-center gap-3">
            <Shield className="text-[#D1FF3D]" /> Artist Social Layer
          </h1>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-2">Secure Artist-Only Environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <Link href={`/artist/${artist.id}`} key={artist.id}>
            <Card className="bg-black/40 border-white/5 hover:border-[#D1FF3D]/50 transition-all duration-500 group cursor-pointer overflow-hidden rounded-none">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-900 border border-white/10 overflow-hidden relative">
                   <div className="absolute inset-0 bg-[#D1FF3D]/5 group-hover:bg-[#D1FF3D]/10 transition-colors" />
                   <div className="w-full h-full flex items-center justify-center text-zinc-700">
                     <Users size={32} />
                   </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight uppercase group-hover:text-[#D1FF3D] transition-colors">{artist.username || artist.email.split('@')[0]}</h3>
                  <Badge variant="outline" className="rounded-none border-zinc-800 text-zinc-500 font-mono text-[8px] uppercase">Node Verified</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
