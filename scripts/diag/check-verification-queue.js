
#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';

console.log('🔍 Verification Queue Diagnostic\n');
console.log('═'.repeat(70));

async function testVerificationQueue() {
  const tests = [
    {
      name: 'Fetch Queue',
      endpoint: '/api/admin/verification',
      headers: { 'x-admin': 'true' },
    },
    {
      name: 'Admin Auth Check',
      endpoint: '/api/admin/verification',
      headers: {},
      expectFail: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        headers: test.headers,
      });

      if (test.expectFail) {
        if (!response.ok) {
          console.log(`✅ ${test.name}: Correctly rejected (HTTP ${response.status})`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: Should have been rejected`);
          failed++;
        }
      } else {
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${test.name}: HTTP ${response.status} (${data.tasks?.length || 0} tasks)`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: HTTP ${response.status}`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 Results: ${passed}/${tests.length} passed\n`);

  process.exit(failed > 0 ? 1 : 0);
}

testVerificationQueue();
