"use client";

import { useEffect, useState } from "react";
import { safeFetch, safeParseJSON } from "@/lib/epk/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  previewThumbnail: string;
  layout: string;
}

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string;
}

export default function TemplatePicker({
  onSelect,
  selectedTemplateId,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await safeFetch("/api/epk/templates");
        const data = await safeParseJSON<{
          ok: boolean;
          templates: Template[];
        }>(response);

        if (data.ok) {
          setTemplates(data.templates);
        }
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="dashboard-card h-48 animate-pulse bg-[#1a1a1a]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`dashboard-card text-left p-4 transition-all hover:scale-[1.02] ${
            selectedTemplateId === template.id
              ? "ring-2 ring-[#D7FF3C]"
              : "hover:ring-1 hover:ring-[#9B5CFF]"
          }`}
        >
          <div className="h-32 bg-[#0B0B0B] rounded-lg mb-3 flex items-center justify-center text-[#666]">
            Preview
          </div>
          <h3 className="font-semibold text-white mb-1">{template.name}</h3>
          <p className="text-sm text-gray-400">{template.description}</p>
        </button>
      ))}
    </div>
  );
}
