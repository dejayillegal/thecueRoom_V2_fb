'use client';

import { useState, useCallback } from 'react';
import { EPKTemplate, EPKModule } from '@thecueroom/epk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplateGallery } from './TemplateGallery';
import { DragDropEditor } from './DragDropEditor';
import { Download, Eye, Save, Sparkles } from 'lucide-react';

export function EPKStudioClient() {
  const [step, setStep] = useState<'template' | 'edit' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EPKTemplate | null>(null);
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [modules, setModules] = useState<EPKModule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectTemplate = useCallback((template: EPKTemplate) => {
    setSelectedTemplate(template);
    setModules([
      {
        id: 'bio-1',
        type: 'bio',
        order: 0,
        data: { text: '' }
      }
    ]);
  }, []);

  const handleContinueToEdit = useCallback(() => {
    if (!selectedTemplate || !artistName) {
      alert('Please select a template and enter artist name');
      return;
    }
    setStep('edit');
  }, [selectedTemplate, artistName]);

  const handleGenerateEPK = useCallback(async () => {
    if (!selectedTemplate || !artistName || modules.length === 0) {
      alert('Please complete all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          modules: modules.map((m, i) => ({ ...m, order: i })),
          artistName,
          releaseTitle: genre,
          exportFormat: 'pdf',
          includeWatermark: false
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      alert(`EPK queued! Job ID: ${data.jobId}. Check the Jobs page to download.`);
    } catch (error) {
      console.error('EPK generation error:', error);
      alert('Failed to generate EPK. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, artistName, genre, modules]);

  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          EPK Studio
        </h1>
        <p className="text-gray-400">Create professional Electronic Press Kits with advanced templates and AI-powered content</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={step === 'template' ? 'default' : 'outline'}
          onClick={() => setStep('template')}
          className={step === 'template' ? 'bg-primary text-black' : ''}
        >
          1. Choose Template
        </Button>
        <Button
          variant={step === 'edit' ? 'default' : 'outline'}
          onClick={() => setStep('edit')}
          disabled={!selectedTemplate}
          className={step === 'edit' ? 'bg-primary text-black' : ''}
        >
          2. Edit Content
        </Button>
        <Button
          variant={step === 'preview' ? 'default' : 'outline'}
          onClick={() => setStep('preview')}
          disabled={!selectedTemplate}
          className={step === 'preview' ? 'bg-primary text-black' : ''}
        >
          3. Preview & Export
        </Button>
      </div>

      {step === 'template' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-gray-300 mb-2">Artist Name *</Label>
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Your artist/DJ name"
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-2">Genre/Style</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Techno, House, Drum & Bass"
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>
          </div>

          <TemplateGallery
            selectedTemplateId={selectedTemplate?.id}
            onSelectTemplate={handleSelectTemplate}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleContinueToEdit}
              disabled={!selectedTemplate || !artistName}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              Continue to Edit
            </Button>
          </div>
        </div>
      )}

      {step === 'edit' && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Build Your EPK</h2>
            <DragDropEditor
              modules={modules}
              onModulesChange={setModules}
              supportedModules={selectedTemplate?.supportedModules}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('template')}>
              Back to Templates
            </Button>
            <Button
              onClick={() => setStep('preview')}
              disabled={modules.length === 0}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview EPK
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
            <div className="aspect-[210/297] bg-white rounded overflow-hidden">
              <div className="h-full flex items-center justify-center text-gray-900">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Preview will render here</p>
                  <p className="text-sm text-gray-400 mt-2">{artistName} - {selectedTemplate?.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('edit')}>
              Back to Edit
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleGenerateEPK}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90 text-black"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate EPK
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
