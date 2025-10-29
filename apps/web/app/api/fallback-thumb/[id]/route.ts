
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { hashToIndex } from '@/src/lib/fallback-hash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENABLE_ROTATION = process.env.ENABLE_FALLBACK_ROTATION === 'true';

function getETag(id: string, fallbackNumber: number): string {
  return `"fallback-${fallbackNumber}-${id}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

    // Determine which fallback to use (1-3 only, not 4)
    let fallbackIndex: number;
    if (ENABLE_ROTATION) {
      // Random but seeded by id + hour epoch for cache-friendly rotation
      const hourEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
      fallbackIndex = hashToIndex(`${id}-${hourEpoch}`, 3);
    } else {
      // Deterministic selection
      fallbackIndex = hashToIndex(id, 3);
    }

    const fallbackNumber = fallbackIndex + 1;
    const imagePath = path.join(process.cwd(), 'apps/web/public/fallbacks', `fallback_${fallbackNumber}.png`);

    // Check if image exists
    try {
      await fs.access(imagePath);
    } catch {
      return NextResponse.json({ error: 'Fallback image not found' }, { status: 404 });
    }

    // Check ETag for 304 Not Modified
    const etag = getETag(id, fallbackNumber);
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Stream the file directly - no sharp processing needed
    const stats = await fs.stat(imagePath);
    const stream = createReadStream(imagePath);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
      },
    });
  } catch (error) {
    console.error('Fallback thumbnail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
