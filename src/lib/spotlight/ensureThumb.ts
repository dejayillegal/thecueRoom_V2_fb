export async function ensureThumbnail(input: { url:string; title:string; summary?:string; tags?:string[] }) {
  try {
    const res = await fetch(input.url, { headers: { "User-Agent":"thecueRoom/1.0 (+thumb)" }, cache:"no-store", signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const html = await res.text();
      const og = /property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html)?.[1]
               || /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i.exec(html)?.[1];
      if (og) return og;
    }
  } catch {}
  const title = encodeURIComponent(input.title.slice(0,120));
  return `/api/og-fallback?title=${title}`;
}
