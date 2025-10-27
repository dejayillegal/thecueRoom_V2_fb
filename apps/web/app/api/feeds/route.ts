
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const CACHE_TTL = 60;
const ITEMS_PER_PAGE = 24;

function sanitizeImageUrl(url: string | null, title: string): string {
  if (!url || url.trim() === '') {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }

  const trimmedUrl = url.trim();

  // Filter out video embeds
  if (trimmedUrl.includes('youtube.com/embed') || trimmedUrl.includes('youtu.be') || trimmedUrl.includes('vimeo.com')) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }

  // Validate URL format
  try {
    const urlObj = new URL(trimmedUrl);
    
    // Check for data URIs
    if (urlObj.protocol === 'data:') {
      return trimmedUrl;
    }

    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
    }

    // Check for common image hosting domains (always valid)
    const trustedDomains = [
      'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com',
      'images.ctfassets.net', 'cdn.sanity.io', 'cloudinary.com',
      'imgur.com', 'i.imgur.com',
      'preview.redd.it', 'i.redd.it', 'external-preview.redd.it'
    ];
    
    if (trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return trimmedUrl;
    }

    // Validate image file extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;
    const pathname = urlObj.pathname.toLowerCase();
    
    if (imageExtensions.test(pathname)) {
      return trimmedUrl;
    }

    // Check if URL path suggests it's an image endpoint
    if (pathname.includes('/image') || pathname.includes('/img') || pathname.includes('/photo') || pathname.includes('/media')) {
      return trimmedUrl;
    }

    // If all else fails, return fallback
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  } catch (e) {
    // Invalid URL format
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10));
    const cursor = searchParams.get('cursor');
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDbClient();

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions = [
      gt(feeds.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${sources.tags} @> ARRAY[${category}]::text[]`);
    }

    if (cursor) {
      const [timestamp, id] = cursor.split('_');
      conditions.push(
        sql`(${feeds.publishedAt}, ${feeds.id}) < (${timestamp}, ${id})`
      );
    }

    const query = db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        source: {
          id: sources.id,
          name: sources.name,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit + 1)
      .offset(offset);

    const results = await query;

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    const sanitizedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.link,
      image: sanitizeImageUrl(item.image, item.title),
      tags: item.tags || [],
      publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : item.publishedAt?.toISOString(),
      source: item.source?.name || 'Unknown',
    }));

    const nextCursor = hasMore && sanitizedItems.length > 0
      ? `${sanitizedItems[sanitizedItems.length - 1].publishedAt}_${sanitizedItems[sanitizedItems.length - 1].id}`
      : null;

    return NextResponse.json({
      data: sanitizedItems,
      nextCursor,
      hasMore,
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], nextCursor: null, hasMore: false },
      { status: 500 }
    );
  }
}
