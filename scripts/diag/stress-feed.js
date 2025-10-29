#!/usr/bin/env node

/**
 * Stress test for feed endpoint with concurrent requests
 * Usage: node scripts/diag/stress-feed.js [url] [concurrency]
 */

const CONCURRENT_REQUESTS = parseInt(process.argv[3]) || 200;
const TARGET_URL = process.argv[2] || 'http://localhost:5000/api/feeds?limit=32';
const TIMEOUT_MS = 10000;

let successCount = 0;
let errorCount = 0;
let timeoutCount = 0;
let totalResponseTime = 0;
const responseTimes = [];

async function makeRequest(id) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(TARGET_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      await response.json();
      successCount++;
      totalResponseTime += duration;
      responseTimes.push(duration);
      
      if (id % 20 === 0) {
        process.stdout.write(`\r✅ Success: ${successCount} | ❌ Errors: ${errorCount} | ⏱️  Avg: ${Math.round(totalResponseTime / successCount)}ms`);
      }
    } else {
      errorCount++;
      console.error(`\n❌ Request ${id} failed: HTTP ${response.status}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      timeoutCount++;
      console.error(`\n⏱️  Request ${id} timed out after ${TIMEOUT_MS}ms`);
    } else {
      errorCount++;
      console.error(`\n❌ Request ${id} error:`, error.message);
    }
  }
}

async function runStressTest() {
  console.log('🚀 Feed Endpoint Stress Test\n');
  console.log('─'.repeat(70));
  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log('─'.repeat(70));
  console.log('\n⏳ Running stress test...\n');
  
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest(i + 1));
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  console.log('\n\n' + '─'.repeat(70));
  console.log('📊 Test Results');
  console.log('─'.repeat(70));
  
  console.log(`\nTotal Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`✅ Successful: ${successCount} (${Math.round((successCount / CONCURRENT_REQUESTS) * 100)}%)`);
  console.log(`❌ Failed: ${errorCount} (${Math.round((errorCount / CONCURRENT_REQUESTS) * 100)}%)`);
  console.log(`⏱️  Timeouts: ${timeoutCount} (${Math.round((timeoutCount / CONCURRENT_REQUESTS) * 100)}%)`);
  
  if (responseTimes.length > 0) {
    responseTimes.sort((a, b) => a - b);
    const avgResponseTime = Math.round(totalResponseTime / successCount);
    const minResponseTime = responseTimes[0];
    const maxResponseTime = responseTimes[responseTimes.length - 1];
    
    const medianIdx = Math.floor(responseTimes.length / 2);
    const medianResponseTime = responseTimes[medianIdx];
    
    const p95Idx = Math.min(Math.floor(responseTimes.length * 0.95), responseTimes.length - 1);
    const p99Idx = Math.min(Math.floor(responseTimes.length * 0.99), responseTimes.length - 1);
    const p95ResponseTime = responseTimes[p95Idx] || maxResponseTime;
    const p99ResponseTime = responseTimes[p99Idx] || maxResponseTime;
    
    console.log(`\n⏱️  Response Times:`);
    console.log(`   Min: ${minResponseTime}ms`);
    console.log(`   Max: ${maxResponseTime}ms`);
    console.log(`   Avg: ${avgResponseTime}ms`);
    console.log(`   Median: ${medianResponseTime}ms`);
    console.log(`   P95: ${p95ResponseTime}ms ${responseTimes.length < 20 ? '(low sample)' : ''}`);
    console.log(`   P99: ${p99ResponseTime}ms ${responseTimes.length < 100 ? '(low sample)' : ''}`);
  }
  
  const requestsPerSecond = Math.round((CONCURRENT_REQUESTS / totalDuration) * 1000);
  console.log(`\n🚀 Throughput: ${requestsPerSecond} requests/second`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  console.log('\n' + '─'.repeat(70));
  
  const successRate = (successCount / CONCURRENT_REQUESTS) * 100;
  if (successRate >= 95) {
    console.log('✅ STRESS TEST PASSED - Success rate >= 95%');
    process.exit(0);
  } else if (successRate >= 80) {
    console.log('⚠️  STRESS TEST WARNING - Success rate between 80-95%');
    process.exit(1);
  } else {
    console.log('❌ STRESS TEST FAILED - Success rate < 80%');
    process.exit(1);
  }
}

if (require.main === module) {
  runStressTest().catch((error) => {
    console.error('\n❌ Fatal error during stress test:', error);
    process.exit(1);
  });
}

module.exports = { runStressTest };
