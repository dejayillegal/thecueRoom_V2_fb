#!/usr/bin/env tsx

/**
 * Test script for cron endpoint
 * Usage: CRON_SECRET=your-secret tsx scripts/test-cron-endpoint.ts
 */

async function testCronEndpoint() {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is required');
    console.log('Usage: CRON_SECRET=your-secret tsx scripts/test-cron-endpoint.ts');
    process.exit(1);
  }

  const baseUrl = process.env.REPL_URL || 'http://localhost:5000';
  const endpoint = `${baseUrl}/api/cron/ingest`;

  console.log('🧪 Testing cron endpoint...');
  console.log(`📍 URL: ${endpoint}`);
  console.log(`🔑 Secret: ${cronSecret.substring(0, 8)}...`);
  console.log('');

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Test successful!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Go to https://cron-job.org/en/signup/');
      console.log('2. Create a new cron job with this URL');
      console.log('3. Add Authorization header with your CRON_SECRET');
      console.log('4. Set schedule to run every hour: 0 * * * *');
    } else {
      console.log('❌ Test failed');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testCronEndpoint();
