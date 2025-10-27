import Parser from "rss-parser";
import pLimit from "p-limit";
import { SPOTLIGHT_SOURCES, Source } from "./spotlight.sources";
import { pickImage, normalizeDate } from "./extract";
import { ensureThumbnail } from "./thumbnail";
import { classifyTags } from "./tagger";
import { scrapeList } from "@/lib/ingest/scrape";
import { isRelevant } from "./filter";

const parser = new Parser({ timeout: 10000, headers: { "User-Agent":"thecueRoom/1.0" }});
const limitC = pLimit(6);

export type SpotlightItem = {
  title:string; url:string; summary:string; image:string;
  publishedAt:string; source:string; tags:string[];
};

async function withOverallTimeout<T>(p: Promise<T>, ms = 12000, fallback: T): Promise<T> {
  const timer = new Promise<T>((resolve)=> setTimeout(()=> resolve(fallback), ms));
  return Promise.race([p, timer]);
}

export async function getSpotlight(limit = 80, offset = 0): Promise<SpotlightItem[]> {
  const batches = await Promise.allSettled(
    SPOTLIGHT_SOURCES.map((src:Source) => limitC(async () => {
      if (src.kind === "rss") {
        const feed = await parser.parseURL(src.url);
        const base = new URL(feed.link || src.url).origin + "/";
        return (feed.items||[]).slice(0, src.maxItems ?? 20).map(i=>{
          const title = i.title ?? "";
          const url = i.link ?? "";
          const summary = (i.contentSnippet ?? i.summary ?? "").trim();
          const img = pickImage(i, base);
          const publishedAt = normalizeDate(i.isoDate ?? i.pubDate);
          return { title, url, summary, image: img, publishedAt,
                   source: new URL(base).hostname.replace(/^www\./,""),
                   tags: src.tags.slice() };
        });
      } else {
        const rows = await scrapeList(src);
        return rows.slice(0, src.maxItems ?? 20).map(i=>({
          title: i.title,
          url: i.url,
          summary: i.summary || "",
          image: i.image || "",
          publishedAt: normalizeDate(i.publishedAt),
          source: new URL(src.url).hostname.replace(/^www\./,""),
          tags: src.tags.slice()
        }));
      }
    }))
  );

  const items = batches.flatMap(r => r.status==="fulfilled" ? r.value : []);
  const dedup = new Map<string, SpotlightItem>();
  for (const x of items) {
    const key = (x.title + "|" + x.source).toLowerCase();
    if (!dedup.has(key) && isRelevant(x.title, x.summary, x.source)) dedup.set(key, x as SpotlightItem);
  }
  const list = Array.from(dedup.values()).sort((a,b)=> +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const page = list.slice(offset, offset + limit);

  const final = await Promise.all(page.map(async x => {
    const image = x.image || await ensureThumbnail({ url:x.url, title:x.title, summary:x.summary, tags:x.tags });
    const extra = classifyTags(x.title, x.summary, x.source);
    return { ...x, image, tags: Array.from(new Set([...(x.tags||[]), ...extra])) };
  }));

  return final;
}
