
#!/usr/bin/env node

process.env.PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED || 'false';

async function main() {
  console.log('🧪 Running India Gigs Poller Once\n');
  console.log('═'.repeat(60));

  try {
    const baseUrl = process.env.BASE_URL || 'http://0.0.0.0:5000';
    const url = `${baseUrl}/api/gigs/india?force=true`;

    console.log(`📍 Fetching: ${url}\n`);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('\n📊 Results:');
    console.log(`  Duration: ${duration}ms`);
    console.log(`  OK: ${data.ok}`);
    console.log(`  From Cache: ${data.fromCache}`);
    console.log(`  Cache Age: ${data.cacheAgeSeconds}s`);
    console.log(`  Events: ${data.events?.length || 0}`);
    console.log(`  Total Sources: ${data.meta?.totalSources || 0}`);

    if (data.meta?.sources) {
      console.log('\n📡 Source Details:');
      data.meta.sources.forEach(s => {
        console.log(`  ${s.name}: ${s.items} items, ${s.method}, ${s.status} (${s.durationMs}ms)`);
      });
    }

    if (data.events && data.events.length > 0) {
      console.log('\n🎫 Sample Events:');
      data.events.slice(0, 3).forEach(e => {
        console.log(`  - ${e.title} @ ${e.venue || 'TBA'}, ${e.city || 'Unknown'} (${e.source})`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    
    if (data.events?.length > 0) {
      console.log('✅ Poller test PASSED\n');
      process.exit(0);
    } else {
      console.log('⚠️  No events returned - check source logs\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Poller test FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
