'use client';

import { useState, useEffect, useRef } from 'react';
import { EPKData } from './EPKEditorTab';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Share2, ArrowLeft, FileDown, Eye } from 'lucide-react';

interface EPKPreviewTabProps {
  epkData: EPKData;
  onBack: () => void;
}

export function EPKPreviewTab({ epkData, onBack }: EPKPreviewTabProps) {
  const [previewHTML, setPreviewHTML] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const pollJobStatus = async (jobId: string, format: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/epk/job/${jobId}`);
        const data = await response.json();

        if (data.status === 'done' && data.resultUrl) {
          // Download the file
          const link = document.createElement('a');
          link.href = data.resultUrl;
          link.download = `epk.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setExportStatus(`${format.toUpperCase()} exported successfully!`);
          return true;
        } else if (data.status === 'error') {
          setExportStatus(`Export failed: ${data.error || 'Unknown error'}`);
          return false;
        }

        setExportStatus(`Generating ${format.toUpperCase()}... ${Math.round((attempts / maxAttempts) * 100)}%`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error('Error polling job:', error);
        setExportStatus('Export failed');
        return false;
      }
    }

    setExportStatus('Export timed out');
    return false;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportStatus('Starting PDF export...');

    try {
      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportFormat: 'pdf',
          templateId: epkData.template?.id || 'modern',
          artistName: epkData.artistName,
          modules: [
            { type: 'bio', data: { text: epkData.bio } },
            { type: 'quotes', data: { quotes: epkData.pressQuotes } },
            { type: 'techRider', data: { items: epkData.techRider } }
          ]
        })
      });

      const data = await response.json();
      if (data.jobId) {
        await pollJobStatus(data.jobId, 'pdf');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZIP = async () => {
    setIsExporting(true);
    setExportStatus('Starting ZIP export...');

    try {
      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportFormat: 'zip',
          templateId: epkData.template?.id || 'modern',
          artistName: epkData.artistName,
          modules: [
            { type: 'bio', data: { text: epkData.bio } },
            { type: 'quotes', data: { quotes: epkData.pressQuotes } },
            { type: 'techRider', data: { items: epkData.techRider } }
          ]
        })
      });

      const data = await response.json();
      if (data.jobId) {
        await pollJobStatus(data.jobId, 'zip');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

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
        {exportStatus && (
          <div className="mb-4 p-3 bg-[#1a1a1a] border border-[#333] rounded text-sm text-gray-300">
            {exportStatus}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>
          <Button
            onClick={handleExportZIP}
            disabled={isExporting}
            className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            Export ZIP
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