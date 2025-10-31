#!/usr/bin/env node

/**
 * Diagnostic script to test signup rate limiting
 * Simulates repeated availability check calls to verify rate limits are enforced
 */

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '20');
const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testRateLimit() {
  console.log('🧪 Testing Signup Rate Limiting');
  console.log('━'.repeat(60));
  console.log(`Rate Limit: ${RATE_LIMIT_MAX} requests per window`);
  console.log(`Target: ${API_URL}/api/auth/check-availability\n`);

  let successCount = 0;
  let rateLimitedCount = 0;
  const totalRequests = RATE_LIMIT_MAX + 5; // Try to exceed limit

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const res = await fetch(`${API_URL}/api/auth/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: `test${i}@example.com`,
        }),
      });

      if (res.status === 429) {
        rateLimitedCount++;
        console.log(`Request ${i}: ❌ Rate limited (${res.status})`);
      } else {
        successCount++;
        console.log(`Request ${i}: ✓ Success (${res.status})`);
      }
    } catch (error) {
      console.log(`Request ${i}: ⚠️  Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n' + '━'.repeat(60));
  console.log('📊 Results:');
  console.log(`  ✓ Successful requests: ${successCount}`);
  console.log(`  ❌ Rate limited: ${rateLimitedCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('\n✅ PASS: Rate limiting is working');
    process.exit(0);
  } else {
    console.log('\n⚠️  WARNING: No rate limiting detected');
    process.exit(1);
  }
}

testRateLimit().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
