
#!/usr/bin/env node

const http = require('http');

const NUM_REQUESTS = 100;
const BASE_URL = 'http://0.0.0.0:5000';

function measureRequest(id, width = 300) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = `${BASE_URL}/api/fallback-thumb/${id}?w=${width}&format=webp`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          id,
          duration,
          status: res.statusCode,
          cached: res.headers['x-cache'] === 'HIT',
        });
      });
    }).on('error', reject);
  });
}

async function runStressTest() {
  console.log(`🔥 Starting fallback thumbnail stress test (${NUM_REQUESTS} requests)...\n`);
  
  const ids = Array.from({ length: NUM_REQUESTS }, (_, i) => `test-article-${i}`);
  
  // First run (cache miss)
  console.log('📊 First run (cache miss)...');
  const firstRun = await Promise.all(ids.map(id => measureRequest(id)));
  const firstRunTimes = firstRun.map(r => r.duration);
  const firstMedian = firstRunTimes.sort((a, b) => a - b)[Math.floor(firstRunTimes.length / 2)];
  const firstAvg = firstRunTimes.reduce((a, b) => a + b, 0) / firstRunTimes.length;
  
  console.log(`  Median: ${firstMedian}ms`);
  console.log(`  Average: ${firstAvg.toFixed(2)}ms`);
  console.log(`  Min: ${Math.min(...firstRunTimes)}ms`);
  console.log(`  Max: ${Math.max(...firstRunTimes)}ms\n`);
  
  // Second run (cache hit)
  console.log('📊 Second run (cache hit)...');
  const secondRun = await Promise.all(ids.map(id => measureRequest(id)));
  const secondRunTimes = secondRun.map(r => r.duration);
  const secondMedian = secondRunTimes.sort((a, b) => a - b)[Math.floor(secondRunTimes.length / 2)];
  const secondAvg = secondRunTimes.reduce((a, b) => a + b, 0) / secondRunTimes.length;
  
  console.log(`  Median: ${secondMedian}ms`);
  console.log(`  Average: ${secondAvg.toFixed(2)}ms`);
  console.log(`  Min: ${Math.min(...secondRunTimes)}ms`);
  console.log(`  Max: ${Math.max(...secondRunTimes)}ms\n`);
  
  const cacheHitRatio = secondRun.filter(r => r.cached).length / secondRun.length;
  console.log(`📈 Cache hit ratio: ${(cacheHitRatio * 100).toFixed(1)}%`);
  
  // Performance check
  if (firstMedian > 250) {
    console.log(`\n⚠️  WARNING: First run median (${firstMedian}ms) exceeds 250ms threshold`);
  } else {
    console.log(`\n✅ Performance check passed (${firstMedian}ms < 250ms)`);
  }
  
  console.log(`\n🎯 Improvement: ${((firstMedian - secondMedian) / firstMedian * 100).toFixed(1)}% faster on cache hit`);
}

runStressTest().catch(console.error);
