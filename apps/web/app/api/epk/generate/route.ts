import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';

const EPKModuleSchema = z.object({
  id: z.string(),
  type: z.enum(['bio', 'tracklist', 'gallery', 'techRider', 'links', 'quotes']),
  order: z.number(),
  data: z.any()
});

const GenerateRequestSchema = z.object({
  templateId: z.string(),
  modules: z.array(EPKModuleSchema),
  artistName: z.string().optional(),
  releaseTitle: z.string().optional(),
  resolution: z.number().optional(),
  includeWatermark: z.boolean().optional(),
  exportFormat: z.enum(['pdf', 'zip', 'png'])
});

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateRequestSchema.parse(body);

    const jobId = nanoid();
    
    await ensureDir(EPK_TEMP_DIR);

    const jobMeta = {
      jobId,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...validated
    };

    const metaPath = path.join(EPK_TEMP_DIR, `${jobId}.json`);
    await fs.writeFile(metaPath, JSON.stringify(jobMeta, null, 2), 'utf8');

    console.log(`[EPK API] Job ${jobId} queued for ${validated.exportFormat} export`);

    return NextResponse.json({
      ok: true,
      jobId,
      status: 'queued'
    });
  } catch (error) {
    console.error('[EPK API] Generate error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
