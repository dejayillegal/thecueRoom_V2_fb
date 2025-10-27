"use client";
import { useEffect } from "react";

export type QuickKey =
  | "podcasts" | "mixes" | "playlists"
  | "events" | "labels"
  | "tutorials" | "freebies" | "updates"
  | "industry"
  | "india" | "asia";

export const QUICK_FILTERS: { key: QuickKey; label: string; }[] = [
  { key: "podcasts",  label: "Podcasts" },
  { key: "mixes",     label: "Mixes" },
  { key: "playlists", label: "Playlists" },
  { key: "events",    label: "Events" },
  { key: "labels",    label: "Labels" },
  { key: "tutorials", label: "Tutorials" },
  { key: "freebies",  label: "Freebies" },
  { key: "updates",   label: "Updates" },
  { key: "industry",  label: "Industry" },
  { key: "india",     label: "India" },
  { key: "asia",      label: "Asia" },
];

export default function FilterBar({
  selected,
  onToggle,
  onClear }: {
  selected: Set<QuickKey>;
  onToggle: (k: QuickKey) => void;
  onClear: () => void;
}) {
  // Keyboard: Escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClear(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClear]);

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {QUICK_FILTERS.map(({key,label})=>{
        const active = selected.has(key);
        return (
          <button
            key={key}
            role="checkbox"
            aria-checked={active}
            onClick={()=> onToggle(key)}
            className={[
              "relative inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium",
              "ring-1 ring-neutral-800/80 bg-[#101012]/80 backdrop-blur tcr-chip",
              active
                ? "text-black"
                : "text-neutral-300 hover:text-white"
            ].join(" ")}
            data-active={active ? "true":"false"}
          >
            <span className="relative z-10">{label}</span>
            <span aria-hidden className="tcr-chip-glow" />
          </button>
        );
      })}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="ml-2 text-xs text-neutral-400 hover:text-white underline decoration-dotted"
        >
          Clear
        </button>
      )}
    </div>
  );
}
