import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; filename: string } }
) {
  try {
    const { jobId, filename } = params;
    
    if (!filename.match(/^[a-zA-Z0-9._-]+$/)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid filename'
      }, { status: 400 });
    }

    const filePath = path.join(EPK_TEMP_DIR, jobId, filename);
    
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({
        ok: false,
        error: 'File not found'
      }, { status: 404 });
    }

    const stream = createReadStream(filePath);
    const contentType = filename.endsWith('.pdf') ? 'application/pdf' :
                       filename.endsWith('.zip') ? 'application/zip' :
                       filename.endsWith('.png') ? 'image/png' : 'application/octet-stream';

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('[EPK API] Download error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
