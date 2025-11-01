
import Parser from 'rss-parser';
import { NormalizedEvent } from '../normalize';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
  },
});

export async function fetchRollingStoneIndia(): Promise<NormalizedEvent[]> {
  try {
    const feed = await parser.parseURL('https://rollingstoneindia.com/?feed=gigpress');
    
    return feed.items.map((item: any, idx: number) => ({
      id: `rs-india-${item.guid || idx}`,
      title: item.title || 'Untitled Event',
      date: item.pubDate || new Date().toISOString(),
      time: undefined,
      venue: item['gigpress:venue'] || 'TBA',
      city: item['gigpress:city'] || 'India',
      price: item['gigpress:price'] || undefined,
      url: item.link || '',
      source: 'Rolling Stone India',
      image: item.enclosure?.url || undefined,
      description: item.contentSnippet || item.description,
      genreTags: [],
    }));
  } catch (error) {
    console.error('Rolling Stone India fetch error:', error);
    return [];
  }
}
