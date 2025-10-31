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
      const metaData = await fs.readFile(metaPath, 'utf-8');
      const job = JSON.parse(metaData);

      // Calculate progress if not set
      let progress = job.progress || 0;
      if (job.status === 'queued') {
        progress = 10;
      } else if (job.status === 'processing' && !job.progress) {
        progress = 50;
      } else if (job.status === 'done') {
        progress = 100;
      }

      console.log(`[EPK Job Status] ${jobId} - Status: ${job.status}, Progress: ${progress}%`);

      return NextResponse.json({
        ok: true,
        job: {
          jobId: job.jobId,
          status: job.status,
          progress: progress,
          resultUrl: job.resultUrl,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      });
    } catch (err) {
      console.error('[EPK Job Status] Job not found:', jobId);
      return NextResponse.json({
        ok: false,
        error: 'Job not found'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('[EPK Job Status] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}