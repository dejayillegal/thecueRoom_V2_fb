import * as cheerio from "cheerio";

export async function scrapeList(cfg: {
  url:string; list:string; title:string; link:string; image?:string; summary?:string; date?:string;
}) {
  const res = await fetch(cfg.url, {
    headers: { "User-Agent":"thecueRoom/1.0 (+link-out-only)" },
    signal: AbortSignal.timeout(8000)
  }).catch(()=>null);
  if (!res || !res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);
  const rows:any[] = [];
  $(cfg.list).each((_, el) => {
    const t = $(el).find(cfg.title).first();
    const a = $(el).find(cfg.link).first();
    const i = cfg.image ? $(el).find(cfg.image).first() : null;
    const s = cfg.summary ? $(el).find(cfg.summary).first() : null;
    const d = cfg.date ? $(el).find(cfg.date).first() : null;
    const title = (t.text() || a.text() || "").trim();
    const href = a.attr("href") || "";
    const url = href.startsWith("http") ? href : new URL(href, cfg.url).toString();
    const image = i ? (i.attr("data-src") || i.attr("src") || "") : "";
    const summary = s ? s.text().trim() : "";
    const publishedAt = d?.attr("datetime") || d?.text() || "";
    if (title && url) rows.push({ title, url, summary, image, publishedAt });
  });
  return rows;
}