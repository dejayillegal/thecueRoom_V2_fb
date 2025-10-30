'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { EPKModule, EPKModuleType } from '@thecueroom/epk';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  GripVertical, Plus, Trash2, Image as ImageIcon, 
  Video, Calendar, Music, Quote, Link2, 
  FileText, Settings, Camera, TrendingUp, X 
} from 'lucide-react';

interface DragDropEditorProps {
  modules: EPKModule[];
  onModulesChange: (modules: EPKModule[]) => void;
  supportedModules?: EPKModuleType[];
}

const MODULE_ICONS: Record<EPKModuleType, any> = {
  bio: FileText,
  quotes: Quote,
  links: Link2,
  tracklist: Music,
  techRider: Settings,
  gallery: ImageIcon,
  video: Video,
  tourDates: Calendar,
  discography: Music,
  pressTimeline: TrendingUp,
  stats: TrendingUp,
  customText: FileText
};

const MODULE_LABELS: Record<EPKModuleType, string> = {
  bio: 'Biography',
  quotes: 'Press Quotes',
  links: 'Social Links',
  tracklist: 'Tracklist',
  techRider: 'Tech Rider',
  gallery: 'Photo Gallery',
  video: 'Video Showcase',
  tourDates: 'Tour Dates',
  discography: 'Discography',
  pressTimeline: 'Press Timeline',
  stats: 'Statistics',
  customText: 'Custom Text'
};

export function DragDropEditor({ modules, onModulesChange, supportedModules }: DragDropEditorProps) {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const handleAddModule = useCallback((type: EPKModuleType) => {
    const newModule: EPKModule = {
      id: `module-${Date.now()}`,
      type,
      order: modules.length,
      data: getDefaultDataForType(type)
    };
    onModulesChange([...modules, newModule]);
    setExpandedModuleId(newModule.id);
  }, [modules, onModulesChange]);

  const handleDeleteModule = useCallback((id: string) => {
    onModulesChange(modules.filter(m => m.id !== id));
  }, [modules, onModulesChange]);

  const handleUpdateModule = useCallback((id: string, updates: Partial<EPKModule>) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [modules, onModulesChange]);

  const handleMoveModule = useCallback((fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [moved] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, moved);
    onModulesChange(newModules.map((m, i) => ({ ...m, order: i })));
  }, [modules, onModulesChange]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    handleMoveModule(result.source.index, result.destination.index);
  }, [handleMoveModule]);

  const availableModuleTypes = supportedModules || Object.keys(MODULE_LABELS) as EPKModuleType[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableModuleTypes.map(type => {
          const Icon = MODULE_ICONS[type];
          return (
            <Button
              key={type}
              size="sm"
              variant="outline"
              onClick={() => handleAddModule(type)}
              className="text-xs"
            >
              <Icon className="w-3 h-3 mr-1" />
              Add {MODULE_LABELS[type]}
            </Button>
          );
        })}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
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
              className="space-y-3"
            >
              {modules.map((module, index) => {
                const Icon = MODULE_ICONS[module.type];
                const isExpanded = expandedModuleId === module.id;

                return (
                  <Draggable key={module.id} draggableId={module.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                      >
                        <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-4">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                            </div>
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="flex-1 font-medium text-white text-sm">
                              {MODULE_LABELS[module.type]}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 space-y-3">
                              {renderModuleEditor(module, (data) => handleUpdateModule(module.id, { data }))}
                            </div>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function getDefaultDataForType(type: EPKModuleType): any {
  switch (type) {
    case 'bio':
      return { text: '' };
    case 'quotes':
      return { quotes: [] };
    case 'links':
      return { links: [] };
    case 'tracklist':
      return { tracks: [] };
    case 'techRider':
      return { items: [] };
    case 'gallery':
      return { images: [] };
    case 'video':
      return { videos: [] };
    case 'tourDates':
      return { dates: [] };
    case 'discography':
      return { releases: [] };
    case 'pressTimeline':
      return { events: [] };
    case 'stats':
      return { metrics: [] };
    case 'customText':
      return { title: '', content: '' };
    default:
      return {};
  }
}

function renderModuleEditor(module: EPKModule, onChange: (data: any) => void) {
  switch (module.type) {
    case 'bio':
      return (
        <Textarea
          value={module.data.text || ''}
          onChange={(e) => onChange({ ...module.data, text: e.target.value })}
          placeholder="Enter artist biography..."
          className="bg-black border-[#1a1a1a] text-white min-h-[200px]"
        />
      );

    case 'quotes':
      return (
        <div className="space-y-2">
          {(module.data.quotes || []).map((quote: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Textarea
                value={quote}
                onChange={(e) => {
                  const newQuotes = [...(module.data.quotes || [])];
                  newQuotes[idx] = e.target.value;
                  onChange({ ...module.data, quotes: newQuotes });
                }}
                placeholder={`Press quote ${idx + 1}...`}
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newQuotes = (module.data.quotes || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, quotes: newQuotes });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, quotes: [...(module.data.quotes || []), ''] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Quote
          </Button>
        </div>
      );

    case 'links':
      return (
        <div className="space-y-2">
          {(module.data.links || []).map((link: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={link.platform || ''}
                onChange={(e) => {
                  const newLinks = [...(module.data.links || [])];
                  newLinks[idx] = { ...newLinks[idx], platform: e.target.value };
                  onChange({ ...module.data, links: newLinks });
                }}
                placeholder="Platform (e.g., Spotify, SoundCloud)"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Input
                value={link.url || ''}
                onChange={(e) => {
                  const newLinks = [...(module.data.links || [])];
                  newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                  onChange({ ...module.data, links: newLinks });
                }}
                placeholder="URL"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newLinks = (module.data.links || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, links: newLinks });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, links: [...(module.data.links || []), { platform: '', url: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Link
          </Button>
        </div>
      );

    case 'tracklist':
      return (
        <div className="space-y-2">
          {(module.data.tracks || []).map((track: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={track.title || ''}
                onChange={(e) => {
                  const newTracks = [...(module.data.tracks || [])];
                  newTracks[idx] = { ...newTracks[idx], title: e.target.value };
                  onChange({ ...module.data, tracks: newTracks });
                }}
                placeholder="Track title"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Input
                value={track.url || ''}
                onChange={(e) => {
                  const newTracks = [...(module.data.tracks || [])];
                  newTracks[idx] = { ...newTracks[idx], url: e.target.value };
                  onChange({ ...module.data, tracks: newTracks });
                }}
                placeholder="Stream URL (optional)"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newTracks = (module.data.tracks || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, tracks: newTracks });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, tracks: [...(module.data.tracks || []), { title: '', url: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Track
          </Button>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-2">
          <Label className="text-gray-300 text-sm">Image URLs</Label>
          {(module.data.images || []).map((img: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={img}
                onChange={(e) => {
                  const newImages = [...(module.data.images || [])];
                  newImages[idx] = e.target.value;
                  onChange({ ...module.data, images: newImages });
                }}
                placeholder="Image URL"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newImages = (module.data.images || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, images: newImages });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, images: [...(module.data.images || []), ''] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Image
          </Button>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-2">
          <Label className="text-gray-300 text-sm">Video Embeds (YouTube, Vimeo, SoundCloud)</Label>
          {(module.data.videos || []).map((video: any, idx: number) => (
            <div key={idx} className="space-y-2 border border-[#1a1a1a] p-3 rounded">
              <Input
                value={video.title || ''}
                onChange={(e) => {
                  const newVideos = [...(module.data.videos || [])];
                  newVideos[idx] = { ...newVideos[idx], title: e.target.value };
                  onChange({ ...module.data, videos: newVideos });
                }}
                placeholder="Video title"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                value={video.url || ''}
                onChange={(e) => {
                  const newVideos = [...(module.data.videos || [])];
                  newVideos[idx] = { ...newVideos[idx], url: e.target.value };
                  onChange({ ...module.data, videos: newVideos });
                }}
                placeholder="Embed URL"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newVideos = (module.data.videos || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, videos: newVideos });
                }}
              >
                <X className="w-3 h-3 mr-1" /> Remove Video
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, videos: [...(module.data.videos || []), { title: '', url: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Video
          </Button>
        </div>
      );

    case 'tourDates':
      return (
        <div className="space-y-2">
          {(module.data.dates || []).map((date: any, idx: number) => (
            <div key={idx} className="space-y-2 border border-[#1a1a1a] p-3 rounded">
              <Input
                type="date"
                value={date.date || ''}
                onChange={(e) => {
                  const newDates = [...(module.data.dates || [])];
                  newDates[idx] = { ...newDates[idx], date: e.target.value };
                  onChange({ ...module.data, dates: newDates });
                }}
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                value={date.venue || ''}
                onChange={(e) => {
                  const newDates = [...(module.data.dates || [])];
                  newDates[idx] = { ...newDates[idx], venue: e.target.value };
                  onChange({ ...module.data, dates: newDates });
                }}
                placeholder="Venue"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                value={date.location || ''}
                onChange={(e) => {
                  const newDates = [...(module.data.dates || [])];
                  newDates[idx] = { ...newDates[idx], location: e.target.value };
                  onChange({ ...module.data, dates: newDates });
                }}
                placeholder="Location"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newDates = (module.data.dates || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, dates: newDates });
                }}
              >
                <X className="w-3 h-3 mr-1" /> Remove Date
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, dates: [...(module.data.dates || []), { date: '', venue: '', location: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Tour Date
          </Button>
        </div>
      );

    case 'discography':
      return (
        <div className="space-y-2">
          {(module.data.releases || []).map((release: any, idx: number) => (
            <div key={idx} className="space-y-2 border border-[#1a1a1a] p-3 rounded">
              <Input
                value={release.title || ''}
                onChange={(e) => {
                  const newReleases = [...(module.data.releases || [])];
                  newReleases[idx] = { ...newReleases[idx], title: e.target.value };
                  onChange({ ...module.data, releases: newReleases });
                }}
                placeholder="Release title"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                value={release.label || ''}
                onChange={(e) => {
                  const newReleases = [...(module.data.releases || [])];
                  newReleases[idx] = { ...newReleases[idx], label: e.target.value };
                  onChange({ ...module.data, releases: newReleases });
                }}
                placeholder="Label"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                type="date"
                value={release.date || ''}
                onChange={(e) => {
                  const newReleases = [...(module.data.releases || [])];
                  newReleases[idx] = { ...newReleases[idx], date: e.target.value };
                  onChange({ ...module.data, releases: newReleases });
                }}
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newReleases = (module.data.releases || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, releases: newReleases });
                }}
              >
                <X className="w-3 h-3 mr-1" /> Remove Release
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, releases: [...(module.data.releases || []), { title: '', label: '', date: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Release
          </Button>
        </div>
      );

    case 'pressTimeline':
      return (
        <div className="space-y-2">
          {(module.data.events || []).map((event: any, idx: number) => (
            <div key={idx} className="space-y-2 border border-[#1a1a1a] p-3 rounded">
              <Input
                type="date"
                value={event.date || ''}
                onChange={(e) => {
                  const newEvents = [...(module.data.events || [])];
                  newEvents[idx] = { ...newEvents[idx], date: e.target.value };
                  onChange({ ...module.data, events: newEvents });
                }}
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Input
                value={event.publication || ''}
                onChange={(e) => {
                  const newEvents = [...(module.data.events || [])];
                  newEvents[idx] = { ...newEvents[idx], publication: e.target.value };
                  onChange({ ...module.data, events: newEvents });
                }}
                placeholder="Publication"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Textarea
                value={event.description || ''}
                onChange={(e) => {
                  const newEvents = [...(module.data.events || [])];
                  newEvents[idx] = { ...newEvents[idx], description: e.target.value };
                  onChange({ ...module.data, events: newEvents });
                }}
                placeholder="Description"
                className="bg-black border-[#1a1a1a] text-white"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newEvents = (module.data.events || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, events: newEvents });
                }}
              >
                <X className="w-3 h-3 mr-1" /> Remove Event
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, events: [...(module.data.events || []), { date: '', publication: '', description: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Press Event
          </Button>
        </div>
      );

    case 'techRider':
      return (
        <div className="space-y-2">
          {(module.data.items || []).map((item: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={item.label || ''}
                onChange={(e) => {
                  const newItems = [...(module.data.items || [])];
                  newItems[idx] = { ...newItems[idx], label: e.target.value };
                  onChange({ ...module.data, items: newItems });
                }}
                placeholder="Equipment (e.g., 2x CDJ-3000)"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newItems = (module.data.items || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, items: newItems });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, items: [...(module.data.items || []), { label: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Equipment
          </Button>
        </div>
      );

    case 'customText':
      return (
        <>
          <Input
            value={module.data.title || ''}
            onChange={(e) => onChange({ ...module.data, title: e.target.value })}
            placeholder="Section title..."
            className="bg-black border-[#1a1a1a] text-white"
          />
          <Textarea
            value={module.data.content || ''}
            onChange={(e) => onChange({ ...module.data, content: e.target.value })}
            placeholder="Section content..."
            className="bg-black border-[#1a1a1a] text-white"
          />
        </>
      );

    case 'stats':
      return (
        <div className="space-y-2">
          {(module.data.metrics || []).map((metric: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={metric.label || ''}
                onChange={(e) => {
                  const newMetrics = [...(module.data.metrics || [])];
                  newMetrics[idx] = { ...newMetrics[idx], label: e.target.value };
                  onChange({ ...module.data, metrics: newMetrics });
                }}
                placeholder="Label (e.g., Monthly Listeners)"
                className="bg-black border-[#1a1a1a] text-white flex-1"
              />
              <Input
                value={metric.value || ''}
                onChange={(e) => {
                  const newMetrics = [...(module.data.metrics || [])];
                  newMetrics[idx] = { ...newMetrics[idx], value: e.target.value };
                  onChange({ ...module.data, metrics: newMetrics });
                }}
                placeholder="Value (e.g., 50K)"
                className="bg-black border-[#1a1a1a] text-white w-32"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newMetrics = (module.data.metrics || []).filter((_: any, i: number) => i !== idx);
                  onChange({ ...module.data, metrics: newMetrics });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => onChange({ ...module.data, metrics: [...(module.data.metrics || []), { label: '', value: '' }] })}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Metric
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-gray-400 text-sm">
          Module editor for {module.type} (unsupported module type)
        </div>
      );
  }
}
