
#!/usr/bin/env node

process.env.PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED || 'false';

async function main() {
  console.log('🔍 Checking India Gigs Integrity...\n');
  console.log('═'.repeat(60));

  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/gigs/india?force=true`;

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
    console.log(`  ✓ From Cache: ${data.meta?.fromCache || false}`);
    console.log(`  ✓ Is Refreshing: ${data.meta?.isRefreshing || false}`);

    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      data.errors.forEach(err => {
        console.log(`  - ${err.source}: ${err.code} - ${err.message}${err.fromCache ? ' (using cache)' : ''}`);
        if (err.methodAttempted) {
          console.log(`    Method attempted: ${err.methodAttempted}`);
        }
      });
    }

    if (data.meta?.sources) {
      console.log('\n📡 Active Sources:');
      data.meta.sources.forEach(s => console.log(`  - ${s}`));
    }

    if (data.events && data.events.length > 0) {
      console.log('\n🎫 Sample Events:');
      data.events.slice(0, 3).forEach(e => {
        console.log(`  - ${e.title} (${e.city || 'Unknown'}) - ${e.source}`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Integrity check completed\n');

  } catch (error) {
    console.error('\n❌ Integrity check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
