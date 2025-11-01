
#!/usr/bin/env node

/**
 * Feed integrity checker
 * Runs fetchAllSources and reports per-source status
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

async function checkIntegrity() {
  console.log('🔍 Checking feed integrity...\n');

  try {
    // Make a request to the API
    const response = await fetch('http://localhost:5000/api/gigs/india');
    const data = await response.json();

    console.log('📊 SUMMARY:');
    console.log(`Total Events: ${data.total || 0}`);
    console.log(`Total Errors: ${data.errorCount || 0}`);
    console.log('');

    if (data.errors && data.errors.length > 0) {
      console.log('⚠️  ERRORS:');
      const errorsBySourc = {};
      data.errors.forEach(err => {
        if (!errorsBySourc[err.source]) {
          errorsBySourc[err.source] = [];
        }
        errorsBySourc[err.source].push(err);
      });

      Object.entries(errorsBySourc).forEach(([source, errors]) => {
        console.log(`\n${source}:`);
        errors.slice(0, 3).forEach(err => {
          console.log(`  [${err.code}] ${err.message}`);
        });
        if (errors.length > 3) {
          console.log(`  ... and ${errors.length - 3} more errors`);
        }
      });
    }

    // Check cache status
    const CACHE_DIR = join(process.cwd(), '.local', 'cache', 'gigs');
    if (existsSync(CACHE_DIR)) {
      console.log('\n📦 CACHE STATUS:');
      const fs = require('fs');
      const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
      
      files.forEach(file => {
        try {
          const cachePath = join(CACHE_DIR, file);
          const cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
          const age = Math.floor((Date.now() - cache.lastFetched) / 1000);
          const source = file.replace('.json', '');
          console.log(`  ${source}: ${cache.events.length} events (${age}s old)`);
        } catch (err) {
          // Ignore invalid cache files
        }
      });
    }

    console.log('\n✅ Feed integrity check complete');
    
    // Exit with 0 even if some sources failed (non-fatal)
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Feed integrity check failed:', error.message);
    process.exit(0); // Still exit 0 per requirements
  }
}

checkIntegrity();
