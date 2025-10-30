
'use client';

import { useState, useEffect, useRef } from 'react';
import { EPKData } from './EPKEditorTab';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Share2, ArrowLeft } from 'lucide-react';

interface EPKPreviewTabProps {
  epkData: EPKData;
  onBack: () => void;
}

export function EPKPreviewTab({ epkData, onBack }: EPKPreviewTabProps) {
  const [previewHTML, setPreviewHTML] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    updatePreview();
  }, [epkData]);

  const updatePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const modules = [];
      
      if (epkData.bio) {
        modules.push({
          id: 'bio-1',
          type: 'bio',
          order: 0,
          data: { text: epkData.bio }
        });
      }
      
      if (epkData.pressQuotes.length > 0) {
        modules.push({
          id: 'quotes-1',
          type: 'quotes',
          order: 1,
          data: { quotes: epkData.pressQuotes }
        });
      }
      
      if (epkData.techRider.length > 0) {
        modules.push({
          id: 'tech-1',
          type: 'techRider',
          order: 2,
          data: { items: epkData.techRider }
        });
      }
      
      if (Object.values(epkData.links).some(v => v)) {
        modules.push({
          id: 'links-1',
          type: 'links',
          order: 3,
          data: {
            links: Object.entries(epkData.links)
              .filter(([_, v]) => v)
              .map(([k, v]) => ({ label: k, url: v }))
          }
        });
      }

      const response = await fetch('/api/epk/template-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: epkData.template?.id || 'brutalist-onepage',
          modules,
          artistName: epkData.artistName || 'Artist Name',
          releaseTitle: epkData.genre || epkData.location
        })
      });

      const html = await response.text();
      setPreviewHTML(html);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
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

  const handleExport = async (format: 'pdf' | 'zip') => {
    setIsExporting(true);
    try {
      const modules = [
        { id: '1', type: 'bio', order: 0, data: { text: epkData.bio } },
        ...(epkData.pressQuotes.length > 0 ? [{ id: '2', type: 'quotes', order: 1, data: { quotes: epkData.pressQuotes } }] : []),
        ...(epkData.techRider.length > 0 ? [{ id: '3', type: 'techRider', order: 2, data: { items: epkData.techRider } }] : []),
        ...(Object.values(epkData.links).some(v => v) ? [{ id: '4', type: 'links', order: 3, data: { links: Object.entries(epkData.links).filter(([_, v]) => v).map(([k, v]) => ({ platform: k, url: v })) } }] : [])
      ];

      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: epkData.template?.id || 'brutalist-onepage',
          modules,
          artistName: epkData.artistName,
          releaseTitle: epkData.genre,
          exportFormat: format,
          includeWatermark: false
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        alert(`EPK ${format.toUpperCase()} queued! Job ID: ${data.jobId}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Preview & Export</h2>
          <p className="text-sm text-gray-400">Review your EPK and export when ready</p>
        </div>
        {isLoadingPreview && (
          <div className="flex items-center gap-2 text-sm text-[#D1FF3D]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating preview...
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
        <div className="bg-white border-4 border-[#333] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}>
          <iframe
            ref={previewRef}
            className="w-full h-full"
            title="EPK Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-br from-[#D1FF3D]/10 to-[#9B5CFF]/10 border border-[#D1FF3D]/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90 font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleExport('zip')}
            disabled={isExporting}
            className="bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90 font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ZIP
          </Button>
          <Button
            disabled
            className="bg-[#1a1a1a] text-gray-400 cursor-not-allowed"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link (Soon)
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-[#1a1a1a] p-4 -mx-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full border-[#333] text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Button>
      </div>
    </div>
  );
}
