"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { EPKTemplate, EPKModule } from "@thecueroom/epk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TemplateGallery } from "./TemplateGallery";
import { DragDropEditor } from "./DragDropEditor";
import { Download, Eye, Save, Sparkles, Wand2, Loader2 } from "lucide-react";

export function EPKStudioClient() {
  const [step, setStep] = useState<"template" | "edit" | "preview">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<EPKTemplate | null>(
    null,
  );
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [modules, setModules] = useState<EPKModule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRewritingBio, setIsRewritingBio] = useState(false);
  const [isRewritingQuotes, setIsRewritingQuotes] = useState(false);
  const [isRewritingTechRider, setIsRewritingTechRider] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const handleSelectTemplate = useCallback((template: EPKTemplate) => {
    setSelectedTemplate(template);
    setModules([
      {
        id: "bio-1",
        type: "bio",
        order: 0,
        data: { text: "" },
      },
    ]);
  }, []);

  const handleContinueToEdit = useCallback(() => {
    if (!selectedTemplate || !artistName) {
      alert("Please select a template and enter artist name");
      return;
    }
    setStep("edit");
  }, [selectedTemplate, artistName]);

  const loadPreview = useCallback(async () => {
    if (!selectedTemplate || !artistName) {
      setPreviewHTML("");
      return;
    }

    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/epk/template-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          modules: modules.map((m, i) => ({ ...m, order: i })),
          artistName,
          releaseTitle: genre || "Electronic Press Kit",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Preview failed: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      setPreviewHTML(html);
    } catch (error) {
      console.error("Preview loading error:", error);
      setPreviewHTML(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #1a1a1a; color: #fff;">
            <h2 style="color: #D7FF3C;">Preview Unavailable</h2>
            <p style="color: #999;">Unable to load preview. Please try again.</p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">${error instanceof Error ? error.message : "Unknown error"}</p>
          </body>
        </html>
      `);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [selectedTemplate, artistName, genre, modules]);

  useEffect(() => {
    if (step === "preview") {
      loadPreview();
    }
  }, [step, selectedTemplate, artistName, genre, modules, loadPreview]);

  useEffect(() => {
    if (previewRef.current && previewHTML) {
      try {
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(previewHTML);
          doc.close();
        }
      } catch (error) {
        console.error("Error rendering preview:", error);
      }
    }
  }, [previewHTML]);

  const handleGenerateContent = useCallback(
    async (moduleId: string, type: "bio" | "press_quote" | "tech_rider") => {
      const setLoading =
        type === "bio"
          ? setIsRewritingBio
          : type === "press_quote"
            ? setIsRewritingQuotes
            : setIsRewritingTechRider;
      setLoading(true);

      try {
        const response = await fetch("/api/epk/ai/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            artistName,
            genre,
            tone: "professional",
          }),
        });

        if (!response.ok) throw new Error("AI generation failed");

        const data = await response.json();
        if (data.text) {
          setModules((prev) =>
            prev.map((m) =>
              m.id === moduleId
                ? { ...m, data: { ...m.data, text: data.text } }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error("AI generation error:", error);
        alert(
          "AI generation failed. Please try again or enter content manually.",
        );
      } finally {
        setLoading(false);
      }
    },
    [artistName, genre],
  );

  const handleAIRewrite = useCallback(
    async (moduleId: string, type: "bio" | "press_quote" | "tech_rider") => {
      const module = modules.find((m) => m.id === moduleId);
      if (!module || !module.data?.text) return;

      const setLoading =
        type === "bio"
          ? setIsRewritingBio
          : type === "press_quote"
            ? setIsRewritingQuotes
            : setIsRewritingTechRider;
      setLoading(true);

      try {
        const response = await fetch("/api/epk/ai/improve-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: module.data.text,
            tone: "professional",
          }),
        });

        if (!response.ok) throw new Error("AI rewrite failed");

        const data = await response.json();
        if (data.text) {
          setModules((prev) =>
            prev.map((m) =>
              m.id === moduleId
                ? { ...m, data: { ...m.data, text: data.text } }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error("AI rewrite error:", error);
        alert("AI rewrite failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [modules],
  );

  const handleGenerateEPK = useCallback(async () => {
    if (!selectedTemplate || !artistName || modules.length === 0) {
      alert("Please complete all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/epk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          modules: modules.map((m, i) => ({ ...m, order: i })),
          artistName,
          releaseTitle: genre,
          exportFormat: "pdf",
          includeWatermark: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Generation failed: ${response.status}`,
        );
      }

      const data = await response.json();
      alert(
        `EPK queued! Job ID: ${data.jobId}. Check the Jobs page to download.`,
      );
    } catch (error) {
      console.error("EPK generation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate EPK. Please try again.",
      );
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
        <p className="text-gray-400">
          Create professional Electronic Press Kits with advanced templates and
          AI-powered content
        </p>
      </div>

      <div className="border-b border-[#1a1a1a] mb-8">
        <div className="flex gap-1">
          <button
            onClick={() => setStep("template")}
            className={`px-6 py-3 font-semibold transition-all ${
              step === "template"
                ? "bg-primary text-black border-b-2 border-primary"
                : "text-gray-400 hover:text-white border-b-2 border-transparent"
            }`}
          >
            1. Choose Template
          </button>
          <button
            onClick={() => setStep("edit")}
            disabled={!selectedTemplate}
            className={`px-6 py-3 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              step === "edit"
                ? "bg-primary text-black border-b-2 border-primary"
                : "text-gray-400 hover:text-white border-b-2 border-transparent"
            }`}
          >
            2. Edit Content
          </button>
          <button
            onClick={() => setStep("preview")}
            disabled={!selectedTemplate}
            className={`px-6 py-3 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              step === "preview"
                ? "bg-primary text-black border-b-2 border-primary"
                : "text-gray-400 hover:text-white border-b-2 border-transparent"
            }`}
          >
            3. Preview & Export
          </button>
        </div>
      </div>

      {step === "template" && (
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

      {step === "edit" && (
        <div className="space-y-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white capitalize">
                  {module.type === "bio"
                    ? "Biography"
                    : module.type === "quotes"
                      ? "Press Quotes"
                      : module.type === "techRider"
                        ? "Tech Rider"
                        : module.type}
                </h3>
                <div className="flex gap-2">
                  {(module.type === "bio" ||
                    module.type === "quotes" ||
                    module.type === "techRider") && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleGenerateContent(
                          module.id,
                          module.type === "bio"
                            ? "bio"
                            : module.type === "quotes"
                              ? "press_quote"
                              : "tech_rider",
                        )
                      }
                      disabled={
                        module.type === "bio"
                          ? isRewritingBio
                          : module.type === "quotes"
                            ? isRewritingQuotes
                            : isRewritingTechRider
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {(
                        module.type === "bio"
                          ? isRewritingBio
                          : module.type === "quotes"
                            ? isRewritingQuotes
                            : isRewritingTechRider
                      ) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Generate
                    </Button>
                  )}
                  {(module.type === "bio" ||
                    module.type === "quotes" ||
                    module.type === "techRider") &&
                    module.data?.text && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAIRewrite(
                            module.id,
                            module.type === "bio"
                              ? "bio"
                              : module.type === "quotes"
                                ? "press_quote"
                                : "tech_rider",
                          )
                        }
                        disabled={
                          module.type === "bio"
                            ? isRewritingBio
                            : module.type === "quotes"
                              ? isRewritingQuotes
                              : isRewritingTechRider
                        }
                        className="bg-primary hover:bg-primary/90 text-black"
                      >
                        {(
                          module.type === "bio"
                            ? isRewritingBio
                            : module.type === "quotes"
                              ? isRewritingQuotes
                              : isRewritingTechRider
                        ) ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        AI Rewrite
                      </Button>
                    )}
                </div>
              </div>
              <Textarea
                value={module.data?.text || ""}
                onChange={(e) => {
                  const newModules = modules.map((m) =>
                    m.id === module.id
                      ? { ...m, data: { ...m.data, text: e.target.value } }
                      : m,
                  );
                  setModules(newModules);
                }}
                placeholder={`Enter ${module.type}...`}
                className="bg-black border-[#333] text-white min-h-[200px] resize-none"
              />
            </div>
          ))}

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Add More Sections
            </h2>
            <DragDropEditor
              modules={modules}
              onModulesChange={setModules}
              supportedModules={selectedTemplate?.supportedModules}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setStep("template")}
              className="w-full sm:w-auto"
            >
              Back to Templates
            </Button>
            <Button
              onClick={() => setStep("preview")}
              disabled={modules.length === 0}
              className="bg-primary hover:bg-primary/90 text-black w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview EPK
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Live Preview</h2>
              {isLoadingPreview && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading preview...
                </div>
              )}
            </div>
            <div
              className="bg-white rounded overflow-hidden border-4 border-gray-800"
              style={{ minHeight: "1200px" }}
            >
              <iframe
                ref={previewRef}
                className="w-full h-[1200px] bg-white"
                title="EPK Preview"
                sandbox="allow-same-origin allow-scripts"
                style={{ border: "none" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {artistName} - {selectedTemplate?.name} - {modules.length} modules
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setStep("edit")}
              className="w-full sm:w-auto"
            >
              Back to Edit
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleGenerateEPK}
                disabled={isGenerating || modules.length === 0}
                className="bg-primary hover:bg-primary/90 text-black w-full sm:w-auto"
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
