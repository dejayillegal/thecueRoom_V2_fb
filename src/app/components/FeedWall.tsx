
"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type Item = { title:string; source:string; url:string; publishedAt:string; tags:string[]; summary:string; image:string; };

// Client-side only date component to prevent hydration mismatch
function ClientOnlyDate({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState("");
  useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString('en-US',{ month:"short", day:"2-digit" }));
  }, [date]);
  return <>{formattedDate}</>;
}

export default function FeedWall({ items, onTag }: { items: Item[]; onTag?: (tag:string)=>void; }) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  if (!items?.length) return null;
  
  const handleImageLoad = (url: string) => {
    setLoadedImages(prev => new Set(prev).add(url));
  };

  return (
    <section aria-label="Latest" className="my-8">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
        {items.map((it)=>{
          const isLoaded = loadedImages.has(it.url);
          return (
            <article key={it.url} className="break-inside-avoid mb-6 rounded-xl overflow-hidden ring-1 ring-neutral-800 bg-[#111] group shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="relative h-52 bg-neutral-900 rounded-t-xl overflow-hidden">
                <Link href={it.url} target="_blank" rel="external noopener noreferrer" className="block h-full">
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
                  )}
                  <Image 
                    src={it.image} 
                    alt={it.title} 
                    fill 
                    sizes="33vw"
                    className={`object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 group-hover:scale-110' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(it.url)}
                    priority={false}
                  />
                </Link>
                {/* share bar (top-right) */}
                <div className="tcr-share absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShareButtons title={it.title} url={it.url} />
                </div>
              </div>

              <div className="p-5">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-3 font-semibold">
                  {it.source} • <ClientOnlyDate date={it.publishedAt} />
                </div>
                <Link href={it.url} target="_blank" rel="external noopener noreferrer">
                  <h4 className="font-bold text-base leading-tight text-neutral-50 group-hover:text-[#D7FF3C] transition-colors line-clamp-2 mb-3">{it.title}</h4>
                </Link>
                <p className="text-[13px] leading-relaxed text-neutral-400 line-clamp-3 mb-4">{it.summary}</p>

                {/* hashtags */}
                <div className="flex gap-2 flex-wrap">
                  {(it.tags||[]).slice(0,6).map(t=>{
                    const tag = t.toLowerCase();
                    return (
                      <button 
                        key={tag} 
                        onClick={(e)=> {
                          e.preventDefault();
                          onTag?.(tag);
                        }} 
                        className="tcr-hash text-[11px] px-3 py-1 rounded-full font-medium"
                        type="button"
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShareButtons({ title, url }:{ title:string; url:string }) {
  const u = encodeURIComponent(url); const text = encodeURIComponent(title);
  const links = {
    x: `https://twitter.com/intent/tweet?url=${u}&text=${text}`,
    fb:`https://www.facebook.com/sharer/sharer.php?u=${u}`,
    rd:`https://www.reddit.com/submit?url=${u}&title=${text}`,
    wa:`https://wa.me/?text=${text}%20${u}`,
    tg:`https://t.me/share/url?url=${u}&text=${text}`,
  };
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title, url }); } catch {}
  };
  return (
    <>
      <a aria-label="Share on X" href={links.x} target="_blank" rel="noopener noreferrer" className="tcr-ico tcr-ico-sec">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.9 2H22l-9.6 11.1L22 22h-7.5l-5.9-7.1L2.1 22H0l10.4-12L0 2h7.6l5.4 6.5L18.9 2Z"/></svg>
      </a>
      <a aria-label="Share on Facebook" href={links.fb} target="_blank" rel="noopener noreferrer" className="tcr-ico tcr-ico-sec">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M13 22v-9h3l1-4h-4V6c0-1.1.9-2 2-2h2V1h-3a5 5 0 0 0-5 5v3H6v4h3v9h4z"/></svg>
      </a>
      <a aria-label="Share on Reddit" href={links.rd} target="_blank" rel="noopener noreferrer" className="tcr-ico tcr-ico-sec">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 12.1c0-1-1-1.8-2.2-1.8-.6 0-1.2.2-1.6.6-1.5-.9-3.5-1.4-5.6-1.4-2 0-3.9.5-5.4 1.3-.4-.4-1-.6-1.7-.6C3.2 10.2 2 11 2 12c0 .6.4 1.1.9 1.4 0 .2-.1.4-.1.7 0 3 3.6 5.4 8.1 5.4s8.1-2.4 8.1-5.4c0-.2 0-.4-.1-.6.6-.3 1.1-.8 1.1-1.4Z"/></svg>
      </a>
      <a aria-label="Share on WhatsApp" href={links.wa} target="_blank" rel="noopener noreferrer" className="tcr-ico tcr-ico-sec">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20 3.5A10 10 0 0 0 3.9 17.2L3 21l3.9-1A10 10 0 1 0 20 3.5Z"/></svg>
      </a>
      <a aria-label="Share on Telegram" href={links.tg} target="_blank" rel="noopener noreferrer" className="tcr-ico tcr-ico-sec">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9.4 15.6l-.4 5.4 3.2-2.9 5.3 3.9L24 4 0 12.4l9.4 3.2L20 7.9"/></svg>
      </a>
      <button aria-label="Share" onClick={share} className="tcr-ico tcr-ico-pri">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18 8a3 3 0 1 0-2.8-4H12v4h3.2A3 3 0 0 0 18 8ZM8 10v4h8v-4H8Zm3 12v-4H7.9a3 3 0 1 0 0 4H11Z"/></svg>
      </button>
    </>
  );
}

