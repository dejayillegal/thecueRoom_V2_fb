'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TemplatePicker from './TemplatePicker';
import TechRiderEditor from './TechRiderEditor';
import { 
  createModule, 
  debounce, 
  enqueueEPKJob, 
  pollJobStatus,
  safeFetch,
  safeParseJSON,
  type EPKModule,
  type EPKModuleType
} from '@/lib/epk/utils';

const MODULE_PALETTE: { type: EPKModuleType; label: string; icon: string }[] = [
  { type: 'bio', label: 'Biography', icon: '📝' },
  { type: 'tracklist', label: 'Tracklist', icon: '🎵' },
  { type: 'gallery', label: 'Photo Gallery', icon: '🖼️' },
  { type: 'techRider', label: 'Tech Rider', icon: '🎛️' },
  { type: 'links', label: 'Links', icon: '🔗' },
  { type: 'quotes', label: 'Press Quotes', icon: '💬' }
];

export default function EPKStudio() {
  const [templateId, setTemplateId] = useState<string>('brutalist-onepage');
  const [modules, setModules] = useState<EPKModule[]>([]);
  const [artistName, setArtistName] = useState('');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [previewHTML, setPreviewHTML] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [aiRewriting, setAiRewriting] = useState(false);

  const previewRef = useRef<HTMLIFrameElement>(null);

  const updatePreview = debounce(async () => {
    try {
      const response = await safeFetch('/api/epk/template-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          modules,
          artistName,
          releaseTitle
        })
      });

      const html = await response.text();
      setPreviewHTML(html);
    } catch (error) {
      console.error('Preview error:', error);
    }
  }, 600);

  useEffect(() => {
    updatePreview();
  }, [templateId, modules, artistName, releaseTitle]);

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

  function addModule(type: EPKModuleType) {
    const newModule = createModule(type, modules.length);
    setModules([...modules, newModule]);
    setSelectedModuleId(newModule.id);
  }

  function removeModule(id: string) {
    setModules(modules.filter(m => m.id !== id));
    if (selectedModuleId === id) {
      setSelectedModuleId(null);
    }
  }

  function updateModuleData(id: string, data: any) {
    setModules(modules.map(m =>
      m.id === id ? { ...m, data } : m
    ));
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newModules = Array.from(modules);
    const [reorderedItem] = newModules.splice(result.source.index, 1);
    newModules.splice(result.destination.index, 0, reorderedItem);

    setModules(newModules.map((m, i) => ({ ...m, order: i })));
  }

  async function handleAIRewrite(moduleId: string, text: string) {
    if (!text.trim()) return;

    setAiRewriting(true);
    try {
      const response = await safeFetch('/api/epk/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone: 'bio' })
      });

      const data = await safeParseJSON<{ ok: boolean; rewritten: string; usedHF?: boolean }>(response);

      if (data.ok) {
        updateModuleData(moduleId, { text: data.rewritten });
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
    } finally {
      setAiRewriting(false);
    }
  }

  async function handleExport(format: 'pdf' | 'zip') {
    if (modules.length === 0) {
      alert('Please add at least one module before exporting.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const jobId = await enqueueEPKJob({
        templateId,
        modules,
        artistName,
        releaseTitle,
        exportFormat: format,
        includeWatermark: true
      });

      const result = await pollJobStatus(jobId, (progress) => {
        setExportProgress(progress);
      });

      if (result.resultUrl) {
        window.open(result.resultUrl, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-6">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-[#D7FF3C]">EPK Studio</h1>
          <p className="text-gray-400 mt-1">Create professional electronic press kits</p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-6">
            <section className="dashboard-card p-4">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Artist Info</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Artist Name"
                  className="w-full px-3 py-2 bg-[#0B0B0B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
                />
                <input
                  type="text"
                  value={releaseTitle}
                  onChange={(e) => setReleaseTitle(e.target.value)}
                  placeholder="Release Title (optional)"
                  className="w-full px-3 py-2 bg-[#0B0B0B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
                />
              </div>
            </section>

            <section className="dashboard-card p-4">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Add Modules</h2>
              <div className="space-y-2">
                {MODULE_PALETTE.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addModule(item.type)}
                    className="w-full flex items-center gap-3 p-3 bg-[#0B0B0B] rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-card p-4">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Current Modules</h2>
              {modules.length === 0 ? (
                <p className="text-gray-500 text-sm">No modules added yet</p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable 
                    droppableId="epk-modules"
                    isDropDisabled={false}
                    isCombineEnabled={false}
                    ignoreContainerClipping={false}
                  >
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {modules.map((module, index) => (
                          <Draggable key={module.id} draggableId={module.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 rounded cursor-move ${
                                  selectedModuleId === module.id
                                    ? 'bg-[#9B5CFF]'
                                    : 'bg-[#0B0B0B] hover:bg-[#1a1a1a]'
                                } ${snapshot.isDragging ? 'ring-2 ring-[#D7FF3C]' : ''}`}
                                onClick={() => setSelectedModuleId(module.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">
                                    {MODULE_PALETTE.find(p => p.type === module.type)?.label}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeModule(module.id);
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </section>
          </div>

          <div className="col-span-6">
            <div className="dashboard-card p-4 h-full">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Live Preview</h2>
              <iframe
                ref={previewRef}
                className="w-full h-[800px] bg-[#0B0B0B] rounded-lg"
                title="EPK Preview"
              />
            </div>
          </div>

          <div className="col-span-3 space-y-6">
            <section className="dashboard-card p-4">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Template</h2>
              <TemplatePicker
                onSelect={setTemplateId}
                selectedTemplateId={templateId}
              />
            </section>

            {selectedModule && (
              <section className="dashboard-card p-4">
                <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">
                  Edit {MODULE_PALETTE.find(p => p.type === selectedModule.type)?.label}
                </h2>

                {selectedModule.type === 'bio' && (
                  <div className="space-y-3">
                    <textarea
                      value={selectedModule.data.text || ''}
                      onChange={(e) => updateModuleData(selectedModule.id, { text: e.target.value })}
                      placeholder="Enter artist biography..."
                      rows={8}
                      className="w-full px-3 py-2 bg-[#0B0B0B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#9B5CFF] resize-none"
                    />
                    <button
                      onClick={() => handleAIRewrite(selectedModule.id, selectedModule.data.text)}
                      disabled={aiRewriting || !selectedModule.data.text}
                      className="w-full py-2 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {aiRewriting ? 'AI Rewriting...' : '✨ AI Suggest Rewrite'}
                    </button>
                  </div>
                )}

                {selectedModule.type === 'techRider' && (
                  <TechRiderEditor
                    items={selectedModule.data.items || []}
                    onChange={(items) => updateModuleData(selectedModule.id, { items })}
                  />
                )}

                {selectedModule.type === 'tracklist' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const tracks = selectedModule.data.tracks || [];
                        updateModuleData(selectedModule.id, {
                          tracks: [...tracks, { title: '', soundcloudUrl: '' }]
                        });
                      }}
                      className="w-full py-2 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] transition-colors font-medium"
                    >
                      Add Track
                    </button>
                  </div>
                )}
              </section>
            )}

            <section className="dashboard-card p-4">
              <h2 className="text-lg font-semibold text-[#D7FF3C] mb-3">Export</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting || modules.length === 0}
                  className="w-full py-3 bg-[#D7FF3C] text-[#0B0B0B] rounded-lg hover:bg-[#c8f02e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                >
                  {isExporting ? `Exporting... ${exportProgress}%` : 'Export as PDF'}
                </button>
                <button
                  onClick={() => handleExport('zip')}
                  disabled={isExporting || modules.length === 0}
                  className="w-full py-3 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                >
                  Export as ZIP
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}