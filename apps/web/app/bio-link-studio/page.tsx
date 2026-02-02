'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Mic2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialLink {
  label: string;
  url: string;
  type: string;
}

export default function BioLinkStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [newLink, setNewLink] = useState({ label: '', url: '', type: 'other' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        // Assume socialLinks is stored as an array or Record in the profile
        const socialLinks = data.profile?.socialLinks || [];
        setLinks(Array.isArray(socialLinks) ? socialLinks : Object.entries(socialLinks).map(([label, url]) => ({ 
          label, 
          url: url as string, 
          type: 'other' 
        })));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load your bio link data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: links }),
      });

      if (!response.ok) throw new Error('Failed to save links');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLink.label || !newLink.url) return;
    setLinks([...links, { ...newLink }]);
    setNewLink({ label: '', url: '', type: 'other' });
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'spotify': return <Disc size={18} className="text-[#1DB954]" />;
      case 'youtube': return <Youtube size={18} className="text-[#FF0000]" />;
      case 'podcast': return <Mic2 size={18} className="text-[#9B5CFF]" />;
      case 'soundcloud': return <Radio size={18} className="text-[#FF3300]" />;
      default: return <Globe size={18} className="text-[#D7FF3C]" />;
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
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Bio Link Studio</h1>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Customize your artist digital identity</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 h-10 px-6 gap-2 font-bold uppercase text-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Syncing...' : saved ? 'Synced' : 'Sync Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-300">Add New Signal</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-wider text-zinc-500">Connect a new platform to your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Platform Label</Label>
                <Input 
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="e.g. Latest DJ Set, Spotify"
                  className="bg-black/50 border-white/10 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">URL</Label>
                <Input 
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="bg-black/50 border-white/10 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Type</Label>
                <select 
                  className="w-full h-10 bg-black/50 border-white/10 text-white font-mono text-xs px-3 rounded-md outline-none focus:border-[#D7FF3C]/50 transition-colors"
                  value={newLink.type}
                  onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                >
                  <option value="other">General Link</option>
                  <option value="spotify">Spotify</option>
                  <option value="youtube">YouTube</option>
                  <option value="podcast">Podcast</option>
                  <option value="soundcloud">SoundCloud</option>
                </select>
              </div>
              <Button onClick={addLink} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white gap-2 font-bold uppercase text-[10px] tracking-widest mt-2">
                <Plus size={14} /> Add Signal Node
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 pl-2">Active Signal Nodes</h3>
            {links.map((link, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-zinc-900/30 border border-white/5 hover:border-[#D7FF3C]/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {getIcon(link.type)}
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">{link.label}</p>
                    <p className="text-[9px] text-zinc-600 font-mono truncate max-w-[200px]">{link.url}</p>
                  </div>
                </div>
                <button onClick={() => removeLink(index)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
            {links.length === 0 && (
              <div className="p-12 border border-dashed border-white/5 text-center text-zinc-700 uppercase text-[10px] tracking-[0.3em]">
                No signals connected
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4 text-center">Live Preview</h3>
            <div className="w-[320px] h-[580px] bg-black border-[8px] border-zinc-800 rounded-[3rem] mx-auto overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 bg-[#0B0B0B]">
                <div className="p-8 text-center pt-12">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full mx-auto mb-4 border border-[#D7FF3C]/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                  <h4 className="text-white font-black text-xl tracking-tighter uppercase italic">Preview Artist</h4>
                  <p className="text-[#D7FF3C] font-mono text-[9px] lowercase opacity-70 mb-8">@artist_handle</p>
                  
                  <div className="space-y-3">
                    {links.map((link, i) => (
                      <div key={i} className="w-full py-3 px-4 bg-zinc-900/80 border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white flex items-center justify-between">
                        <span>{link.label}</span>
                        <ExternalLink size={12} className="text-zinc-600" />
                      </div>
                    ))}
                    {links.length === 0 && (
                      <div className="space-y-3 opacity-20">
                         {[1,2,3].map(n => <div key={n} className="w-full h-10 bg-zinc-900 rounded-sm" />)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Phone elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
