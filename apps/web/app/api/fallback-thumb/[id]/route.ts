
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { hashToIndex } from '@/src/lib/fallback-hash';
import { queueOptimization, getCachedFile } from '@thecueroom/fallback/worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIZE_PRESETS = {
  small: 300,
  medium: 600,
  large: 1200,
} as const;

const ENABLE_ROTATION = process.env.ENABLE_FALLBACK_ROTATION === 'true';

function getETag(id: string, width: number, format: string): string {
  return `"${id}-${width}-${format}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse width parameter
    const widthParam = searchParams.get('w') || 'medium';
    const width = SIZE_PRESETS[widthParam as keyof typeof SIZE_PRESETS] || parseInt(widthParam, 10) || 600;
    
    // Validate width
    if (width > 1200 || width < 100) {
      return NextResponse.json({ error: 'Invalid width' }, { status: 400 });
    }
    
    // Parse format with Accept header negotiation
    let format = searchParams.get('format') || 'webp';
    const acceptHeader = request.headers.get('accept') || '';
    
    if (format === 'webp' && !acceptHeader.includes('image/webp')) {
      format = 'png';
    }
    
    if (format !== 'webp' && format !== 'png') {
      format = 'webp';
    }
    
    // Determine which fallback to use
    let fallbackIndex: number;
    if (ENABLE_ROTATION) {
      // Random but seeded by id + hour epoch for cache-friendly rotation
      const hourEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
      fallbackIndex = hashToIndex(`${id}-${hourEpoch}`, 4);
    } else {
      // Deterministic selection
      fallbackIndex = hashToIndex(id, 4);
    }
    
    const fallbackNumber = fallbackIndex + 1;
    const sourcePath = path.join(process.cwd(), 'apps/web/public/fallbacks', `fallback_${fallbackNumber}.png`);
    
    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      return NextResponse.json({ error: 'Fallback source not found' }, { status: 404 });
    }
    
    // Build cache path
    const cacheDir = path.join(process.cwd(), 'apps/web/.cache/fallbacks');
    const cachePath = path.join(cacheDir, `${id}-${width}.${format}`);
    
    // Check ETag for 304 Not Modified
    const etag = getETag(id, width, format);
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304 });
    }
    
    // Check if cached file exists
    const isCached = await getCachedFile(cachePath);
    
    if (isCached) {
      // Stream cached file
      const stats = await fs.stat(cachePath);
      const stream = createReadStream(cachePath);
      
      return new NextResponse(stream as any, {
        headers: {
          'Content-Type': format === 'webp' ? 'image/webp' : 'image/png',
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': etag,
          'Vary': 'Accept',
        },
      });
    }
    
    // Generate optimized image
    const result = await queueOptimization({
      sourcePath,
      width,
      format: format as 'webp' | 'png',
      outPath: cachePath,
    });
    
    if (!result.success) {
      console.error('Fallback optimization failed:', result.error);
      return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
    }
    
    // Stream newly generated file
    const stats = await fs.stat(cachePath);
    const stream = createReadStream(cachePath);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': format === 'webp' ? 'image/webp' : 'image/png',
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
        'Vary': 'Accept',
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
