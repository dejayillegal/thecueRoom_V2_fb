#!/usr/bin/env node

const { promises: fs } = require('fs');
const path = require('path');

process.env.EPK_TEST_MODE = 'true';
process.env.TEST_MODE = 'true';

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

async function runMemoryTest() {
  console.log('🧪 EPK Memory Leak Diagnostic Test');
  console.log('===================================\n');

  const initialMemory = process.memoryUsage();
  console.log(`📊 Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB\n`);

  const testJobs = [
    {
      jobId: `test-job-${Date.now()}-1`,
      templateId: 'one-column',
      modules: [
        {
          type: 'bio',
          data: { text: 'Test artist with a great bio. Performs amazing shows worldwide.' }
        }
      ],
      artistName: 'Test Artist 1',
      releaseTitle: 'Test EPK 1',
      includeWatermark: false
    },
    {
      jobId: `test-job-${Date.now()}-2`,
      templateId: 'two-column',
      modules: [
        {
          type: 'bio',
          data: { text: 'Another test artist with different content.' }
        }
      ],
      artistName: 'Test Artist 2',
      releaseTitle: 'Test EPK 2',
      includeWatermark: false
    },
    {
      jobId: `test-job-${Date.now()}-3`,
      templateId: 'minimal',
      modules: [
        {
          type: 'bio',
          data: { text: 'Third test artist for concurrent processing.' }
        }
      ],
      artistName: 'Test Artist 3',
      releaseTitle: 'Test EPK 3',
      includeWatermark: false
    }
  ];

  console.log(`🚀 Launching ${testJobs.length} concurrent EPK render jobs...
`);

  const workerPath = path.join(__dirname, '../../packages/epk/worker.mjs');

  try {
    const { generatePdf: generatePdfFn } = await import(workerPath);

    const startTime = Date.now();

    await Promise.all(testJobs.map(job => {
      console.log(`   ⏳ Job ${job.jobId} queued`);
      return generatePdfFn ? generatePdfFn(job) : Promise.resolve();
    }));

    const duration = Date.now() - startTime;

    console.log(`\n✅ All jobs completed in ${duration}ms\n`);

    for (const job of testJobs) {
      const jobDir = path.join(EPK_TEMP_DIR, job.jobId);
      const pdfPath = path.join(jobDir, 'epk.pdf');

      try {
        const stats = await fs.stat(pdfPath);
        console.log(`   ✓ ${job.jobId}: ${stats.size} bytes`);
      } catch {
        console.log(`   ✗ ${job.jobId}: PDF not found`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalMemory = process.memoryUsage();
    const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

    console.log(`\n📊 Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Heap growth: ${heapGrowth.toFixed(2)} MB`);

    if (heapGrowth > 50) {
      console.log(`\n⚠️  WARNING: Heap growth exceeds 50MB threshold!`);
      process.exit(1);
    } else {
      console.log(`\n✅ Memory test passed (growth < 50MB)`);
    }

    console.log('\n📋 Test Summary:');
    console.log(`   Jobs processed: ${testJobs.length}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Avg time per job: ${(duration / testJobs.length).toFixed(0)}ms`);
    console.log(`   Memory growth: ${heapGrowth.toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runMemoryTest();
