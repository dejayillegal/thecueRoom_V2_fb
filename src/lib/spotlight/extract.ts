
export function normalizeDate(d?:string) {
  if (!d) return new Date(0).toISOString();
  const t = Date.parse(d); return isNaN(t) ? new Date(0).toISOString() : new Date(t).toISOString();
}

export function formatShortDate(d: string | null | undefined): string {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
        return '';
    }
}

export function pickImage(item:any, base:string) {
  const enc = item.enclosure?.url; if (enc) return absolutize(enc, base);
  const media = item.media?.content?.url || item["media:content"]?.url; if (media) return absolutize(media, base);
  const html = item["content:encoded"] || item.content || "";
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html); if (m?.[1]) return absolutize(m[1], base);
  const itunes = item.itunes?.image; if (itunes) return absolutize(itunes, base);
  return "";
}
function absolutize(u:string, base:string) { try { return new URL(u, base).toString(); } catch { return u; } }
