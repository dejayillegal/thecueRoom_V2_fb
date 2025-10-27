'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { generateMeme } from './actions';
import { Loader2 } from 'lucide-react';

export default function MemeGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) {
      setError('Please provide both an image and a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedMeme(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const memeUrl = await generateMeme({
            imageDataUri: base64Image,
            prompt: prompt,
          });
        setGeneratedMeme(memeUrl);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setError('Failed to read the image file.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the meme.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedMeme) {
      const link = document.createElement('a');
      link.href = generatedMeme;
      link.download = 'meme.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Meme Generator</CardTitle>
        <CardDescription>
          Upload an image, write a prompt, and let the AI create a viral-worthy meme.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image-upload">1. Upload your image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">2. Write your meme prompt</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A cat looking disappointed at a salad'"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Meme'
              )}
            </Button>
          </form>

          {/* Preview and Result */}
          <div className="space-y-4">
              <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {generatedMeme ? (
                <Image
                  src={generatedMeme}
                  alt="Generated meme"
                  width={512}
                  height={512}
                  className="object-contain"
                />
              ) : preview ? (
                <Image
                  src={preview}
                  alt="Image preview"
                  width={512}
                  height={512}
                  className="object-contain"
                />
              ) : (
                <p className="text-muted-foreground">Your meme will appear here</p>
              )}
            </div>
             {error && <p className="text-sm text-red-500">{error}</p>}
             {generatedMeme && (
               <Button onClick={handleDownload} variant="outline" className='w-full'>
                  Download Meme
               </Button>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
