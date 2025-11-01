
#!/usr/bin/env node

/**
 * Clears the gigs feed cache
 * Usage: node scripts/diag/clear-gigs-cache.js [source-name]
 */

const { clearCache } = require('../../packages/feeds/cache');

const sourceName = process.argv[2];

console.log(sourceName ? `Clearing cache for ${sourceName}...` : 'Clearing all gigs caches...');

try {
  clearCache(sourceName);
  console.log('✅ Cache cleared successfully');
} catch (error) {
  console.error('❌ Failed to clear cache:', error);
  process.exit(1);
}
