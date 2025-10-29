
#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../apps/web/.cache/fallbacks');
const TTL_HOURS = parseInt(process.env.FALLBACK_CACHE_TTL_HRS || '168', 10);
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

async function cleanupOldCache() {
  try {
    console.log(`🧹 Cleaning up fallback cache older than ${TTL_HOURS} hours...`);
    
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();
    let deleted = 0;
    let kept = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > TTL_MS) {
        await fs.unlink(filePath);
        deleted++;
      } else {
        kept++;
      }
    }

    console.log(`✅ Cleanup complete: ${deleted} deleted, ${kept} kept`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupOldCache();
