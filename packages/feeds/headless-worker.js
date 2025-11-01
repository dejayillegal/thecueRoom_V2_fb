
// THIS FILE IS SERVER-ONLY. Invoked via child_process.fork() only.
// Never imported directly by Next.js bundles.

const { chromium } = require('playwright');

let browser = null;

async function getBrowser() {
  if (!browser) {
    const args = process.env.PLAYWRIGHT_HEADLESS_ARGS 
      ? process.env.PLAYWRIGHT_HEADLESS_ARGS.split(',')
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
    
    browser = await chromium.launch({
      headless: true,
      args
    });
  }
  return browser;
}

process.on('message', async (msg) => {
  try {
    if (!msg || !msg.url) {
      return process.send({ 
        jobId: msg?.jobId, 
        ok: false, 
        error: 'no url provided' 
      });
    }

    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    const userAgent = msg.preferHeaders?.['User-Agent'] 
      || process.env.FEED_USER_AGENT 
      || 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36';
    
    await page.setUserAgent(userAgent);
    
    if (msg.emulateMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }

    // Set extra headers if provided
    if (msg.preferHeaders) {
      await page.setExtraHTTPHeaders(msg.preferHeaders);
    }
    
    await page.goto(msg.url, { 
      waitUntil: 'networkidle',
      timeout: msg.timeout || 15000
    });

    if (msg.waitForSelector) {
      await page.waitForSelector(msg.waitForSelector, { 
        timeout: msg.waitForSelectorTimeout || 5000 
      }).catch(() => {});
    } else {
      await page.waitForTimeout(2000);
    }

    const html = await page.content();
    const elements = [];

    if (msg.selector) {
      const elementHandles = await page.$$(msg.selector);
      for (const element of elementHandles) {
        const outerHTML = await element.evaluate(el => el.outerHTML);
        elements.push(outerHTML);
      }
    }

    await page.close();

    process.send({ 
      jobId: msg.jobId, 
      ok: true, 
      html,
      statusCode: 200,
      elements: elements.length > 0 ? elements : undefined
    });

  } catch (err) {
    process.send({ 
      jobId: msg.jobId, 
      ok: false, 
      error: err && err.message ? err.message : String(err) 
    });
  }
});

process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[Headless Worker] Uncaught exception:', err);
  if (browser) {
    browser.close().catch(() => {});
  }
  process.exit(1);
});
