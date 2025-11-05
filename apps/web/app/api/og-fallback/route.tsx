import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const generatedCache = new Map<string, { data: ArrayBuffer; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour
const MAX_CACHE_SIZE = 200;

/**
 * Sanitize text for use in ImageResponse to avoid ByteString conversion errors
 * Replaces common Unicode characters with ASCII equivalents
 */
function sanitizeForImageResponse(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Replace curly single quotes with straight quote
    .replace(/[\u201C\u201D]/g, '"')  // Replace curly double quotes with straight quote
    .replace(/[\u2013\u2014]/g, '-')  // Replace en-dash and em-dash with hyphen
    .replace(/[\u2026]/g, '...')      // Replace ellipsis with three dots
    .replace(/[^\x00-\x7F]/g, '');    // Remove any remaining non-ASCII characters
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTitle = searchParams.get('title') || 'thecueRoom';
    const title = sanitizeForImageResponse(rawTitle);
    const cacheKey = title.slice(0, 120);

    // Check cache
    const cached = generatedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new Response(cached.data, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, immutable',
        },
      });
    }

    const truncatedTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            position: 'relative',
          }}
        >
          {/* Gradient overlays matching theme */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(215, 255, 60, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(155, 92, 255, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              maxWidth: '90%',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: '#e5e5e5',
                textAlign: 'center',
                lineHeight: 1.4,
                fontWeight: 600,
                padding: '0 40px',
              }}
            >
              {truncatedTitle}
            </div>
          </div>

          {/* Decorative line accents */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #D7FF3C 0%, #9B5CFF 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Convert to buffer and cache
    const buffer = await imageResponse.arrayBuffer();
    generatedCache.set(cacheKey, { data: buffer, timestamp: Date.now() });

    // Clean old cache entries (keep only last 200 most recent)
    if (generatedCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(generatedCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      generatedCache.clear();
      entries.slice(0, MAX_CACHE_SIZE).forEach(([key, value]) => generatedCache.set(key, value));
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}