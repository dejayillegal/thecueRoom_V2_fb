'use client';

import { useState } from 'react';
import { Sparkles, X, Check, AlertTriangle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (suggestions: AISuggestion) => void;
}

interface AISuggestion {
  title?: string;
  body?: string;
  tags?: string[];
}

const toneOptions = [
  { id: 'neutral', label: 'Neutral', desc: 'Balanced and factual' },
  { id: 'concise', label: 'Concise', desc: 'Brief and to the point' },
  { id: 'technical', label: 'Technical', desc: 'Detailed and precise' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
];

export function ThreadAssistModal({ isOpen, onClose, onApply }: ThreadAssistModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState('neutral');
  const [applyTo, setApplyTo] = useState<('title' | 'body' | 'tags')[]>(['body']);
  const [checkAuthenticity, setCheckAuthenticity] = useState(false);
  const [flagSpam, setFlagSpam] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuggestion({
      title: 'Best Budget Synthesizer for Beginners Under $500',
      body: `I've been producing music entirely in software for the past year, and I'm now looking to expand into hardware synthesis. My budget is around $500, and I'm particularly interested in exploring both FM and subtractive synthesis techniques.

After some research, I've narrowed down my choices to three options:

1. **Korg Minilogue XD** - Known for its intuitive interface and analog-digital hybrid engine
2. **Arturia MicroFreak** - Offers multiple synthesis engines and a unique matrix keyboard
3. **Behringer DeepMind 6** - Provides classic analog sound with built-in effects

I'm looking for a synthesizer that will help me learn synthesis fundamentals while still being capable of producing professional-quality sounds. Which of these would you recommend, or are there other options I should consider?

I'd appreciate insights from anyone who has experience with these instruments, particularly regarding their learning curve and versatility.`,
      tags: ['synthesizers', 'beginner', 'hardware', 'recommendations', 'budget'],
    });
    
    setIsGenerating(false);
  };

  const handleApply = () => {
    if (suggestion) {
      const filteredSuggestion: AISuggestion = {};
      if (applyTo.includes('title') && suggestion.title) filteredSuggestion.title = suggestion.title;
      if (applyTo.includes('body') && suggestion.body) filteredSuggestion.body = suggestion.body;
      if (applyTo.includes('tags') && suggestion.tags) filteredSuggestion.tags = suggestion.tags;
      
      onApply(filteredSuggestion);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D7FF3C]/10 border border-[#D7FF3C]/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D7FF3C]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Thread Assistant</h2>
              <p className="text-sm text-gray-400">Get AI-powered suggestions for your thread</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">
              What would you like help with?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Write a thread about choosing a beginner synthesizer under $500'"
              className="w-full px-4 py-3 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D7FF3C] resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              {prompt.length} / 500 characters
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-white mb-3 block">
              Apply AI suggestions to:
            </label>
            <div className="flex gap-2">
              {[
                { id: 'title', label: 'Title' },
                { id: 'body', label: 'Body' },
                { id: 'tags', label: 'Tags' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    const opt = option.id as 'title' | 'body' | 'tags';
                    setApplyTo(prev =>
                      prev.includes(opt)
                        ? prev.filter(x => x !== opt)
                        : [...prev, opt]
                    );
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${applyTo.includes(option.id as 'title' | 'body' | 'tags')
                      ? 'bg-[#D7FF3C]/10 text-[#D7FF3C] border border-[#D7FF3C]/30'
                      : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#3a3a3a]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-white mb-3 block">
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedTone(option.id)}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${selectedTone === option.id
                      ? 'bg-[#D7FF3C]/10 border-[#D7FF3C]/30 text-[#D7FF3C]'
                      : 'bg-[#111111] border-[#1a1a1a] text-gray-400 hover:border-[#2a2a2a]'
                    }
                  `}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs opacity-70">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checkAuthenticity}
                onChange={(e) => setCheckAuthenticity(e.target.checked)}
                className="w-4 h-4 rounded bg-[#111111] border-[#1a1a1a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-sm text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Check for authenticity issues
                </div>
                <div className="text-xs text-gray-500">Verify facts and product information</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flagSpam}
                onChange={(e) => setFlagSpam(e.target.checked)}
                className="w-4 h-4 rounded bg-[#111111] border-[#1a1a1a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-sm text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Flag potential spam content
                </div>
                <div className="text-xs text-gray-500">Automatically detect promotional content</div>
              </div>
            </label>
          </div>

          {suggestion && (
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-white">AI Suggestion Ready</h3>
              </div>

              {applyTo.includes('title') && suggestion.title && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-400 mb-1">Title</div>
                  <div className="text-sm text-white">{suggestion.title}</div>
                </div>
              )}

              {applyTo.includes('body') && suggestion.body && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-400 mb-1">Body</div>
                  <div className="text-sm text-gray-300 line-clamp-6 whitespace-pre-wrap">
                    {suggestion.body}
                  </div>
                </div>
              )}

              {applyTo.includes('tags') && suggestion.tags && (
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="text-xs text-gray-500">
            <Zap className="w-3 h-3 inline mr-1 text-[#D7FF3C]" />
            Powered by AI • Use suggestions as a starting point
          </div>
          <div className="flex items-center gap-3">
            {!suggestion ? (
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || applyTo.length === 0 || isGenerating}
                className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setSuggestion(null)}
                  variant="outline"
                  className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Thread
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
