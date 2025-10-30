'use client';

import { useState, useEffect, useRef } from 'react';
import { EPKTemplate } from '@thecueroom/epk';
import { Button } from '@/components/ui/button';
import { Check, Eye, Sparkles, X } from 'lucide-react';

interface TemplateGalleryProps {
  selectedTemplateId?: string;
  onSelectTemplate: (template: EPKTemplate) => void;
}

export function TemplateGallery({ selectedTemplateId, onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<EPKTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<EPKTemplate | null>(null);
  const [previewHTML, setPreviewHTML] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/epk/templates');
      const data = await response.json();
      
      if (data.ok) {
        setTemplates(data.templates);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (template: EPKTemplate) => {
    setPreviewTemplate(template);
    try {
      const response = await fetch('/api/epk/template-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          modules: [
            { id: '1', type: 'bio', order: 0, data: { text: 'Sample artist biography showcasing this template style...' } }
          ],
          artistName: 'Artist Name',
          releaseTitle: 'Sample EPK'
        })
      });
      const html = await response.text();
      setPreviewHTML(html);
    } catch (error) {
      console.error('Preview load error:', error);
    }
  };

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

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      modern: 'Modern',
      minimal: 'Minimalist',
      editorial: 'Editorial',
      futuristic: 'Futuristic',
      retro: 'Retro',
      premium: 'Premium',
      visual: 'Visual-Heavy'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? 'bg-primary text-black' : ''}
        >
          All Templates
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'bg-primary text-black' : ''}
          >
            {getCategoryLabel(category)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`group relative rounded-lg border overflow-hidden transition-all cursor-pointer ${
              selectedTemplateId === template.id
                ? 'border-primary ring-2 ring-primary'
                : 'border-[#1a1a1a] hover:border-primary/50'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="aspect-[4/5] bg-gradient-to-br relative overflow-hidden"
                 style={{
                   background: `linear-gradient(135deg, ${template.colorScheme.primary}, ${template.colorScheme.accent})`
                 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <Sparkles className="w-16 h-16 mb-4" style={{ color: template.colorScheme.text || '#fff' }} />
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold" style={{ color: template.colorScheme.text || '#fff' }}>
                    {template.name}
                  </div>
                  <div className="text-xs opacity-80" style={{ color: template.colorScheme.text || '#fff' }}>
                    {template.category}
                  </div>
                </div>
              </div>
              
              {selectedTemplateId === template.id && (
                <div className="absolute top-2 right-2 bg-primary text-black rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="p-3 bg-[#0a0a0a] border-t border-[#1a1a1a]">
              <h3 className="font-semibold text-white text-sm mb-1">{template.name}</h3>
              <p className="text-gray-400 text-xs line-clamp-2">{template.description}</p>
              
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {getCategoryLabel(template.category)}
                </span>
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                  {template.supportedModules.length} modules
                </span>
              </div>
            </div>

            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  loadPreview(template);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Quick Preview
              </Button>
            </div>
          </div>
        ))}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-[#0a0a0a] border border-primary rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
              <h3 className="text-xl font-bold text-white">{previewTemplate.name} - Quick Preview</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-white overflow-auto" style={{ height: '70vh', maxHeight: '600px' }}>
              <iframe
                ref={previewRef}
                className="w-full bg-white"
                style={{ border: 'none', height: '100%', minHeight: '500px' }}
                title="Template Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
            <div className="p-4 border-t border-[#1a1a1a] flex justify-between items-center">
              <p className="text-sm text-gray-400">{previewTemplate.description}</p>
              <Button 
                onClick={() => {
                  onSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="bg-primary hover:bg-primary/90 text-black"
              >
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
