import { Logo } from '@/components/Logo';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="hero-glow" />
      <div className="grain-overlay" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <Logo className="w-32 h-32 md:w-48 md:h-48" />
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
            thecueRoom V2
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Your hub for underground techno & house music news, AI creative tools, and community.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <Link 
              href="/feeds" 
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              Explore Feeds
            </Link>
            <Link 
              href="/ai/cover-art" 
              className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              AI Studio
            </Link>
            <Link 
              href="/community" 
              className="px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-all transform hover:scale-105 border border-border"
            >
              Community
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2 text-primary">Global News Feeds</h3>
              <p className="text-muted-foreground">
                Curated techno & house news from 60+ worldwide sources with fast loading and rich previews.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2 text-primary">AI Creative Tools</h3>
              <p className="text-muted-foreground">
                Generate cover art, EPKs, memes, and avatars with advanced AI or local fallbacks.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2 text-primary">Community Hub</h3>
              <p className="text-muted-foreground">
                Connect with artists, discover gigs, share memes, and join the underground scene.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
