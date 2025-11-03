"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { createModuleId } from "@/lib/epk/utils";

interface TechRiderItem {
  id: string;
  type: "cdj" | "mixer" | "speakers" | "turntable" | "custom";
  label: string;
  quantity?: number;
}

interface TechRiderEditorProps {
  items: TechRiderItem[];
  onChange: (items: TechRiderItem[]) => void;
}

const GEAR_ICONS: Record<string, string> = {
  cdj: "🎧",
  mixer: "🎛️",
  speakers: "🔊",
  turntable: "💿",
  custom: "⚡",
};

const PRESET_GEAR: Omit<TechRiderItem, "id">[] = [
  { type: "cdj", label: "CDJ-3000", quantity: 2 },
  { type: "cdj", label: "CDJ-2000NXS2", quantity: 2 },
  { type: "mixer", label: "DJM-900NXS2", quantity: 1 },
  { type: "mixer", label: "DJM-A9", quantity: 1 },
  { type: "turntable", label: "Technics SL-1200", quantity: 2 },
  { type: "speakers", label: "Pioneer XY-3", quantity: 2 },
];

export default function TechRiderEditor({
  items,
  onChange,
}: TechRiderEditorProps) {
  const [customLabel, setCustomLabel] = useState("");

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    onChange(newItems);
  }

  function addPresetGear(gear: Omit<TechRiderItem, "id">) {
    const newItem: TechRiderItem = {
      id: createModuleId(),
      ...gear,
    };
    onChange([...items, newItem]);
  }

  function addCustomGear() {
    if (!customLabel.trim()) return;

    const newItem: TechRiderItem = {
      id: createModuleId(),
      type: "custom",
      label: customLabel.trim(),
      quantity: 1,
    };
    onChange([...items, newItem]);
    setCustomLabel("");
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-[#D7FF3C] mb-3">
          Quick Add Gear
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_GEAR.map((gear, index) => (
            <button
              key={index}
              onClick={() => addPresetGear(gear)}
              className="dashboard-card p-3 text-left hover:ring-1 hover:ring-[#9B5CFF] transition-all flex items-center gap-2"
            >
              <span className="text-2xl">{GEAR_ICONS[gear.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{gear.label}</div>
                <div className="text-xs text-gray-500">{gear.quantity}x</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#D7FF3C] mb-2">
          Custom Gear
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCustomGear()}
            placeholder="Add custom equipment..."
            className="flex-1 px-3 py-2 bg-[#1a1a1a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
          />
          <button
            onClick={addCustomGear}
            disabled={!customLabel.trim()}
            className="px-4 py-2 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#D7FF3C] mb-2">
          Tech Rider ({items.length} {items.length === 1 ? "item" : "items"})
        </h4>

        {items.length === 0 ? (
          <div className="dashboard-card p-6 text-center text-gray-500">
            No equipment added yet. Add gear from the presets above or create
            custom items.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tech-rider" ignoreContainerClipping={false}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`dashboard-card p-3 flex items-center gap-3 ${
                            snapshot.isDragging ? "ring-2 ring-[#D7FF3C]" : ""
                          }`}
                        >
                          <span className="text-2xl cursor-grab active:cursor-grabbing">
                            {GEAR_ICONS[item.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {item.label}
                            </div>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity || 1}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 px-2 py-1 bg-[#0B0B0B] rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={() => removeItem(item.id)}
                            className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
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
