#!/usr/bin/env node

import { promises as fs } from 'fs';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import pLimit from 'p-limit';
import archiver from 'archiver';

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';
const EPK_WORKER_CONCURRENCY = parseInt(process.env.EPK_WORKER_CONCURRENCY || '1', 10);
const TEST_MODE = process.env.EPK_TEST_MODE === 'true' || process.env.TEST_MODE === 'true';
const PDF_TOOL = process.env.EPK_PDF_TOOL || 'puppeteer';

const limit = pLimit(EPK_WORKER_CONCURRENCY);

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function readJobMeta(jobId) {
  const metaPath = path.join(EPK_TEMP_DIR, `${jobId}.json`);
  try {
    const data = await fs.readFile(metaPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeJobMeta(jobId, meta) {
  await ensureDir(EPK_TEMP_DIR);
  const metaPath = path.join(EPK_TEMP_DIR, `${jobId}.json`);
  const tempPath = metaPath + '.tmp';
  await fs.writeFile(tempPath, JSON.stringify(meta, null, 2), 'utf8');
  await fs.rename(tempPath, metaPath);
}

async function generatePdf(job) {
  const { jobId, templateId, modules, artistName, releaseTitle, includeWatermark } = job;
  
  console.log(`[EPK Worker] Generating PDF for job ${jobId}`);
  
  await writeJobMeta(jobId, {
    ...job,
    status: 'processing',
    progress: 20,
    updatedAt: Date.now()
  });

  const jobDir = path.join(EPK_TEMP_DIR, jobId);
  await ensureDir(jobDir);

  if (TEST_MODE) {
    const testPdfPath = path.join(jobDir, 'epk.pdf');
    await fs.writeFile(testPdfPath, Buffer.from('%PDF-1.4\nTest PDF content\n%%EOF'));
    
    await writeJobMeta(jobId, {
      ...job,
      status: 'done',
      progress: 100,
      resultUrl: `/api/epk/download/${jobId}/epk.pdf`,
      updatedAt: Date.now()
    });
    
    console.log(`[EPK Worker] PDF generated (TEST_MODE) for ${jobId}`);
    return;
  }

  try {
    let pdfBuffer;

    if (PDF_TOOL === 'puppeteer') {
      const { default: puppeteer } = await import('puppeteer-core');
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      const html = generateTemplateHTML(templateId, modules, artistName, releaseTitle, includeWatermark);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      await writeJobMeta(jobId, {
        ...job,
        status: 'processing',
        progress: 60,
        updatedAt: Date.now()
      });

      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      await browser.close();
    } else {
      pdfBuffer = Buffer.from('%PDF-1.4\nFallback PDF\n%%EOF');
    }

    const pdfPath = path.join(jobDir, 'epk.pdf');
    await fs.writeFile(pdfPath, pdfBuffer);

    await writeJobMeta(jobId, {
      ...job,
      status: 'done',
      progress: 100,
      resultUrl: `/api/epk/download/${jobId}/epk.pdf`,
      updatedAt: Date.now()
    });

    console.log(`[EPK Worker] PDF generated for ${jobId}`);
  } catch (error) {
    console.error(`[EPK Worker] Error generating PDF for ${jobId}:`, error);
    await writeJobMeta(jobId, {
      ...job,
      status: 'error',
      error: error.message,
      updatedAt: Date.now()
    });
  }
}

async function generateZipAssets(job) {
  const { jobId, templateId, modules, artistName, releaseTitle } = job;
  
  console.log(`[EPK Worker] Generating ZIP for job ${jobId}`);
  
  const jobDir = path.join(EPK_TEMP_DIR, jobId);
  await ensureDir(jobDir);
  
  const zipPath = path.join(jobDir, 'epk.zip');
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    output.on('close', async () => {
      await writeJobMeta(jobId, {
        ...job,
        status: 'done',
        progress: 100,
        resultUrl: `/api/epk/download/${jobId}/epk.zip`,
        updatedAt: Date.now()
      });
      console.log(`[EPK Worker] ZIP generated for ${jobId}`);
      resolve();
    });

    archive.on('error', async (err) => {
      await writeJobMeta(jobId, {
        ...job,
        status: 'error',
        error: err.message,
        updatedAt: Date.now()
      });
      reject(err);
    });

    archive.pipe(output);

    const metadata = {
      jobId,
      templateId,
      artistName,
      releaseTitle,
      generatedAt: new Date().toISOString()
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    archive.finalize();
  });
}

function generateTemplateHTML(templateId, modules, artistName, releaseTitle, includeWatermark) {
  const style = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: #0B0B0B; color: #fff; padding: 40px; }
      .header { margin-bottom: 40px; }
      .header h1 { font-size: 48px; font-weight: 700; color: #D7FF3C; }
      .header h2 { font-size: 24px; font-weight: 400; color: #9B5CFF; margin-top: 8px; }
      .module { margin-bottom: 32px; page-break-inside: avoid; }
      .module h3 { font-size: 20px; font-weight: 600; color: #D7FF3C; margin-bottom: 16px; text-transform: uppercase; }
      .bio-text { font-size: 14px; line-height: 1.6; }
      .tracklist-item { margin-bottom: 12px; padding: 12px; background: #1a1a1a; border-radius: 8px; }
      .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      .gallery-item { background: #1a1a1a; padding: 8px; border-radius: 8px; }
      .tech-rider-item { display: inline-block; margin: 8px; padding: 12px 20px; background: #9B5CFF; border-radius: 20px; font-weight: 600; }
      .watermark { position: fixed; bottom: 20px; right: 20px; opacity: 0.3; font-size: 12px; color: #666; }
      @media print { body { background: white; color: black; } }
    </style>
  `;

  let modulesHTML = '';
  modules.forEach(module => {
    switch (module.type) {
      case 'bio':
        modulesHTML += `
          <div class="module">
            <h3>Biography</h3>
            <div class="bio-text">${module.data.text || ''}</div>
          </div>
        `;
        break;
      case 'tracklist':
        modulesHTML += `
          <div class="module">
            <h3>Tracklist</h3>
            ${(module.data.tracks || []).map(track => `
              <div class="tracklist-item">${track.title || 'Untitled'}</div>
            `).join('')}
          </div>
        `;
        break;
      case 'techRider':
        modulesHTML += `
          <div class="module">
            <h3>Tech Rider</h3>
            ${(module.data.items || []).map(item => `
              <span class="tech-rider-item">${item.label}</span>
            `).join('')}
          </div>
        `;
        break;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${artistName || 'EPK'}</title>
      ${style}
    </head>
    <body>
      <div class="header">
        <h1>${artistName || 'Artist Name'}</h1>
        ${releaseTitle ? `<h2>${releaseTitle}</h2>` : ''}
      </div>
      ${modulesHTML}
      ${includeWatermark ? '<div class="watermark">Generated by thecueRoom</div>' : ''}
    </body>
    </html>
  `;
}

async function processJob(job) {
  const { jobId, exportFormat } = job;
  
  try {
    if (exportFormat === 'pdf') {
      await generatePdf(job);
    } else if (exportFormat === 'zip') {
      await generateZipAssets(job);
    } else if (exportFormat === 'png') {
      await generatePdf(job);
    }
  } catch (error) {
    console.error(`[EPK Worker] Job ${jobId} failed:`, error);
    await writeJobMeta(jobId, {
      ...job,
      status: 'error',
      error: error.message,
      updatedAt: Date.now()
    });
  }
}

async function scanAndProcessJobs() {
  await ensureDir(EPK_TEMP_DIR);
  
  const files = await fs.readdir(EPK_TEMP_DIR);
  const jobFiles = files.filter(f => f.endsWith('.json'));
  
  for (const file of jobFiles) {
    const jobId = file.replace('.json', '');
    const job = await readJobMeta(jobId);
    
    if (job && job.status === 'queued') {
      await limit(() => processJob(job));
    }
  }
}

console.log('[EPK Worker] Starting...');
console.log(`[EPK Worker] Concurrency: ${EPK_WORKER_CONCURRENCY}`);
console.log(`[EPK Worker] Test Mode: ${TEST_MODE}`);
console.log(`[EPK Worker] PDF Tool: ${PDF_TOOL}`);

setInterval(scanAndProcessJobs, 5000);
scanAndProcessJobs();

export { processJob, writeJobMeta, readJobMeta };
