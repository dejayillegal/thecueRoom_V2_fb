#!/usr/bin/env node
/**
 * Scroll stress test using Playwright
 * Measures frame drops and main-thread blockage during heavy scrolling
 * Usage: node run-scroll-stress.js http://localhost:5000/feed
 */

const { chromium } = require('@playwright/test');

const TARGET_URL = process.argv[2] || 'http://localhost:5000/feed';
const MAX_FRAME_DROP_PERCENTAGE = 5; // 5%
const MAX_LONG_TASK_MS = 100; // 100ms

async function runScrollStressTest() {
  console.log('🚀 Starting scroll stress test...\n');
  console.log(`   Target URL: ${TARGET_URL}`);
  console.log(`   Max frame drops: ${MAX_FRAME_DROP_PERCENTAGE}%`);
  console.log(`   Max long task: ${MAX_LONG_TASK_MS}ms\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const metrics = {
    frameCount: 0,
    droppedFrames: 0,
    longTasks: [],
    jankEvents: 0,
  };

  // Monitor performance
  await page.addInitScript(() => {
    window.__perfMetrics = {
      frames: 0,
      dropped: 0,
      longTasks: [],
    };

    // Count frames
    let lastTime = performance.now();
    function countFrames() {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      window.__perfMetrics.frames++;

      // Detect dropped frames (>33ms for 30fps)
      if (delta > 33) {
        window.__perfMetrics.dropped++;
      }

      requestAnimationFrame(countFrames);
    }
    requestAnimationFrame(countFrames);

    // Detect long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          window.__perfMetrics.longTasks.push({
            duration: entry.duration,
            name: entry.name,
          });
        }
      }
    });
    observer.observe({ entryTypes: ['longtask', 'measure'] });
  });

  try {
    console.log('📄 Loading page...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Page loaded\n');

    console.log('📜 Performing scroll stress test...');
    
    // Scroll down in steps
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.8);
      });
      await page.waitForTimeout(200);
    }

    // Scroll up rapidly
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, -window.innerHeight);
      });
      await page.waitForTimeout(100);
    }

    // Fast continuous scroll
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let scrollTop = 0;
        const interval = setInterval(() => {
          scrollTop += 50;
          window.scrollTo(0, scrollTop);
          if (scrollTop > document.documentElement.scrollHeight - window.innerHeight) {
            clearInterval(interval);
            resolve();
          }
        }, 16); // ~60fps
      });
    });

    console.log('✓ Scroll test completed\n');

    // Collect metrics
    const perfMetrics = await page.evaluate(() => window.__perfMetrics);
    metrics.frameCount = perfMetrics.frames;
    metrics.droppedFrames = perfMetrics.dropped;
    metrics.longTasks = perfMetrics.longTasks;

    const dropPercentage = (metrics.droppedFrames / metrics.frameCount) * 100;
    const longTasksOver100ms = metrics.longTasks.filter(t => t.duration > MAX_LONG_TASK_MS);

    console.log('📊 Performance Metrics:\n');
    console.log(`   Total frames: ${metrics.frameCount}`);
    console.log(`   Dropped frames: ${metrics.droppedFrames} (${dropPercentage.toFixed(2)}%)`);
    console.log(`   Long tasks (>100ms): ${longTasksOver100ms.length}`);
    
    if (longTasksOver100ms.length > 0) {
      console.log('\n   Longest tasks:');
      longTasksOver100ms.slice(0, 5).forEach(task => {
        console.log(`     - ${task.duration.toFixed(2)}ms: ${task.name}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    let passed = true;
    if (dropPercentage > MAX_FRAME_DROP_PERCENTAGE) {
      console.log(`❌ FAILED: Frame drop rate ${dropPercentage.toFixed(2)}% exceeds ${MAX_FRAME_DROP_PERCENTAGE}%`);
      passed = false;
    } else {
      console.log(`✅ Frame drops within acceptable range: ${dropPercentage.toFixed(2)}%`);
    }

    if (longTasksOver100ms.length > 5) {
      console.log(`❌ FAILED: ${longTasksOver100ms.length} tasks blocked main thread >100ms`);
      passed = false;
    } else {
      console.log(`✅ Main thread blockage acceptable: ${longTasksOver100ms.length} long tasks`);
    }

    await browser.close();

    if (passed) {
      console.log('\n✅ PASSED: Scroll stress test successful\n');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED: Performance issues detected\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await browser.close();
    process.exit(1);
  }
}

runScrollStressTest();
