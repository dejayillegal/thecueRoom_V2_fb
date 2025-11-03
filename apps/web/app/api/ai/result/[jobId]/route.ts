import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Check for PNG result
    const pngPath = path.join(TEMP_DIR, `${jobId}.png`);
    const svgPath = path.join(TEMP_DIR, `${jobId}.svg`);
    
    let filePath: string;
    let contentType: string;

    try {
      await fs.access(pngPath);
      filePath = pngPath;
      contentType = 'image/png';
    } catch {
      try {
        await fs.access(svgPath);
        filePath = svgPath;
        contentType = 'image/svg+xml';
      } catch {
        return NextResponse.json(
          { error: 'Result not found or not yet ready' },
          { status: 404 }
        );
      }
    }

    // Read and stream the file
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${jobId}.${contentType.includes('svg') ? 'svg' : 'png'}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving AI result:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve result', details: error.message },
      { status: 500 }
    );
  }
}
