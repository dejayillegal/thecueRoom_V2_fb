#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkTimers() {
  console.log('⏱️  Checking for long-running timers...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.addInitScript(() => {
      window.__timerTracking = {
        intervals: new Set(),
        timeouts: new Set(),
      };
      
      const originalSetInterval = window.setInterval;
      const originalClearInterval = window.clearInterval;
      const originalSetTimeout = window.setTimeout;
      const originalClearTimeout = window.clearTimeout;
      
      window.setInterval = function(handler, timeout, ...args) {
        const id = originalSetInterval.call(this, handler, timeout, ...args);
        window.__timerTracking.intervals.add(id);
        return id;
      };
      
      window.clearInterval = function(id) {
        window.__timerTracking.intervals.delete(id);
        return originalClearInterval.call(this, id);
      };
      
      window.setTimeout = function(handler, timeout, ...args) {
        const id = originalSetTimeout.call(this, handler, timeout, ...args);
        if (timeout && timeout > 10000) {
          window.__timerTracking.timeouts.add(id);
        }
        return id;
      };
      
      window.clearTimeout = function(id) {
        window.__timerTracking.timeouts.delete(id);
        return originalClearTimeout.call(this, id);
      };
    });
    
    await page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const initialTimers = await page.evaluate(() => ({
      intervals: window.__timerTracking.intervals.size,
      longTimeouts: window.__timerTracking.timeouts.size,
    }));
    
    console.log('Initial timer counts:', initialTimers);
    
    for (let i = 0; i < 10; i++) {
      await page.click('button[aria-label*="Expand"]').catch(() => {});
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(2000);
    
    const afterLoops = await page.evaluate(() => ({
      intervals: window.__timerTracking.intervals.size,
      longTimeouts: window.__timerTracking.timeouts.size,
    }));
    
    console.log('After 10 toggle loops:', afterLoops);
    
    const intervalIncrease = afterLoops.intervals - initialTimers.intervals;
    const timeoutIncrease = afterLoops.longTimeouts - initialTimers.longTimeouts;
    
    console.log(`\nInterval increase: ${intervalIncrease}`);
    console.log(`Long timeout increase: ${timeoutIncrease}`);
    
    if (intervalIncrease > 2 || timeoutIncrease > 2) {
      console.error('\n❌ FAIL: Unbounded timer growth detected');
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n✅ PASS: No unbounded timer growth detected');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during timer check:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  checkTimers();
}

module.exports = { checkTimers };
