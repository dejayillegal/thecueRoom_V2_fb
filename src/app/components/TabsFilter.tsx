"use client";
import { useId, useMemo, useState, useEffect, useRef } from "react";

type Tab = { key: string; label: string; };
type Props = { tabs: Tab[]; initialKey: string; onChange: (key:string)=>void; };

export default function TabsFilter({ tabs, initialKey, onChange }: Props) {
  const [active, setActive] = useState(initialKey);
  const id = useId();
  const idx = useMemo(()=> Math.max(0, tabs.findIndex(t=>t.key===active)),[tabs,active]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ onChange(active); }, [active, onChange]);

  // Keyboard arrows for accessibility
  useEffect(() => {
    const el = listRef.current; if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowLeft","ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + tabs.length) % tabs.length;
      setActive(tabs[next].key);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [idx, tabs]);

  return (
    <div className="mb-3">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Feed filters"
        tabIndex={0}
        className="relative flex gap-2 rounded-2xl p-1 ring-1 ring-neutral-800/80 bg-[#0E0E0F]/70 backdrop-blur-md tcr-glass"
      >
        {tabs.map((t)=>(
          <button
            key={t.key}
            id={`${id}-tab-${t.key}`}
            role="tab"
            aria-selected={active===t.key}
            aria-controls={`${id}-panel`}
            className={[
              "relative z-10 px-4 py-2 text-sm rounded-xl transition-[color,transform] duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF3C]/60",
              active===t.key
                ? "text-white"
                : "text-neutral-400 hover:text-neutral-100 hover:scale-[1.02]"
            ].join(" ")}
            onClick={()=> setActive(t.key)}
          >
            <span className="relative tcr-tab-label">{t.label}</span>
          </button>
        ))}

        {/* Neon slider pill */}
        <div
          aria-hidden
          className="tcr-pill absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl"
          style={{
            transform:`translateX(calc(${idx} * (100% + 0.5rem)))`
          }}
        />
      </div>
    </div>
  );
}
