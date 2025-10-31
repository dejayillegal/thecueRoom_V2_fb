#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const TEST_MODE = process.env.TEST_MODE || 'true';
const EPK_WORKER_CONCURRENCY = '3';

console.log('🧪 EPK Memory Diagnostics Check');
console.log('═'.repeat(60));
console.log(`Test Mode: ${TEST_MODE}`);
console.log(`Concurrency: ${EPK_WORKER_CONCURRENCY}`);
console.log('');

const initialMemory = process.memoryUsage();
console.log('📊 Initial Memory:');
console.log(`   Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`   RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
console.log('');

const jobs = [];
const jobCount = 3;

async function createEPKJob(index) {
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-s',
      '-X', 'POST',
      'http://localhost:5000/api/epk/generate',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [
          { id: '1', type: 'bio', order: 0, data: { text: 'Test bio for memory check' } },
          { id: '2', type: 'tracklist', order: 1, data: { tracks: [{ title: 'Track 1' }] } }
        ],
        artistName: `Test Artist ${index}`,
        releaseTitle: `Memory Check ${index}`,
        exportFormat: 'pdf',
        includeWatermark: true
      })
    ]);

    let output = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      console.error(`   Error in job ${index}:`, data.toString());
    });

    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response for job ${index}: ${output}`));
        }
      } else {
        reject(new Error(`Job ${index} failed with code ${code}`));
      }
    });
  });
}

async function pollJob(jobId) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attempts++;

      const curl = spawn('curl', [
        '-s',
        `http://localhost:5000/api/epk/job/${jobId}`
      ]);

      let output = '';

      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            
            if (result.status === 'done') {
              clearInterval(interval);
              resolve(result);
            } else if (result.status === 'error') {
              clearInterval(interval);
              reject(new Error(`Job ${jobId} failed: ${result.error}`));
            } else if (attempts >= maxAttempts) {
              clearInterval(interval);
              reject(new Error(`Job ${jobId} timed out after ${maxAttempts} attempts`));
            }
          } catch (error) {
            clearInterval(interval);
            reject(new Error(`Failed to parse job status: ${output}`));
          }
        }
      });
    }, 1000);
  });
}

async function runDiagnostics() {
  console.log('🚀 Creating 3 concurrent EPK generation jobs...\n');

  try {
    const createPromises = [];
    for (let i = 1; i <= jobCount; i++) {
      console.log(`   Creating job ${i}...`);
      createPromises.push(createEPKJob(i));
    }

    const jobResults = await Promise.all(createPromises);
    console.log(`\n✅ All ${jobCount} jobs created successfully`);
    
    jobResults.forEach((result, idx) => {
      console.log(`   Job ${idx + 1}: ${result.jobId} (${result.status})`);
      jobs.push(result.jobId);
    });

    console.log('\n⏳ Waiting for jobs to complete...\n');

    const pollPromises = jobs.map((jobId, idx) => {
      console.log(`   Polling job ${idx + 1} (${jobId})...`);
      return pollJob(jobId);
    });

    await Promise.all(pollPromises);

    console.log('\n✅ All jobs completed successfully\n');

    const finalMemory = process.memoryUsage();
    console.log('📊 Final Memory:');
    console.log(`   Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    console.log('📈 Memory Growth:');
    console.log(`   Heap Growth: ${heapGrowth.toFixed(2)} MB`);
    console.log('');

    if (heapGrowth > 70) {
      console.error('❌ FAILED: Memory growth exceeds 70MB threshold');
      console.error(`   Actual growth: ${heapGrowth.toFixed(2)} MB`);
      process.exit(1);
    } else {
      console.log('✅ PASSED: Memory growth within acceptable limits');
      console.log(`   Growth: ${heapGrowth.toFixed(2)} MB (< 70 MB threshold)`);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('✨ Memory diagnostics completed successfully');

  } catch (error) {
    console.error('\n❌ Diagnostics failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  process.env.TEST_MODE = TEST_MODE;
  process.env.EPK_WORKER_CONCURRENCY = EPK_WORKER_CONCURRENCY;
  
  runDiagnostics().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runDiagnostics };
