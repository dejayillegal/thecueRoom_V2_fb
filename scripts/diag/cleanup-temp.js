#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';
const AI_TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function cleanupDirectory(dirPath, ttl = DEFAULT_TTL) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const now = Date.now();
    let deletedCount = 0;
    let totalSize = 0;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        const stats = await fs.stat(fullPath);
        const age = now - stats.mtimeMs;

        if (age > ttl) {
          if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
            console.log(`   🗑️  Deleted directory: ${entry.name} (${(age / 1000 / 60 / 60).toFixed(1)}h old)`);
          } else {
            totalSize += stats.size;
            await fs.unlink(fullPath);
            console.log(`   🗑️  Deleted file: ${entry.name} (${(stats.size / 1024).toFixed(1)} KB, ${(age / 1000 / 60 / 60).toFixed(1)}h old)`);
          }
          deletedCount++;
        }
      } catch (error) {
        console.error(`   ⚠️  Error processing ${entry.name}:`, error.message);
      }
    }

    return { deletedCount, totalSize };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`   ℹ️  Directory does not exist: ${dirPath}`);
      return { deletedCount: 0, totalSize: 0 };
    }
    throw error;
  }
}

async function cleanupShares() {
  const SHARES_FILE = path.join(process.cwd(), '.local/state/epk-shares.json');
  
  try {
    const data = await fs.readFile(SHARES_FILE, 'utf-8');
    const sharesData = JSON.parse(data);
    const now = Date.now();
    let deletedCount = 0;

    for (const [shareId, record] of Object.entries(sharesData.shares)) {
      if (record.expiresAt < now) {
        delete sharesData.shares[shareId];
        deletedCount++;
        console.log(`   🗑️  Deleted expired share: ${shareId}`);
      }
    }

    if (deletedCount > 0) {
      await fs.writeFile(SHARES_FILE, JSON.stringify(sharesData, null, 2));
      console.log(`   ✅ Cleaned ${deletedCount} expired share(s)`);
    } else {
      console.log(`   ✅ No expired shares to clean`);
    }

    return deletedCount;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`   ℹ️  No shares file found`);
      return 0;
    }
    console.error(`   ⚠️  Error cleaning shares:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🧹 thecueRoom Temporary Files Cleanup');
  console.log('═'.repeat(60));
  
  const ttlHours = parseInt(process.argv[2]) || 24;
  const ttl = ttlHours * 60 * 60 * 1000;
  
  console.log(`TTL: ${ttlHours} hours\n`);

  console.log('📂 Cleaning EPK temporary files...');
  const epkResult = await cleanupDirectory(EPK_TEMP_DIR, ttl);
  console.log(`   Deleted ${epkResult.deletedCount} items, freed ${(epkResult.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  console.log('📂 Cleaning AI temporary files...');
  const aiResult = await cleanupDirectory(AI_TEMP_DIR, ttl);
  console.log(`   Deleted ${aiResult.deletedCount} items, freed ${(aiResult.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  console.log('🔗 Cleaning expired shares...');
  await cleanupShares();
  console.log('');

  const totalDeleted = epkResult.deletedCount + aiResult.deletedCount;
  const totalSize = epkResult.totalSize + aiResult.totalSize;

  console.log('═'.repeat(60));
  console.log('✨ Cleanup completed');
  console.log(`   Total items deleted: ${totalDeleted}`);
  console.log(`   Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (totalDeleted === 0) {
    console.log('   ℹ️  No files needed cleanup');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupDirectory, cleanupShares };
