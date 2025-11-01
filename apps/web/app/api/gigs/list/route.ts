
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const FEEDS_CACHE = './.local/feeds/events_cache.json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const genre = searchParams.get('genre');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let events: any[] = [];
    
    if (existsSync(FEEDS_CACHE)) {
      events = JSON.parse(readFileSync(FEEDS_CACHE, 'utf-8'));
    }
    
    // Apply filters
    let filtered = events;
    
    if (location) {
      filtered = filtered.filter(e => 
        e.location?.toLowerCase().includes(location.toLowerCase()) ||
        e.region?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (genre) {
      filtered = filtered.filter(e => 
        e.genre?.toLowerCase().includes(genre.toLowerCase())
      );
    }
    
    if (source) {
      filtered = filtered.filter(e => e.source === source);
    }
    
    // Sort by date
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
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
      { error: 'Failed to list gigs' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CACHE_FILE = join(process.cwd(), '.local', 'feeds', 'india_gigs_cache.json');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!existsSync(CACHE_FILE)) {
      return NextResponse.json({ events: [], total: 0 });
    }
    
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    let events = cache.events || [];
    
    // Apply filters
    if (genre) {
      events = events.filter((e: any) => 
        e.genreTags?.some((tag: string) => tag.toLowerCase().includes(genre.toLowerCase()))
      );
    }
    
    if (city) {
      events = events.filter((e: any) => 
        e.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // Paginate
    const paginated = events.slice(offset, offset + limit);
    
    return NextResponse.json({
      events: paginated,
      total: events.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Gigs list error:', error);
    return NextResponse.json({ error: 'Failed to list gigs', events: [] }, { status: 500 });
  }
}
