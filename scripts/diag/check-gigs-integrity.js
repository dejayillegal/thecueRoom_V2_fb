#!/usr/bin/env node

process.env.TEST_MODE = 'true';
process.env.PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED || 'false';

async function main() {
  console.log('🔍 Checking India Gigs Integrity...\n');
  console.log('═'.repeat(60));

  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/gigs/india?refresh=true`;
    
    console.log(`📍 Fetching: ${url}\n`);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📊 Summary:');
    console.log(`  ✓ Response OK: ${data.ok}`);
    console.log(`  ✓ Events: ${data.events?.length || 0}`);
    console.log(`  ✓ Errors: ${data.errors?.length || 0}`);
    console.log(`  ✓ Total: ${data.total || data.events?.length || 0}`);

    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      data.errors.forEach(err => {
        console.log(`  - ${err.source}: ${err.code} - ${err.message}${err.fromCache ? ' (using cache)' : ''}`);
      });
    }

    if (data.events && data.events.length > 0) {
      console.log('\n📝 Sample Events:');
      data.events.slice(0, 3).forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event.title}`);
        console.log(`     Source: ${event.source}`);
        console.log(`     Venue: ${event.venue?.name || event.venue || 'N/A'}`);
        console.log(`     Date: ${event.startAt || event.date || 'N/A'}`);
        console.log(`     Ticket URL: ${event.ticketUrl || event.url || 'N/A'}`);
        console.log('');
      });
    }

    console.log('═'.repeat(60));
    console.log('✅ Integrity Check Complete\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Integrity Check Failed:', error.message);
    console.error('\nError Details:', error);
    console.log('═'.repeat(60));
    process.exit(1);
  }
}

main();
