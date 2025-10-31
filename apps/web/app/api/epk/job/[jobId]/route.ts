import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
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
      const jobMeta = JSON.parse(data);
      
      return NextResponse.json({
        jobId: jobMeta.jobId,
        status: jobMeta.status,
        progress: jobMeta.progress,
        resultUrl: jobMeta.resultUrl,
        error: jobMeta.error,
        createdAt: jobMeta.createdAt,
        updatedAt: jobMeta.updatedAt,
      });
    } catch (error) {
      return NextResponse.json({
        status: 'not_found',
        error: 'Job not found'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('[EPK Job API] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
