#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkEventListeners() {
  console.log('🔍 Checking for event listener leaks...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    
    const initialListeners = await page.evaluate(() => {
      const listeners = {
        window: window.getEventListeners ? Object.keys(window.getEventListeners(window)).length : 0,
        document: document.getEventListeners ? Object.keys(document.getEventListeners(document)).length : 0,
      };
      return listeners;
    });
    
    console.log('Initial listener counts:', initialListeners);
    
    for (let i = 0; i < 10; i++) {
      await page.click('button[aria-label*="Expand"]').catch(() => {});
      await page.waitForTimeout(100);
    }
    
    const afterLoops = await page.evaluate(() => {
      const listeners = {
        window: window.getEventListeners ? Object.keys(window.getEventListeners(window)).length : 0,
        document: document.getEventListeners ? Object.keys(document.getEventListeners(document)).length : 0,
      };
      return listeners;
    });
    
    console.log('After 10 toggle loops:', afterLoops);
    
    const windowIncrease = afterLoops.window - initialListeners.window;
    const documentIncrease = afterLoops.document - initialListeners.document;
    
    console.log(`\nWindow listeners increase: ${windowIncrease}`);
    console.log(`Document listeners increase: ${documentIncrease}`);
    
    if (windowIncrease > 5 || documentIncrease > 5) {
      console.error('\n❌ FAIL: Event listener leak detected');
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
