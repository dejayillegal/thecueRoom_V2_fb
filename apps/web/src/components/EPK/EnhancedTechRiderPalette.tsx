'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
const createModuleId = () => `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
import { Plus, X, GripVertical } from 'lucide-react';

export interface TechRiderItem {
  id: string;
  type: 'cdj' | 'mixer' | 'speakers' | 'turntable' | 'custom';
  label: string;
  quantity?: number;
  notes?: string;
  icon?: string;
}

interface EnhancedTechRiderPaletteProps {
  items: TechRiderItem[];
  onChange: (items: TechRiderItem[]) => void;
}

const PALETTE_ITEMS: Omit<TechRiderItem, 'id'>[] = [
  { type: 'cdj', label: 'CDJ-3000', quantity: 2, icon: '/assets/tech-rider/cdj.png' },
  { type: 'cdj', label: 'CDJ-2000NXS2', quantity: 2, icon: '/assets/tech-rider/cdj.png' },
  { type: 'mixer', label: 'DJM-900NXS2', quantity: 1, icon: '/assets/tech-rider/mixer.png' },
  { type: 'mixer', label: 'DJM-A9', quantity: 1, icon: '/assets/tech-rider/mixer.png' },
  { type: 'turntable', label: 'Technics SL-1210', quantity: 2, icon: '/assets/tech-rider/cdj.png' },
  { type: 'speakers', label: 'Monitor Speakers', quantity: 2, icon: '/assets/tech-rider/speaker.png' },
  { type: 'speakers', label: 'PA System', quantity: 1, icon: '/assets/tech-rider/speaker.png' },
  { type: 'speakers', label: 'In-Ear Monitors', quantity: 1, icon: '/assets/tech-rider/speaker.png' },
];

export default function EnhancedTechRiderPalette({ items, onChange }: EnhancedTechRiderPaletteProps) {
  const [customLabel, setCustomLabel] = useState('');

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    onChange(newItems);
  }

  function addPaletteItem(item: Omit<TechRiderItem, 'id'>) {
    const newItem: TechRiderItem = {
      id: createModuleId(),
      ...item
    };
    onChange([...items, newItem]);
  }

  function addCustomItem() {
    if (!customLabel.trim()) return;

    const newItem: TechRiderItem = {
      id: createModuleId(),
      type: 'custom',
      label: customLabel.trim(),
      quantity: 1
    };
    onChange([...items, newItem]);
    setCustomLabel('');
  }

  function removeItem(id: string) {
    onChange(items.filter(item => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    onChange(items.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  }

  function updateNotes(id: string, notes: string) {
    onChange(items.map(item =>
      item.id === id ? { ...item, notes } : item
    ));
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-[#D1FF3D] mb-3">Equipment Palette</h4>
        <p className="text-xs text-gray-400 mb-3">Click to add equipment to your tech rider</p>
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_ITEMS.map((item, index) => (
            <button
              key={index}
              onClick={() => addPaletteItem(item)}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-left transition-all hover:scale-[1.02] hover:bg-[#222] hover:border-[#D1FF3D]/30 flex items-center gap-2"
              aria-label={`Add ${item.label} to tech rider`}
            >
              {item.icon && (
                <img src={item.icon} alt={item.type} className="w-8 h-8 object-contain" />
              )}
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
              </div>
              <Plus className="w-4 h-4 text-[#9B5CFF]" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#D1FF3D] mb-2">
          Custom Equipment
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            placeholder="e.g., Wireless Microphone"
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B5CFF] focus:border-transparent"
            aria-label="Custom equipment name"
          />
          <button
            onClick={addCustomItem}
            className="px-4 py-2 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] transition-colors font-medium flex items-center gap-1"
            aria-label="Add custom equipment"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#D1FF3D] mb-3">
          Your Tech Rider ({items.length} items)
        </h4>

        {items.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 text-center text-gray-500">
            No equipment added yet. Click items above to build your tech rider.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tech-rider">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                  role="list"
                  aria-label="Tech rider equipment list"
                >
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-3 ${
                            snapshot.isDragging ? 'ring-2 ring-[#9B5CFF] shadow-lg' : ''
                          }`}
                          role="listitem"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="w-5 h-5 text-gray-500" />
                            </div>

                            {item.icon && (
                              <img src={item.icon} alt={item.type} className="w-10 h-10 object-contain mt-1" />
                            )}

                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="text-white font-medium">{item.label}</div>
                                  <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-400">Qty:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="w-16 bg-[#0B0B0B] border border-[#333] rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
                                    aria-label={`Quantity for ${item.label}`}
                                  />

                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    aria-label={`Remove ${item.label}`}
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) => updateNotes(item.id, e.target.value)}
                                placeholder="Additional notes or specifications..."
                                className="w-full bg-[#0B0B0B] border border-[#333] rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
                                aria-label={`Notes for ${item.label}`}
                              />
                            </div>
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
      </div>
    </div>
  );
}