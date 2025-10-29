
import pLimit from 'p-limit';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const CONCURRENCY = parseInt(process.env.FALLBACK_WORKER_CONCURRENCY || '2', 10);
const limiter = pLimit(CONCURRENCY);

export interface OptimizeJob {
  sourcePath: string;
  width: number;
  format: 'webp' | 'png';
  outPath: string;
}

export interface OptimizeResult {
  success: boolean;
  path: string;
  size?: number;
  error?: string;
}

/**
 * Optimize and resize an image using sharp
 */
async function optimizeImage(job: OptimizeJob): Promise<OptimizeResult> {
  try {
    // Ensure output directory exists
    const dir = path.dirname(job.outPath);
    await fs.mkdir(dir, { recursive: true });

    // Use sharp to resize and convert
    const pipeline = sharp(job.sourcePath)
      .resize(job.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });

    if (job.format === 'webp') {
      pipeline.webp({ quality: 80, effort: 4 });
    } else {
      pipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
    }

    await pipeline.toFile(job.outPath);

    const stats = await fs.stat(job.outPath);
    
    return {
      success: true,
      path: job.outPath,
      size: stats.size,
    };
  } catch (error) {
    return {
      success: false,
      path: job.outPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Queue an optimization job with concurrency limiting
 */
export async function queueOptimization(job: OptimizeJob): Promise<OptimizeResult> {
  return limiter(() => optimizeImage(job));
}

/**
 * Check if a cached file exists and is valid
 */
export async function getCachedFile(cachePath: string): Promise<boolean> {
  try {
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
}
