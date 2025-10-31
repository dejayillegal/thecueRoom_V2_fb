#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkEventListeners() {
  console.log('🔍 Checking for event listener leaks...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.addInitScript(() => {
      window.__listenerTracking = {
        window: new Map(),
        document: new Map(),
        counters: { window: 0, document: 0 },
      };
      
      const originalWindowAdd = window.addEventListener;
      const originalWindowRemove = window.removeEventListener;
      const originalDocumentAdd = document.addEventListener;
      const originalDocumentRemove = document.removeEventListener;
      
      window.addEventListener = function(type, listener, options) {
        if (!window.__listenerTracking.window.has(type)) {
          window.__listenerTracking.window.set(type, new Set());
        }
        window.__listenerTracking.window.get(type).add(listener);
        window.__listenerTracking.counters.window = Array.from(window.__listenerTracking.window.values())
          .reduce((sum, set) => sum + set.size, 0);
        return originalWindowAdd.call(this, type, listener, options);
      };
      
      window.removeEventListener = function(type, listener, options) {
        const typeSet = window.__listenerTracking.window.get(type);
        if (typeSet) {
          typeSet.delete(listener);
          if (typeSet.size === 0) {
            window.__listenerTracking.window.delete(type);
          }
        }
        window.__listenerTracking.counters.window = Array.from(window.__listenerTracking.window.values())
          .reduce((sum, set) => sum + set.size, 0);
        return originalWindowRemove.call(this, type, listener, options);
      };
      
      document.addEventListener = function(type, listener, options) {
        if (!window.__listenerTracking.document.has(type)) {
          window.__listenerTracking.document.set(type, new Set());
        }
        window.__listenerTracking.document.get(type).add(listener);
        window.__listenerTracking.counters.document = Array.from(window.__listenerTracking.document.values())
          .reduce((sum, set) => sum + set.size, 0);
        return originalDocumentAdd.call(this, type, listener, options);
      };
      
      document.removeEventListener = function(type, listener, options) {
        const typeSet = window.__listenerTracking.document.get(type);
        if (typeSet) {
          typeSet.delete(listener);
          if (typeSet.size === 0) {
            window.__listenerTracking.document.delete(type);
          }
        }
        window.__listenerTracking.counters.document = Array.from(window.__listenerTracking.document.values())
          .reduce((sum, set) => sum + set.size, 0);
        return originalDocumentRemove.call(this, type, listener, options);
      };
    });
    
    await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const initialListeners = await page.evaluate(() => window.__listenerTracking.counters);
    
    console.log('Initial listener counts:', initialListeners);
    
    for (let i = 0; i < 10; i++) {
      await page.click('button[aria-label*="Expand"]').catch(() => {});
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(1000);
    
    const afterLoops = await page.evaluate(() => window.__listenerTracking.counters);
    
    console.log('After 10 toggle loops:', afterLoops);
    
    const windowIncrease = afterLoops.window - initialListeners.window;
    const documentIncrease = afterLoops.document - initialListeners.document;
    
    console.log(`\nWindow listeners increase: ${windowIncrease}`);
    console.log(`Document listeners increase: ${documentIncrease}`);
    
    const totalIncrease = windowIncrease + documentIncrease;
    
    if (totalIncrease > 10) {
      console.error('\n❌ FAIL: Event listener leak detected');
      console.error(`   Total increase: ${totalIncrease} listeners`);
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n✅ PASS: No significant event listener leaks detected');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during listener check:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  checkEventListeners();
}

module.exports = { checkEventListeners };
