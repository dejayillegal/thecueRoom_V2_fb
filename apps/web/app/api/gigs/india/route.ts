import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { and, eq, gte, inArray, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface GigData {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  ticketUrl?: string;
  freeTicket: boolean;
  imageUrl?: string;
  description?: string;
}

function extractEventDetails(item: any): Partial<GigData> | null {
  const title = item.title || '';
  const content = item.content || item.description || '';
  const link = item.link || '';
  
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  const eventKeywords = [
    'festival', 'concert', 'gig', 'show', 'event', 'tour',
    'performing', 'live', 'appearing', 'headlining', 'lineup',
    'announce', 'announced', 'featuring', 'presents'
  ];
  
  const isLikelyEvent = eventKeywords.some(keyword => 
    lowerTitle.includes(keyword) || lowerContent.includes(keyword)
  );
  
  if (!isLikelyEvent) {
    return null;
  }
  
  const indiaKeywords = [
    'india', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 
    'goa', 'pune', 'hyderabad', 'chennai', 'kolkata'
  ];
  
  const isIndiaRelated = indiaKeywords.some(keyword =>
    lowerTitle.includes(keyword) || lowerContent.includes(keyword)
  );
  
  if (!isIndiaRelated) {
    return null;
  }
  
  let venue = 'TBA';
  let city = 'India';
  
  const cityMatch = title.match(/(Mumbai|Delhi|Bangalore|Bengaluru|Goa|Pune|Hyderabad|Chennai|Kolkata)/i);
  if (cityMatch) {
    city = cityMatch[1];
  } else {
    const contentCityMatch = content.match(/(Mumbai|Delhi|Bangalore|Bengaluru|Goa|Pune|Hyderabad|Chennai|Kolkata)/i);
    if (contentCityMatch) {
      city = contentCityMatch[1];
    }
  }
  
  const venuePatterns = [
    /at\s+([A-Z][a-z\s&]+)(?=,|\.|in|on)/,
    /venue:\s*([^,\n]+)/i,
    /location:\s*([^,\n]+)/i
  ];
  
  for (const pattern of venuePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      venue = match[1].trim();
      break;
    }
  }
  
  const freeKeywords = ['free entry', 'free admission', 'free event', 'no cover'];
  const freeTicket = freeKeywords.some(keyword => lowerContent.includes(keyword));
  
  const imageUrl = item.image || item.enclosure?.url || item.media?.thumbnail?.url || null;
  
  return {
    title,
    venue,
    city,
    ticketUrl: link,
    freeTicket,
    imageUrl: imageUrl || undefined,
    description: content.substring(0, 300)
  };
}

export async function GET() {
  try {
    const db = getDbClient();
    
    const eventSources = await db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.enabled, true),
          inArray(sources.name, [
            'Rolling Stone India',
            'Festival Sherpa',
            'EDM.com Festivals',
            'Dancing Astronaut',
            'EDM Identity'
          ])
        )
      );
    
    if (eventSources.length === 0) {
      return NextResponse.json({ gigs: [] });
    }
    
    const sourceIds = eventSources.map(s => s.id);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentItems = await db
      .select()
      .from(feeds)
      .where(
        and(
          inArray(feeds.sourceId, sourceIds),
          gte(feeds.publishedAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(feeds.publishedAt))
      .limit(100);
    
    const gigs: GigData[] = [];
    
    for (const item of recentItems) {
      const eventDetails = extractEventDetails(item);
      
      if (eventDetails) {
        gigs.push({
          id: item.id,
          title: eventDetails.title || item.title,
          venue: eventDetails.venue || 'TBA',
          city: eventDetails.city || 'India',
          date: item.publishedAt.toISOString(),
          ticketUrl: eventDetails.ticketUrl,
          freeTicket: eventDetails.freeTicket || false,
          imageUrl: eventDetails.imageUrl,
          description: eventDetails.description
        });
      }
    }
    
    gigs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json({ 
      gigs: gigs.slice(0, 24),
      total: gigs.length 
    });
  } catch (error) {
    console.error('Gigs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gigs', gigs: [] },
      { status: 500 }
    );
  }
}
