import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const GIG_SOURCES = [
  { name: "Rolling Stone India", url: "https://rollingstoneindia.com/feed/", category: "Live/Festivals" },
  { name: "Wild City", url: "https://www.thewildcity.com/rss", category: "Underground" },
  { name: "Homegrown", url: "https://homegrown.co.in/feed", category: "Scene" }
];

export async function GET() {
  const parser = new Parser();
  const gigs: any[] = [];

  try {
    const feedPromises = GIG_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.map(item => ({
          id: item.guid || item.link || Math.random().toString(),
          title: item.title,
          venue: "India",
          city: "Various Cities",
          date: item.isoDate || new Date().toISOString(),
          ticketUrl: item.link,
          sourceName: source.name,
          category: source.category,
          imageUrl: item.enclosure?.url || (item as any)['media:content']?.['$']?.url || '/fallbacks/fallback_2.png',
          description: item.contentSnippet?.slice(0, 150) + '...',
          freeTicket: item.title?.toLowerCase().includes('free') || false
        }));
      } catch (e) {
        console.error(`Failed to fetch from ${source.name}:`, e);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    gigs.push(...results.flat());

    return NextResponse.json({ gigs: gigs.slice(0, 50) });
  } catch (error) {
    console.error('Gigs aggregation error:', error);
    return NextResponse.json({ gigs: [] });
  }
}
