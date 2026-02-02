'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  ExternalLink, 
  Music, 
  Youtube, 
  Disc, 
  Radio, 
  Share2, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Mic2,
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  Layout,
  Smartphone,
  Instagram,
  Twitter
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SocialLink {
  id: string;
  label: string;
  url: string;
  type: string;
  visible: boolean;
  thumbnail?: string;
  metadata?: {
    title?: string;
    author?: string;
  };
}

export default function BioLinkStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [newLink, setNewLink] = useState({ label: '', url: '', type: 'other' });
  const [artist, setArtist] = useState<any>(null);
  const [profileData, setProfileData] = useState({ artistName: '', avatar: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setArtist(data);
        setProfileData({
          artistName: data.profile?.artistName || '',
          avatar: data.profile?.avatar || ''
        });
        const socialLinks = data.profile?.socialLinks || [];
        setLinks(Array.isArray(socialLinks) 
          ? socialLinks.map((l: any, i: number) => ({
              id: l.id || `link-${i}-${Date.now()}`,
              label: l.label,
              url: l.url,
              type: l.type || detectType(l.url),
              visible: l.visible ?? true,
              thumbnail: l.thumbnail,
              metadata: l.metadata
            }))
          : Object.entries(socialLinks).map(([label, url], i) => ({ 
              id: `link-${i}-${Date.now()}`,
              label, 
              url: url as string, 
              type: detectType(url as string),
              visible: true
            }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load studio data');
    } finally {
      setLoading(false);
    }
  };

  const detectType = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('spotify.com')) return 'spotify';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
    if (lowerUrl.includes('apple.com/music')) return 'apple';
    if (lowerUrl.includes('bandcamp.com')) return 'bandcamp';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) return 'x';
    return 'other';
  };

  const fetchMetadata = async (url: string) => {
    const type = detectType(url);
    const supportedOEmbed = ['spotify', 'youtube', 'soundcloud'];
    if (!supportedOEmbed.includes(type)) return null;

    try {
      let oembedUrl = '';
      if (type === 'spotify') oembedUrl = `https://open.spotify.com/oembed?url=${url}`;
      if (type === 'youtube') oembedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
      if (type === 'soundcloud') oembedUrl = `https://soundcloud.com/oembed?url=${url}&format=json`;

      if (!oembedUrl) return null;

      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          thumbnail: data.thumbnail_url,
          title: data.title,
          author: data.author_name
        };
      }
    } catch (e) {
      console.warn('Metadata fetch failed:', e);
    }
    return null;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          socialLinks: links,
          artistName: profileData.artistName,
          avatar: profileData.avatar
        }),
      });

      if (!response.ok) throw new Error('Failed to save changes');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = async () => {
    if (!newLink.url) return;
    const type = detectType(newLink.url);
    const metadata = await fetchMetadata(newLink.url);
    
    const link: SocialLink = {
      id: `link-${Date.now()}`,
      label: newLink.label || metadata?.title || (type !== 'other' ? type.charAt(0).toUpperCase() + type.slice(1) : 'New Link'),
      url: newLink.url,
      type,
      visible: true,
      thumbnail: metadata?.thumbnail,
      metadata: metadata ? { title: metadata.title, author: metadata.author } : undefined
    };

    setLinks([link, ...links]);
    setNewLink({ label: '', url: '', type: 'other' });
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'spotify': return <Disc size={18} className="text-[#1DB954]" />;
      case 'youtube': return <Youtube size={18} className="text-[#FF0000]" />;
      case 'soundcloud': return <Radio size={18} className="text-[#FF3300]" />;
      case 'apple': return <Music size={18} className="text-[#FA243C]" />;
      case 'bandcamp': return <Disc size={18} className="text-[#629AA9]" />;
      case 'instagram': return <Instagram size={18} className="text-[#E4405F]" />;
      case 'x': return <Twitter size={18} className="text-[#1DA1F2]" />;
      default: return <Globe size={18} className="text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D7FF3C] selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D7FF3C]/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#9B5CFF]/5 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 h-screen overflow-hidden">
        {/* Left Panel: Composer */}
        <div className="lg:col-span-7 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-md">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                Bio Link <span className="text-[#D7FF3C]">Studio</span>
              </h1>
              <div className="h-0.5 w-12 bg-[#D7FF3C] mt-1 rounded-full animate-pulse" />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 h-11 px-8 gap-3 font-bold uppercase text-[11px] tracking-[0.2em] rounded-none shadow-[0_0_20px_rgba(215,255,60,0.2)]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Syncing' : saved ? 'Synced' : 'Deploy Changes'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide overscroll-contain">
            {/* Artist Identity Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Edit2 size={16} className="text-[#D7FF3C]" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Artist Identity</h2>
              </div>
              <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm rounded-none overflow-hidden group">
                <CardContent className="p-6 space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Artist Name</Label>
                      <Input 
                        value={profileData.artistName}
                        onChange={(e) => setProfileData({ ...profileData, artistName: e.target.value })}
                        placeholder="Public Artist Name"
                        className="bg-black/40 border-white/10 text-white font-mono text-xs rounded-none h-11 focus:border-[#D7FF3C]/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Avatar URL</Label>
                      <Input 
                        value={profileData.avatar}
                        onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                        placeholder="Avatar Image URL"
                        className="bg-black/40 border-white/10 text-white font-mono text-xs rounded-none h-11 focus:border-[#D7FF3C]/50 transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Quick Add Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Plus size={16} className="text-[#D7FF3C]" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Add New Signal</h2>
              </div>
              <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm rounded-none overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D7FF3C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-6 space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Platform Label</Label>
                      <Input 
                        value={newLink.label}
                        onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                        placeholder="e.g. New Single, Spotify"
                        className="bg-black/40 border-white/10 text-white font-mono text-xs rounded-none h-11 focus:border-[#D7FF3C]/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Signal URL</Label>
                      <Input 
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="Paste link here..."
                        className="bg-black/40 border-white/10 text-white font-mono text-xs rounded-none h-11 focus:border-[#D7FF3C]/50 transition-all"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={addLink} 
                    className="w-full bg-white/5 hover:bg-[#D7FF3C]/10 border border-white/5 text-white hover:text-[#D7FF3C] gap-3 font-bold uppercase text-[10px] tracking-[0.3em] h-12 transition-all"
                  >
                    Inject Signal Node
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Active Links Section */}
            <section className="space-y-6 pb-20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Layout size={16} className="text-[#D7FF3C]" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Active Pipeline</h2>
                </div>
                <div className="flex items-center gap-4">
                  <a 
                    href={`/link/${artist?.user?.username}`} 
                    target="_blank" 
                    prefetch={false}
                    className="text-[9px] font-bold uppercase tracking-widest text-[#D7FF3C] hover:underline flex items-center gap-2"
                  >
                    <ExternalLink size={10} />
                    Public Bio Link
                  </a>
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{links.length} nodes online</span>
                </div>
              </div>

            <Reorder.Group axis="y" values={links} onReorder={setLinks}>
              <AnimatePresence mode="popLayout">
                {links.map((link) => (
                  <Reorder.Item 
                    key={link.id} 
                    value={link}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                      <div className={cn(
                        "group relative flex items-center gap-4 p-5 bg-zinc-900/30 border border-white/5 hover:border-[#D7FF3C]/20 transition-all backdrop-blur-sm",
                        !link.visible && "opacity-40 grayscale"
                      )}>
                        <div className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 transition-colors">
                          <GripVertical size={20} />
                        </div>

                        <div className="w-12 h-12 bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-[#D7FF3C]/30 transition-all overflow-hidden">
                          {link.thumbnail ? (
                            <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getIcon(link.type)
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.1em] truncate">
                              {link.label}
                            </h4>
                            {link.visible ? (
                              <div className="w-1 h-1 bg-[#D7FF3C] rounded-full shadow-[0_0_8px_#D7FF3C]" />
                            ) : null}
                          </div>
                          <p className="text-[9px] text-zinc-600 font-mono truncate">{link.url}</p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleVisibility(link.id)}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                            title={link.visible ? "Hide" : "Show"}
                          >
                            {link.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button 
                            onClick={() => removeLink(link.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>

              {links.length === 0 && (
                <div className="py-24 border border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                    <Globe size={24} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 font-bold">No signal nodes initialized</p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center bg-zinc-950/40 relative overflow-hidden">
          {/* Signal Wave Animation */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 1.3 }}
                style={{ position: 'absolute', width: '500px', height: '500px', border: '1px solid #D7FF3C', borderRadius: '50%' }}
              />
            ))}
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <Smartphone size={16} className="text-[#D7FF3C]" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Signal Preview</h3>
            </div>

            {/* Device Frame */}
            <div className="relative w-[340px] h-[680px] bg-[#0F0F0F] border-[12px] border-zinc-900 rounded-[3.5rem] shadow-2xl shadow-black/50 overflow-hidden group">
              {/* Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-zinc-900 rounded-b-3xl z-30" />
              
              {/* Screen Content */}
              <div className="h-full overflow-y-auto scrollbar-hide bg-[#0B0B0B] relative">
                {/* Artist Header */}
                <div className="pt-20 pb-8 px-8 text-center border-b border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent">
                  <motion.div 
                    layoutId="preview-avatar"
                    style={{
                      width: '6rem',
                      height: '6rem',
                      backgroundColor: '#18181b',
                      borderRadius: '9999px',
                      margin: '0 auto 1.5rem',
                      border: '1px solid rgba(215, 255, 60, 0.2)',
                      padding: '0.25rem',
                      position: 'relative'
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden">
                       <img src={profileData.avatar || artist?.profile?.avatar || '/placeholder-avatar.jpg'} alt="" className="w-full h-full object-cover grayscale" />
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#D7FF3C] rounded-full border-4 border-[#0B0B0B] shadow-[0_0_10px_#D7FF3C]" />
                  </motion.div>
                  <h4 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">
                    {profileData.artistName || artist?.profile?.artistName || 'Artist Name'}
                  </h4>
                  <p className="text-[10px] font-mono text-[#D7FF3C] tracking-widest lowercase opacity-60">
                    @{artist?.user?.username || 'handle'}
                  </p>
                </div>

                {/* Preview Links */}
                <div className="p-6 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {links.filter(l => l.visible).map((link, i) => (
                      <motion.div
                        key={link.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="group/link relative p-4 bg-zinc-900/60 border border-white/5 hover:border-[#D7FF3C]/40 transition-all flex items-center gap-4">
                          <div className="w-10 h-10 bg-black/40 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                            {link.thumbnail ? (
                              <img src={link.thumbnail} alt="" className="w-full h-full object-cover group-hover/link:scale-110 transition-transform" />
                            ) : (
                              <div className="text-white">
                                {getIcon(link.type)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover/link:text-[#D7FF3C] transition-colors truncate block">
                              {link.label}
                            </span>
                            {link.metadata?.author && (
                              <span className="text-[8px] text-zinc-500 uppercase tracking-widest truncate block">
                                {link.metadata.author}
                              </span>
                            )}
                          </div>
                          <ExternalLink size={12} className="text-zinc-700 group-hover/link:text-[#D7FF3C] transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {links.filter(l => l.visible).length === 0 && (
                    <div className="py-20 text-center space-y-4 opacity-20">
                      <Globe size={32} className="mx-auto" />
                      <p className="text-[9px] uppercase tracking-[0.4em]">Signal Offline</p>
                    </div>
                  )}
                </div>

                {/* Footer Logo */}
                <div className="p-12 text-center opacity-20 mt-auto">
                   <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-white">thecueRoom</p>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-zinc-800 rounded-full z-30" />
            </div>

            {/* Platform Accent Dots */}
            <div className="flex gap-4 mt-8 opacity-40">
               {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
