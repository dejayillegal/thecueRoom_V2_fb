#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkMemory() {
  console.log('💾 Checking memory usage...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });
    
    if (!initialMemory) {
      console.log('⚠️  Browser memory API not available, skipping memory test');
      await browser.close();
      process.exit(0);
    }
    
    console.log('Initial heap:', {
      used: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    });
    
    console.log('\nRunning navigation and sidebar toggle loops...');
    
    for (let i = 0; i < 50; i++) {
      await page.click('button[aria-label*="Expand"]').catch(() => {});
      await page.waitForTimeout(50);
      
      await page.goto('/dashboard').catch(() => {});
      await page.waitForTimeout(100);
      
      if (i % 10 === 0 && i > 0) {
        console.log(`  Completed ${i} iterations...`);
      }
    }
    
    await page.waitForTimeout(2000);
    
    if (global.gc) {
      global.gc();
      await page.waitForTimeout(1000);
    }
    
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });
    
    console.log('\nFinal heap:', {
      used: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(finalMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    });
    
    const heapIncreaseMB = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
    
    console.log(`\nHeap increase: ${heapIncreaseMB.toFixed(2)} MB`);
    
    if (heapIncreaseMB > 30) {
      console.error('\n❌ FAIL: Excessive client heap increase (>30MB)');
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n✅ PASS: Client heap increase within acceptable limits');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during memory check:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  checkMemory();
}

module.exports = { checkMemory };
