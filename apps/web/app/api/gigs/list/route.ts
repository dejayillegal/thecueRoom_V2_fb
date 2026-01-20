import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const FEEDS_CACHE = './.local/feeds/events_cache.json';
const CACHE_FILE = join(process.cwd(), '.local', 'feeds', 'india_gigs_cache.json');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const genre = searchParams.get('genre');
    const source = searchParams.get('source');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let events: any[] = [];
    
    // Check both cache locations and combine if necessary
    if (existsSync(FEEDS_CACHE)) {
      events = JSON.parse(readFileSync(FEEDS_CACHE, 'utf-8'));
    } else if (existsSync(CACHE_FILE)) {
      const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
      events = cache.events || [];
    }
    
    // Apply filters
    let filtered = events;
    
    if (location) {
      filtered = filtered.filter(e => 
        e.location?.toLowerCase().includes(location.toLowerCase()) ||
        e.region?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (city) {
      filtered = filtered.filter((e: any) => 
        e.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (genre) {
      filtered = filtered.filter((e: any) => 
        e.genre?.toLowerCase().includes(genre.toLowerCase()) ||
        e.genreTags?.some((tag: string) => tag.toLowerCase().includes(genre.toLowerCase()))
      );
    }
    
    if (source) {
      filtered = filtered.filter(e => e.source === source);
    }
    
    // Sort by date if field exists
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.date || 0).getTime();
      const dateB = new Date(b.publishedAt || b.date || 0).getTime();
      return dateB - dateA;
    });
    
    // Paginate
    const paginated = filtered.slice(offset, offset + limit);
    
    return NextResponse.json({
      events: paginated,
      total: filtered.length,
      offset,
      limit
    });
  } catch (error) {
    console.error('List gigs error:', error);
    return NextResponse.json(
      { error: 'Failed to list gigs', events: [] },
      { status: 500 }
    );
  }
}
