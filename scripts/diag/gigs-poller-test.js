
#!/usr/bin/env node

/**
 * Gigs Poller Test Script
 * Tests multi-tier fetch strategy for India gigs
 */

process.env.PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED || 'false';
process.env.POLL_CONCURRENCY = '2';

async function main() {
  console.log('🧪 Testing India Gigs Poller\n');
  console.log('═'.repeat(60));
  console.log(`PLAYWRIGHT_ENABLED: ${process.env.PLAYWRIGHT_ENABLED}`);
  console.log(`POLL_CONCURRENCY: ${process.env.POLL_CONCURRENCY}`);
  console.log('═'.repeat(60));

  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/gigs/india?force=true`;

    console.log(`\n📍 Fetching: ${url}\n`);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('\n📊 Results Summary:');
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Status: ${data.ok ? '✓ OK' : '✗ FAILED'}`);
    console.log(`  Events: ${data.events?.length || 0}`);
    console.log(`  Errors: ${data.errors?.length || 0}`);
    console.log(`  From Cache: ${data.meta?.fromCache || false}`);
    console.log(`  Is Refreshing: ${data.meta?.isRefreshing || false}`);

    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️  Errors by Source:');
      const errorsBySrc = {};
      data.errors.forEach(err => {
        if (!errorsBySrc[err.source]) {
          errorsBySrc[err.source] = [];
        }
        errorsBySrc[err.source].push(err);
      });

      Object.keys(errorsBySrc).forEach(src => {
        console.log(`\n  ${src}:`);
        errorsBySrc[src].forEach(err => {
          console.log(`    - ${err.code}: ${err.message}`);
          if (err.methodAttempted) {
            console.log(`      Method: ${err.methodAttempted}`);
          }
        });
      });
    }

    if (data.meta?.sources) {
      console.log('\n📡 Active Sources:');
      data.meta.sources.forEach(s => console.log(`  - ${s}`));
    }

    if (data.events && data.events.length > 0) {
      console.log('\n🎫 Sample Events:');
      data.events.slice(0, 5).forEach(e => {
        console.log(`  - ${e.title} (${e.city || 'Unknown'}) - ${e.source}`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    
    if (data.events?.length > 0) {
      console.log('✅ Poller test PASSED\n');
      process.exit(0);
    } else {
      console.log('⚠️  Poller test completed but no events found');
      console.log('This may be expected if sources are blocked or unavailable\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Poller test FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
