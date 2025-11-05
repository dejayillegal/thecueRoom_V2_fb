
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Fuzzing payloads
const fuzzPayloads = {
  strings: [
    '', // Empty
    'a'.repeat(10000), // Very long
    '\x00\x01\x02', // Binary
    '<script>alert(1)</script>', // XSS
    "'; DROP TABLE users; --", // SQL injection
    '../../../etc/passwd', // Path traversal
    '\u0000', // Null byte
  ],
  numbers: [
    0,
    -1,
    9999999999,
    -9999999999,
    NaN,
    Infinity,
    -Infinity,
  ],
  objects: [
    null,
    {},
    { nested: { deeply: { value: 'test' } } },
    [],
    [1, 2, 3],
  ],
};

async function fuzzEndpoint(endpoint, method = 'POST', basePayload = {}) {
  console.log(`Fuzzing ${method} ${endpoint}...`);
  let crashes = 0;
  let errors = 0;

  for (const [key, values] of Object.entries(fuzzPayloads.strings)) {
    for (const value of values) {
      const payload = { ...basePayload, [key]: value };
      
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.status >= 500) {
          errors++;
          console.log(`  ⚠️  500 error with payload:`, payload);
        }
      } catch (err) {
        crashes++;
        console.log(`  ❌ Crash with payload:`, payload, err.message);
      }
    }
  }

  console.log(`  Results: ${crashes} crashes, ${errors} 5xx errors`);
  return { crashes, errors };
}

async function runFuzzTests() {
  console.log('Starting API fuzzing tests...\n');

  await fuzzEndpoint('/api/admin/monthly-playlists/validate', 'POST', { url: 'test' });
  await fuzzEndpoint('/api/auth/signup', 'POST', { email: 'test@test.com' });
  await fuzzEndpoint('/api/ai/social-promo/generate', 'POST', { prompt: 'test' });

  console.log('\nFuzzing complete!');
}

runFuzzTests().catch(console.error);
