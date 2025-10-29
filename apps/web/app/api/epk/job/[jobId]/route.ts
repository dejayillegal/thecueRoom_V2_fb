import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const metaPath = path.join(EPK_TEMP_DIR, `${jobId}.json`);

    try {
      const data = await fs.readFile(metaPath, 'utf8');
      const job = JSON.parse(data);

      return NextResponse.json({
        ok: true,
        job
      });
    } catch (err) {
      return NextResponse.json({
        ok: false,
        error: 'Job not found'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('[EPK API] Job status error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
