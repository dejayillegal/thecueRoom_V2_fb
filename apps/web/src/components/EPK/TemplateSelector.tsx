"use client";

import { useState, useCallback } from "react";
import {
  EPK_TEMPLATES,
  EPK_CATEGORIES,
  EPKTemplate,
} from "@/data/epk-templates";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selectedTemplate: EPKTemplate | null;
  onSelectTemplate: (template: EPKTemplate) => void;
  onContinue: () => void;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onContinue,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTemplates =
    selectedCategory === "all"
      ? EPK_TEMPLATES
      : EPK_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, template: EPKTemplate) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectTemplate(template);
      }
    },
    [onSelectTemplate],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your EPK Template
        </h2>
        <p className="text-gray-400 text-sm">
          Select a design that matches your style and brand
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {EPK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-[#D1FF3D] text-black"
                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div
        role="radiogroup"
        aria-label="EPK Templates"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            role="radio"
            aria-checked={selectedTemplate?.id === template.id}
            tabIndex={0}
            onClick={() => onSelectTemplate(template)}
            onKeyDown={(e) => handleKeyDown(e, template)}
            className={`relative bg-[#0a0a0a] border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02] ${
              selectedTemplate?.id === template.id
                ? "border-[#D1FF3D] shadow-lg shadow-[#D1FF3D]/20"
                : "border-[#222] hover:border-[#333]"
            }`}
          >
            {/* Selection Indicator */}
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#D1FF3D] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}

            {/* Thumbnail */}
            <div
              className="w-full h-32 mb-3 rounded overflow-hidden bg-[#0f0f0f]"
              dangerouslySetInnerHTML={{ __html: template.thumbnailSvg }}
            />

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {template.name}
                </h3>
                <span className="px-2 py-0.5 bg-[#D1FF3D]/10 border border-[#D1FF3D]/30 rounded text-[#D1FF3D] text-xs">
                  {template.tag}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{template.modules.length} modules</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-[#1a1a1a] p-4 -mx-4">
        <Button
          onClick={onContinue}
          disabled={!selectedTemplate}
          className="w-full bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90 font-semibold py-6 text-base"
        >
          Continue to Edit Content
        </Button>
      </div>
    </div>
  );
}
