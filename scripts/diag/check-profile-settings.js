
#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';

console.log('🔍 Profile Settings Diagnostic\n');
console.log('═'.repeat(70));

async function testProfileAPI() {
  const tests = [
    {
      name: 'Fetch Profile',
      method: 'GET',
      endpoint: '/api/profile',
      headers: { 'x-user-id': '00000000-0000-0000-0000-000000000000' },
    },
    {
      name: 'Update Profile',
      method: 'PATCH',
      endpoint: '/api/profile',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-0000-0000-000000000000',
      },
      body: JSON.stringify({
        displayName: 'Test User',
        bio: 'Test bio',
        showEmail: false,
        showPhone: false,
      }),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: test.headers,
        body: test.body,
      });

      if (response.ok) {
        console.log(`✅ ${test.name}: HTTP ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: HTTP ${response.status}`);
        failed++;
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

testProfileAPI();
