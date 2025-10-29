#!/usr/bin/env node

import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

const AI_TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';
const AI_TEMP_TTL_HOURS = parseInt(process.env.AI_TEMP_TTL_HOURS || '24');

async function cleanupOldFiles() {
  try {
    console.log(`🧹 Starting cleanup of AI temp files older than ${AI_TEMP_TTL_HOURS}h...`);
    console.log(`📂 Directory: ${AI_TEMP_DIR}\n`);

    const files = await readdir(AI_TEMP_DIR).catch(() => {
      console.log('⚠️  Temp directory does not exist yet');
      return [];
    });

    if (files.length === 0) {
      console.log('✅ No files to clean up');
      return;
    }

    const now = Date.now();
    const cutoffTime = now - (AI_TEMP_TTL_HOURS * 60 * 60 * 1000);
    
    let deletedCount = 0;
    let keptCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = join(AI_TEMP_DIR, file);
      
      try {
        const stats = await stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await unlink(filePath);
          deletedCount++;
          totalSize += stats.size;
          console.log(`🗑️  Deleted: ${file} (${(stats.size / 1024).toFixed(2)} KB, ${Math.floor((now - stats.mtimeMs) / (1000 * 60 * 60))}h old)`);
        } else {
          keptCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Kept: ${keptCount} files`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupOldFiles();
