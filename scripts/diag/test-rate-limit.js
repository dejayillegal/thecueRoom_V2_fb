
#!/usr/bin/env node

/**
 * Rate limit smoke test
 */

const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';
const MAX_ATTEMPTS = 5;

async function testRateLimit() {
  console.log('🔒 Testing Rate Limiter\n');
  console.log('═'.repeat(60));

  console.log(`\nAttempting ${MAX_ATTEMPTS} rapid signups...\n`);

  let rateLimited = false;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Spam',
          lastName: 'Test',
          email: `spam${i}@example.test`,
          password: 'Test1234!',
          confirmPassword: 'Test1234!',
          username: `spam${i}`,
          isArtist: false,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        console.log(`  ${i + 1}. ✅ Rate limited (429)`);
        rateLimited = true;
        break;
      } else {
        console.log(`  ${i + 1}. Status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ${i + 1}. Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '═'.repeat(60));

  if (rateLimited) {
    console.log('\n✅ Rate limiter working correctly\n');
  } else {
    console.log('\n⚠️  No rate limit detected after ${MAX_ATTEMPTS} attempts\n');
  }
}

testRateLimit().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
