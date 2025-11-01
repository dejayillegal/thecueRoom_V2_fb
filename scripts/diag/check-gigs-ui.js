
#!/usr/bin/env node

async function main() {
  console.log('🔍 Checking Gigs UI\n');
  console.log('═'.repeat(60));

  try {
    const baseUrl = process.env.BASE_URL || 'http://0.0.0.0:5000';
    const url = `${baseUrl}/api/gigs/india`;

    console.log(`📍 Fetching: ${url}\n`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📊 API Response Check:');
    console.log(`  ✓ ok: ${data.ok}`);
    console.log(`  ✓ fromCache: ${data.fromCache}`);
    console.log(`  ✓ events is array: ${Array.isArray(data.events)}`);
    console.log(`  ✓ events.length: ${data.events?.length || 0}`);
    console.log(`  ✓ meta.totalSources: ${data.meta?.totalSources || 0}`);

    if (data.meta?.sources) {
      console.log('\n📡 Sources Summary:');
      data.meta.sources.forEach(s => {
        console.log(`  - ${s.name}: ${s.items} items (${s.status})`);
      });
    }

    console.log('\n' + '═'.repeat(60));

    if (data.ok && data.events?.length > 0) {
      console.log('✅ UI check PASSED - API returns events\n');
      process.exit(0);
    } else if (data.ok && data.events?.length === 0) {
      console.log('⚠️  API OK but no events - check source availability\n');
      process.exit(0);
    } else {
      console.log('❌ UI check FAILED\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ UI check FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
