const fs = require('fs');
const path = require('path');
const { parentPort } = require('worker_threads');

const CONCURRENCY = parseInt(process.env.AI_WORKER_CONCURRENCY || '1', 10);
const TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';
const TEST_MODE = process.env.TEST_MODE === 'true';
const QUEUE_FILE = path.join(process.cwd(), '.local', 'ai-queue.json');

// Ensure directories exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const queueDir = path.dirname(QUEUE_FILE);
if (!fs.existsSync(queueDir)) {
  fs.mkdirSync(queueDir, { recursive: true });
}

// Initialize queue file
if (!fs.existsSync(QUEUE_FILE)) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify({ jobs: [] }, null, 2));
}

let activeJobs = 0;

/**
 * Read queue from disk
 */
function readQueue() {
  try {
    const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { jobs: [] };
  }
}

/**
 * Write queue to disk
 */
function writeQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/**
 * Write job status
 */
function writeStatus(jobId, status) {
  const statusPath = path.join(TEMP_DIR, `${jobId}.status.json`);
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

/**
 * Process a single job
 */
async function processJob(job) {
  const { id, type, payload } = job;

  writeStatus(id, {
    jobId: id,
    status: 'processing',
    progress: 0,
    startedAt: new Date().toISOString(),
  });

  try {
    switch (type) {
      case 'hfGenerateImage':
        await processHFGenerate(id, payload);
        break;
      case 'fallbackSvgRasterize':
        await processSvgRasterize(id, payload);
        break;
      case 'composeTextWatermark':
        await processCompose(id, payload);
        break;
      case 'verifyArtist':
        await processVerifyArtist(id, payload);
        break;
      case 'thumbnailProcess':
        await processThumbnail(id, payload);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    writeStatus(id, {
      jobId: id,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      resultUrl: `/api/ai/result/${id}`,
    });
  } catch (error) {
    writeStatus(id, {
      jobId: id,
      status: 'failed',
      error: error.message,
      completedAt: new Date().toISOString(),
    });
  }
}

/**
 * HF Image Generation
 */
async function processHFGenerate(jobId, payload) {
  if (TEST_MODE || !process.env.HF_TOKEN) {
    // Fallback to SVG rasterize in test mode
    return processSvgRasterize(jobId, payload);
  }

  // Real HF implementation would go here
  throw new Error('HF integration not implemented');
}

/**
 * SVG Rasterization
 */
async function processSvgRasterize(jobId, payload) {
  // Generate SVG using fallback generator
  const { generateSVG } = require('./impl/fallback-svg');

  const svg = generateSVG({
    preset: payload.preset || 'Neon Accent',
    seed: payload.seed || Math.random(),
    artist: payload.artistName || '',
    release: payload.releaseTitle || '',
  });

  // In TEST_MODE, just save the SVG
  if (TEST_MODE) {
    const outputPath = path.join(TEMP_DIR, `${jobId}.svg`);
    fs.writeFileSync(outputPath, svg);

    // Create a dummy PNG marker
    const pngPath = path.join(TEMP_DIR, `${jobId}.png`);
    fs.writeFileSync(pngPath, 'TEST_MODE_PNG_PLACEHOLDER');
    return;
  }

  // Try to use sharp for real rasterization
  try {
    const sharp = require('sharp');
    const buffer = Buffer.from(svg);
    const pngPath = path.join(TEMP_DIR, `${jobId}.png`);

    await sharp(buffer)
      .resize(1024, 1024)
      .png()
      .toFile(pngPath);
  } catch (err) {
    // Sharp not available, save SVG only
    const outputPath = path.join(TEMP_DIR, `${jobId}.svg`);
    fs.writeFileSync(outputPath, svg);
  }
}

/**
 * Compose text + watermark
 */
async function processCompose(jobId, payload) {
  // For now, just copy the base image
  const basePath = path.join(TEMP_DIR, `${payload.baseJobId}.png`);
  const outputPath = path.join(TEMP_DIR, `${jobId}.png`);

  if (fs.existsSync(basePath)) {
    fs.copyFileSync(basePath, outputPath);
  } else {
    throw new Error('Base image not found');
  }
}

/**
 * Verify artist
 */
async function processVerifyArtist(jobId, payload) {
  if (TEST_MODE) {
    // Simulate verification
    await new Promise((r) => setTimeout(r, 2000));

    writeStatus(jobId, {
      jobId,
      status: 'completed',
      result: {
        verified: true,
        confidence: 0.95,
        reason: 'TEST_MODE auto-verify',
      },
      completedAt: new Date().toISOString(),
    });
    return;
  }

  // Real verification would fetch social profile here
  throw new Error('Real verification not implemented');
}

/**
 * Process thumbnail
 */
async function processThumbnail(jobId, payload) {
  // Placeholder
  const outputPath = path.join(TEMP_DIR, `${jobId}_thumb.png`);
  fs.writeFileSync(outputPath, 'THUMBNAIL_PLACEHOLDER');
}

/**
 * Main worker loop
 */
async function mainLoop() {
  while (true) {
    if (activeJobs >= CONCURRENCY) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const queue = readQueue();
    const pending = queue.jobs.filter((j) => j.status === 'queued');

    if (pending.length === 0) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    const job = pending[0];

    // Mark as processing
    job.status = 'processing';
    writeQueue(queue);

    activeJobs++;

    processJob(job)
      .finally(() => {
        activeJobs--;

        // Remove from queue
        const updatedQueue = readQueue();
        updatedQueue.jobs = updatedQueue.jobs.filter((j) => j.id !== job.id);
        writeQueue(updatedQueue);
      });
  }
}

// Start worker
console.log('[AI Worker] Starting...');
console.log(`[AI Worker] Concurrency: ${CONCURRENCY}`);
console.log(`[AI Worker] Test Mode: ${TEST_MODE}`);
console.log(`[AI Worker] Temp Dir: ${TEMP_DIR}`);

mainLoop().catch(console.error);