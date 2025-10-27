
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Save,
  Download,
  RotateCw,
  Check,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc, query, where, getDocs, orderBy, limit, writeBatch } from 'firebase/firestore';
import { rewritePrompt, RewritePromptInput } from '@/ai/flows/rewrite-prompt-flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';

type Modifier = 'highContrast' | 'grainAndTexture' | 'addVenueDate';

interface GenerationJob {
  id: string;
  userId: string;
  prompt: string;
  settings: {
    subgenre: string;
    style: string;
    aspect: string;
    modifiers: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  previews: string[];
  createdAt: any;
  updatedAt: any;
}

interface RecentProject extends GenerationJob {
    selectedUrl: string;
}

export default function AICoverArtPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Form State
  const [prompt, setPrompt] = useState('');
  const [subgenre, setSubgenre] = useState('techno');
  const [style, setStyle] = useState('underground-poster');
  const [aspect, setAspect] = useState('1:1');
  const [modifiers, setModifiers] = useState<Set<Modifier>>(new Set());
  
  // Job & UI State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Rewrite Suggestions State
  const [isRewriting, setIsRewriting] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isSuggestionPopoverOpen, setIsSuggestionPopoverOpen] = useState(false);

  // Recent Projects State
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Listen to active job
  useEffect(() => {
    if (!activeJobId || !firestore) return;

    const jobRef = doc(firestore, 'generationJobs', activeJobId);
    const unsubscribe = onSnapshot(jobRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as GenerationJob;
        setJobData(data);
        if (data.status === 'failed') {
          setError('Image generation failed. Please try again.');
          setActiveJobId(null);
        }
        if (data.status === 'completed') {
          // You could add a success toast here
        }
      } else {
        setError('The generation job was not found.');
        setActiveJobId(null);
      }
    });

    return () => unsubscribe();
  }, [activeJobId, firestore]);

  const fetchRecentProjects = useCallback(async () => {
    if (!user || !firestore) return;
    setLoadingRecent(true);
    try {
      const q = query(
        collection(firestore, 'coverArtProjects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentProject));
      setRecentProjects(projects);
    } catch (err) {
      console.error("Failed to fetch recent projects", err);
    } finally {
      setLoadingRecent(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchRecentProjects();
  }, [fetchRecentProjects]);

  const handleModifierToggle = (modifier: Modifier) => {
    setModifiers((prev) => {
      const newModifiers = new Set(prev);
      if (newModifiers.has(modifier)) {
        newModifiers.delete(modifier);
      } else {
        newModifiers.add(modifier);
      }
      return newModifiers;
    });
  };

  const handleGenerate = async () => {
    if (!user || !firestore || !prompt) {
      setError("Please enter a prompt to begin.");
      return;
    }
    
    // Cancel previous job if running
    if (activeJobId && jobData?.status === 'processing') {
       await updateDoc(doc(firestore, 'generationJobs', activeJobId), { status: 'cancelled' });
    }

    setError(null);
    setJobData(null);
    setSelectedImage(null);

    try {
        const jobsRef = collection(firestore, 'generationJobs');
        const jobDoc = await addDoc(jobsRef, {
            userId: user.uid,
            prompt,
            settings: {
              subgenre,
              style,
              aspect,
              modifiers: Array.from(modifiers),
            },
            status: 'pending',
            progress: 0,
            previews: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        setActiveJobId(jobDoc.id);

        // This would be handled by a Cloud Function in production.
        // For demonstration, we call an API route that simulates the worker.
        fetch('/api/ai/process-job', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: jobDoc.id })
        });

    } catch (err) {
        setError("Failed to create generation job.");
        console.error(err);
    }
  };
  
  const handleSavePreset = async () => {
    if (!user || !firestore) {
        setError("You must be logged in to save a preset.");
        return;
    }
    try {
        const presetsRef = collection(firestore, 'users', user.uid, 'coverArtPresets');
        await addDoc(presetsRef, {
            prompt,
            subgenre,
            style,
            aspect,
            modifiers: Array.from(modifiers),
            createdAt: serverTimestamp()
        });
        // You can add a toast notification here for success
    } catch(err) {
        setError("Failed to save preset.");
    }
  };

  const handleUseThis = async () => {
    if (!selectedImage || !user || !firestore || !jobData) {
        setError("Please select an image to save.");
        return;
    }
    try {
        const projectsRef = collection(firestore, 'coverArtProjects');
        await addDoc(projectsRef, {
            userId: user.uid,
            prompt: jobData.prompt,
            settings: jobData.settings,
            previews: jobData.previews,
            selectedUrl: selectedImage,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        fetchRecentProjects(); // Refresh recent projects
        // Add toast notification for success
    } catch (err) {
        setError("Failed to save project.");
    }
  };

  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = `thecueroom-art-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRewritePrompt = async () => {
    if (!prompt) return;
    setIsRewriting(true);
    setPromptSuggestions([]);
    setIsSuggestionPopoverOpen(true);
    try {
      const input: RewritePromptInput = { prompt };
      const { suggestions } = await rewritePrompt(input);
      setPromptSuggestions(suggestions);
    } catch (err: any) {
      setError('Failed to get prompt suggestions.');
      setIsSuggestionPopoverOpen(false);
    } finally {
      setIsRewriting(false);
    }
  };

  const isLoading = jobData?.status === 'processing' || jobData?.status === 'pending';
  const rightPanelTitle = 'Preview';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Cover Art</CardTitle>
            <CardDescription>
              Generate unique, on-brand cover art from a simple text prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Describe your artwork idea... e.g., 'a lone figure in a brutalist cityscape at night, neon reflections on wet concrete'"
                className="min-h-[120px] pr-28"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
               <Popover open={isSuggestionPopoverOpen} onOpenChange={setIsSuggestionPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRewritePrompt}
                        disabled={isRewriting || !prompt}
                        className="absolute top-2 right-2"
                    >
                        {isRewriting ? <RotateCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        <span className="ml-2">Rewrite</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Suggestions</h4>
                    {isRewriting ? (
                        <div className="space-y-3 pt-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                     promptSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setPrompt(suggestion);
                          setIsSuggestionPopoverOpen(false);
                        }}
                        className="text-sm p-2 rounded-md hover:bg-accent cursor-pointer"
                      >
                        {suggestion}
                      </div>
                    )))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={subgenre} onValueChange={setSubgenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Subgenre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="electro">Electro</SelectItem>
                  <SelectItem value="leftfield">Leftfield</SelectItem>
                </SelectContent>
              </Select>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="underground-poster">Underground Poster</SelectItem>
                  <SelectItem value="vinyl-cover">Vinyl Cover</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="futuristic">Futuristic</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Select value={aspect} onValueChange={setAspect}>
                <SelectTrigger>
                  <SelectValue placeholder="Aspect Ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 Square</SelectItem>
                  <SelectItem value="4:5">4:5 Portrait</SelectItem>
                  <SelectItem value="16:9">16:9 Landscape</SelectItem>
                </SelectContent>
              </Select>
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="mod-contrast">High contrast</Label>
                    <Switch id="mod-contrast" onCheckedChange={() => handleModifierToggle('highContrast')} />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="mod-grain">Grain + texture</Label>
                    <Switch id="mod-grain" onCheckedChange={() => handleModifierToggle('grainAndTexture')} />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="mod-venue">Add venue/date area</Label>
                    <Switch id="mod-venue" onCheckedChange={() => handleModifierToggle('addVenueDate')} />
                </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleSavePreset}><Save className="mr-2 h-4 w-4" />Save Preset</Button>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                    <><RotateCw className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Generate</>
                )}
              </Button>
            </div>
             <div className="flex items-center justify-between">
                <Badge variant="secondary">Underground</Badge>
                <p className="text-xs text-muted-foreground">Optimized for dance/club artwork</p>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Previews and Actions */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{rightPanelTitle}</CardTitle>
            {jobData?.progress !== undefined && jobData.status === 'processing' && (
              <div className="flex items-center gap-4 pt-2">
                <Progress value={jobData.progress} className="w-full" />
                <span className="text-sm text-muted-foreground">{jobData.progress}%</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(!jobData?.previews || jobData.previews.length < 4) && 
                [...Array(4)].map((_, i) => (
                  (jobData?.previews && jobData.previews[i]) ? (
                    <div key={i} className="relative group cursor-pointer" onClick={() => setSelectedImage(jobData.previews[i])}>
                      <Image src={jobData.previews[i]} alt={`Generated artwork ${i + 1}`} width={512} height={512} className="aspect-square object-cover rounded-lg" />
                      {selectedImage === jobData.previews[i] && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg ring-2 ring-primary">
                          <Check className="h-16 w-16 text-primary" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Skeleton key={i} className="aspect-square w-full" />
                  )
              ))}
              {jobData?.previews && jobData.previews.length >= 4 && jobData.previews.map((src, i) => (
                <div key={i} className="relative group cursor-pointer" onClick={() => setSelectedImage(src)}>
                  <Image src={src} alt={`Generated artwork ${i + 1}`} width={512} height={512} className="aspect-square object-cover rounded-lg" />
                   {selectedImage === src && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg ring-2 ring-primary">
                        <Check className="h-16 w-16 text-primary" />
                      </div>
                    )}
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleGenerate} disabled={isLoading}><RotateCw className="mr-2 h-4 w-4" />Regenerate</Button>
                <Button variant="outline" onClick={handleDownload} disabled={!selectedImage}><Download className="mr-2 h-4 w-4" />Download</Button>
                <Button onClick={handleUseThis} disabled={!selectedImage || isLoading}>Use This</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your saved cover art creations.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                      <div key={i}><Skeleton className="aspect-square w-full" /></div>
                  ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentProjects.map((project) => (
                      <div key={project.id} className="group relative">
                          <Image src={project.selectedUrl} alt={project.prompt} width={256} height={256} className="aspect-square object-cover rounded-lg" />
                      </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent projects found.</p>
            )}
            <div className="text-center mt-4">
                <Button variant="link">View all</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
