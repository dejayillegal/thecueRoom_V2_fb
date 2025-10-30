
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedTechRiderPalette from '@/components/EPK/EnhancedTechRiderPalette';
import { 
  FileText, 
  Download, 
  Share2, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Wand2,
  Upload,
  Save
} from 'lucide-react';

interface Release {
  id: string;
  title: string;
  coverUrl: string;
  link: string;
}

interface Venue {
  id: string;
  name: string;
}

interface Quote {
  id: string;
  text: string;
  source: string;
}

interface RadioPress {
  id: string;
  name: string;
  type: 'radio' | 'press' | 'newsletter';
}

interface TechRiderItem {
  id: string;
  type: 'cdj' | 'mixer' | 'speakers' | 'turntable' | 'custom';
  label: string;
  quantity?: number;
  notes?: string;
  icon?: string;
}

interface SuggestionResponse {
  tagline: string;
  blurb: string;
  epk_bio: string;
}

export function EPKEditorClient() {
  // Basic Info
  const [artistName, setArtistName] = useState('');
  const [location, setLocation] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  
  // Bios
  const [shortBio, setShortBio] = useState('');
  const [fullBio, setFullBio] = useState('');
  
  // Lists
  const [venues, setVenues] = useState<Venue[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [radioPress, setRadioPress] = useState<RadioPress[]>([]);
  
  // Links
  const [links, setLinks] = useState({
    soundcloud: '',
    bandcamp: '',
    spotify: '',
    instagram: '',
    ra: '',
    bookingEmail: ''
  });
  
  // Tech Rider
  const [techRiderItems, setTechRiderItems] = useState<TechRiderItem[]>([]);
  
  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Template & Preview
  const [selectedTemplate, setSelectedTemplate] = useState('brutalist-onepage');
  const [previewHTML, setPreviewHTML] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // AI Suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'press' | 'concise' | 'promotional' | 'technical'>('press');
  const [autoApply, setAutoApply] = useState(false);
  
  // Export
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs
  const previewRef = useRef<HTMLIFrameElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Debounced preview update
  const updatePreview = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const modules = [];
      
      if (fullBio) {
        modules.push({
          id: 'bio-1',
          type: 'bio',
          order: 0,
          data: { text: fullBio }
        });
      }
      
      if (quotes.length > 0) {
        modules.push({
          id: 'quotes-1',
          type: 'quotes',
          order: 1,
          data: { quotes: quotes.map(q => ({ text: q.text, source: q.source })) }
        });
      }
      
      if (releases.length > 0) {
        modules.push({
          id: 'tracklist-1',
          type: 'tracklist',
          order: 2,
          data: { tracks: releases.map(r => ({ title: r.title, soundcloudUrl: r.link })) }
        });
      }
      
      if (techRiderItems.length > 0) {
        modules.push({
          id: 'tech-1',
          type: 'techRider',
          order: 3,
          data: { items: techRiderItems }
        });
      }
      
      if (Object.values(links).some(v => v)) {
        modules.push({
          id: 'links-1',
          type: 'links',
          order: 4,
          data: {
            links: Object.entries(links)
              .filter(([_, v]) => v)
              .map(([k, v]) => ({ label: k, url: v }))
          }
        });
      }

      const response = await fetch('/api/epk/template-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          modules,
          artistName: artistName || 'Artist Name',
          releaseTitle: genres.join(', ') || location
        })
      });

      const html = await response.text();
      setPreviewHTML(html);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [artistName, location, genres, fullBio, quotes, releases, techRiderItems, links, selectedTemplate]);

  // Debounce preview updates
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updatePreview();
    }, 300);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [updatePreview]);

  // Update iframe when HTML changes
  useEffect(() => {
    if (previewRef.current && previewHTML) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHTML);
        doc.close();
      }
    }
  }, [previewHTML]);

  // Generate AI suggestions
  const handleGenerateSuggestions = useCallback(async () => {
    if (!fullBio && !shortBio) {
      alert('Please write at least a short bio first');
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/epk/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullBio || shortBio,
          tone: selectedTone
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuggestions(data.outputs);
        
        if (autoApply) {
          setShortBio(data.outputs.blurb);
          setFullBio(data.outputs.epk_bio);
        } else {
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Suggestion error:', error);
      alert('Failed to generate suggestions');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [fullBio, shortBio, selectedTone, autoApply]);

  // Apply suggestions
  const applySuggestion = (field: 'tagline' | 'blurb' | 'epk_bio') => {
    if (!suggestions) return;
    
    if (field === 'blurb') {
      setShortBio(suggestions.blurb);
    } else if (field === 'epk_bio') {
      setFullBio(suggestions.epk_bio);
    }
  };

  // Add genre
  const addGenre = () => {
    if (genreInput.trim() && !genres.includes(genreInput.trim())) {
      setGenres([...genres, genreInput.trim()]);
      setGenreInput('');
    }
  };

  // Add venue
  const addVenue = () => {
    setVenues([...venues, { id: Date.now().toString(), name: '' }]);
  };

  // Add release
  const addRelease = () => {
    setReleases([...releases, { id: Date.now().toString(), title: '', coverUrl: '', link: '' }]);
  };

  // Add quote
  const addQuote = () => {
    setQuotes([...quotes, { id: Date.now().toString(), text: '', source: '' }]);
  };

  // Add radio/press
  const addRadioPress = () => {
    setRadioPress([...radioPress, { id: Date.now().toString(), name: '', type: 'radio' }]);
  };

  // Export EPK
  const handleExport = async (format: 'pdf' | 'zip') => {
    setIsExporting(true);
    try {
      const modules = [
        { id: '1', type: 'bio', order: 0, data: { text: fullBio } },
        ...(quotes.length > 0 ? [{ id: '2', type: 'quotes', order: 1, data: { quotes } }] : []),
        ...(releases.length > 0 ? [{ id: '3', type: 'tracklist', order: 2, data: { tracks: releases } }] : []),
        ...(techRiderItems.length > 0 ? [{ id: '4', type: 'techRider', order: 3, data: { items: techRiderItems } }] : []),
        ...(Object.values(links).some(v => v) ? [{ id: '5', type: 'links', order: 4, data: { links: Object.entries(links).filter(([_, v]) => v).map(([k, v]) => ({ platform: k, url: v })) } }] : [])
      ];

      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          modules,
          artistName,
          releaseTitle: genres.join(', '),
          exportFormat: format,
          includeWatermark: false
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert(`EPK ${format.toUpperCase()} queued! Job ID: ${data.jobId}`);
        window.location.href = `/epk`;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D1FF3D] rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-black" />
            </div>
            AI EPK Editor
          </h1>
          <p className="text-gray-400 text-lg">Create professional press kits with AI assistance and live preview</p>
        </div>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="bg-[#0a0a0a] border border-[#222] mb-6">
            <TabsTrigger value="edit" className="data-[state=active]:bg-[#D1FF3D] data-[state=active]:text-black">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#D1FF3D] data-[state=active]:text-black">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* EDIT TAB */}
          <TabsContent value="edit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN - Editor Form */}
              <div className="space-y-6">
                {/* Basic Info */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <h2 className="text-xl font-bold mb-4 text-[#D1FF3D]">Basic Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Artist / Project Name *</Label>
                      <Input
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Your artist name"
                        className="bg-black border-[#333] text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Location</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="bg-black border-[#333] text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Genres</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={genreInput}
                          onChange={(e) => setGenreInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                          placeholder="Add genre..."
                          className="bg-black border-[#333] text-white flex-1"
                        />
                        <Button onClick={addGenre} size="sm" className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {genres.map((genre, i) => (
                          <span key={i} className="px-3 py-1 bg-[#D1FF3D]/10 border border-[#D1FF3D]/30 rounded-full text-sm flex items-center gap-2">
                            {genre}
                            <button onClick={() => setGenres(genres.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Bios with AI */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#D1FF3D]">Biography</h2>
                    <div className="flex items-center gap-3">
                      <Select value={selectedTone} onValueChange={(v: any) => setSelectedTone(v)}>
                        <SelectTrigger className="w-[140px] bg-black border-[#333] text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#333]">
                          <SelectItem value="press">Press</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleGenerateSuggestions}
                        disabled={isGeneratingSuggestions}
                        className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
                      >
                        {isGeneratingSuggestions ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Suggest Rewrite
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Switch checked={autoApply} onCheckedChange={setAutoApply} id="auto-apply" />
                    <Label htmlFor="auto-apply" className="text-sm text-gray-400 cursor-pointer">
                      Auto-apply suggestions
                    </Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Short Bio (for socials)</Label>
                      <Textarea
                        value={shortBio}
                        onChange={(e) => setShortBio(e.target.value)}
                        placeholder="Brief artist description..."
                        className="bg-black border-[#333] text-white min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Full Bio (for EPK) *</Label>
                      <Textarea
                        value={fullBio}
                        onChange={(e) => setFullBio(e.target.value)}
                        placeholder="Complete artist biography..."
                        className="bg-black border-[#333] text-white min-h-[200px]"
                      />
                    </div>
                  </div>
                </Card>

                {/* Notable Venues */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#D1FF3D]">Notable Venues</h2>
                    <Button onClick={addVenue} size="sm" className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {venues.map((venue, idx) => (
                      <div key={venue.id} className="flex gap-2">
                        <Input
                          value={venue.name}
                          onChange={(e) => {
                            const newVenues = [...venues];
                            newVenues[idx].name = e.target.value;
                            setVenues(newVenues);
                          }}
                          placeholder="Venue name"
                          className="bg-black border-[#333] text-white flex-1"
                        />
                        <Button
                          onClick={() => setVenues(venues.filter(v => v.id !== venue.id))}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Releases */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#D1FF3D]">Releases</h2>
                    <Button onClick={addRelease} size="sm" className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {releases.map((release, idx) => (
                      <div key={release.id} className="border border-[#333] rounded-lg p-3 space-y-2">
                        <Input
                          value={release.title}
                          onChange={(e) => {
                            const newReleases = [...releases];
                            newReleases[idx].title = e.target.value;
                            setReleases(newReleases);
                          }}
                          placeholder="Release title"
                          className="bg-black border-[#333] text-white"
                        />
                        <Input
                          value={release.link}
                          onChange={(e) => {
                            const newReleases = [...releases];
                            newReleases[idx].link = e.target.value;
                            setReleases(newReleases);
                          }}
                          placeholder="SoundCloud/Spotify link"
                          className="bg-black border-[#333] text-white"
                        />
                        <Button
                          onClick={() => setReleases(releases.filter(r => r.id !== release.id))}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Press Quotes */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#D1FF3D]">Press Quotes</h2>
                    <Button onClick={addQuote} size="sm" className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {quotes.map((quote, idx) => (
                      <div key={quote.id} className="border border-[#333] rounded-lg p-3 space-y-2">
                        <Textarea
                          value={quote.text}
                          onChange={(e) => {
                            const newQuotes = [...quotes];
                            newQuotes[idx].text = e.target.value;
                            setQuotes(newQuotes);
                          }}
                          placeholder="Quote text"
                          className="bg-black border-[#333] text-white min-h-[80px]"
                        />
                        <Input
                          value={quote.source}
                          onChange={(e) => {
                            const newQuotes = [...quotes];
                            newQuotes[idx].source = e.target.value;
                            setQuotes(newQuotes);
                          }}
                          placeholder="Source (e.g., DJ Mag, Mixmag)"
                          className="bg-black border-[#333] text-white"
                        />
                        <Button
                          onClick={() => setQuotes(quotes.filter(q => q.id !== quote.id))}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN - More Form Fields */}
              <div className="space-y-6">
                {/* Tech Rider */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <h2 className="text-xl font-bold mb-4 text-[#D1FF3D]">Tech Rider</h2>
                  <EnhancedTechRiderPalette items={techRiderItems} onChange={setTechRiderItems} />
                </Card>

                {/* Links */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <h2 className="text-xl font-bold mb-4 text-[#D1FF3D]">Links</h2>
                  <div className="space-y-3">
                    {Object.keys(links).map((key) => (
                      <div key={key}>
                        <Label className="text-gray-400 text-xs mb-1.5 capitalize block">
                          {key === 'ra' ? 'Resident Advisor' : key === 'bookingEmail' ? 'Booking Email' : key}
                        </Label>
                        <Input
                          value={links[key as keyof typeof links]}
                          onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                          placeholder={key === 'bookingEmail' ? 'booking@example.com' : `https://${key}.com/...`}
                          className="bg-black border-[#333] text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Radio/Press/Newsletters */}
                <Card className="bg-[#0a0a0a] border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#D1FF3D]">Radio / Press / Newsletters</h2>
                    <Button onClick={addRadioPress} size="sm" className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {radioPress.map((item, idx) => (
                      <div key={item.id} className="flex gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...radioPress];
                            newItems[idx].name = e.target.value;
                            setRadioPress(newItems);
                          }}
                          placeholder="Name"
                          className="bg-black border-[#333] text-white flex-1"
                        />
                        <Select
                          value={item.type}
                          onValueChange={(v: any) => {
                            const newItems = [...radioPress];
                            newItems[idx].type = v;
                            setRadioPress(newItems);
                          }}
                        >
                          <SelectTrigger className="w-[120px] bg-black border-[#333] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-[#333]">
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="press">Press</SelectItem>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => setRadioPress(radioPress.filter(r => r.id !== item.id))}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Export Controls */}
                <Card className="bg-gradient-to-br from-[#D1FF3D]/10 to-[#D1FF3D]/5 border-[#D1FF3D]/20 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Export & Share</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting || !artistName || !fullBio}
                      className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={() => handleExport('zip')}
                      disabled={isExporting || !artistName || !fullBio}
                      className="bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download ZIP
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview">
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#D1FF3D]">Live Preview</h2>
                {isLoadingPreview && <Loader2 className="w-5 h-5 text-[#D1FF3D] animate-spin" />}
              </div>
              
              <div className="bg-white border-4 border-[#333] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '800px' }}>
                <iframe
                  ref={previewRef}
                  className="w-full h-full"
                  title="EPK Preview"
                  sandbox="allow-same-origin"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting || !artistName || !fullBio}
                  className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  onClick={() => handleExport('zip')}
                  disabled={isExporting || !artistName || !fullBio}
                  className="bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suggestions Modal */}
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent className="bg-[#0a0a0a] border-[#333] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#D1FF3D]">AI Suggestions</DialogTitle>
              <DialogDescription className="text-gray-400">
                Review and apply AI-generated improvements to your EPK
              </DialogDescription>
            </DialogHeader>

            {suggestions && (
              <div className="space-y-6 mt-4">
                <div className="border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#D1FF3D]">Tagline</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(suggestions.tagline);
                      }}
                      className="bg-[#D1FF3D]/20 text-[#D1FF3D] hover:bg-[#D1FF3D]/30"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-gray-300">{suggestions.tagline}</p>
                </div>

                <div className="border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#D1FF3D]">Short Blurb</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        applySuggestion('blurb');
                        setShowSuggestions(false);
                      }}
                      className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  </div>
                  <p className="text-gray-300">{suggestions.blurb}</p>
                </div>

                <div className="border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#D1FF3D]">Full EPK Bio</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        applySuggestion('epk_bio');
                        setShowSuggestions(false);
                      }}
                      className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{suggestions.epk_bio}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
