
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI EPK Studio | thecueRoom',
  description: 'Create professional Electronic Press Kits with AI assistance, drag-and-drop tech rider, and live preview',
};

'use client';

import { useState } from 'react';
import { EPKTemplate } from '@/data/epk-templates';
import { TemplateSelector } from '@/components/EPK/TemplateSelector';
import { EPKEditorTab, EPKData } from '@/components/EPK/EPKEditorTab';
import { EPKPreviewTab } from '@/components/EPK/EPKPreviewTab';
import { FileText } from 'lucide-react';

export default function EPKGeneratorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [epkData, setEpkData] = useState<EPKData>({
    template: null,
    artistName: '',
    genre: '',
    location: '',
    bio: '',
    pressQuotes: [],
    venues: [],
    links: {
      soundcloud: '',
      mixcloud: '',
      spotify: '',
      bandcamp: '',
      instagram: '',
      ra: ''
    },
    techRider: [],
    images: []
  });

  const handleSelectTemplate = (template: EPKTemplate) => {
    setEpkData(prev => ({ ...prev, template }));
  };

  const handleUpdateData = (data: Partial<EPKData>) => {
    setEpkData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D1FF3D] rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-black" />
            </div>
            AI EPK Studio
          </h1>
          <p className="text-gray-400 text-lg">Create professional press kits in three simple steps</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step === num
                    ? 'bg-[#D1FF3D] text-black'
                    : step > num
                    ? 'bg-[#D1FF3D]/30 text-[#D1FF3D]'
                    : 'bg-[#1a1a1a] text-gray-500'
                }`}
              >
                {num}
              </div>
              <span
                className={`text-sm font-medium ${
                  step === num ? 'text-white' : step > num ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {num === 1 ? 'Choose Template' : num === 2 ? 'Edit Content' : 'Preview & Export'}
              </span>
              {num < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > num ? 'bg-[#D1FF3D]' : 'bg-[#333]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-6">
          {step === 1 && (
            <TemplateSelector
              selectedTemplate={epkData.template}
              onSelectTemplate={handleSelectTemplate}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <EPKEditorTab
              epkData={epkData}
              onUpdateData={handleUpdateData}
              onContinue={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <EPKPreviewTab
              epkData={epkData}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
