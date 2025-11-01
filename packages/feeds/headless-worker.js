
// THIS FILE IS SERVER-ONLY. Invoked via child_process.fork() only.
// Never imported directly by Next.js bundles.

const { chromium } = require('playwright');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browser;
}

process.on('message', async (msg) => {
  try {
    if (!msg || !msg.url) {
      return process.send({ id: msg?.id, ok: false, error: 'no url provided' });
    }

    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    await page.setUserAgent(process.env.FEED_USER_AGENT || 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36');
    await page.setViewportSize({ width: 1280, height: 720 });
    
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
      id: msg.id, 
      ok: true, 
      html,
      elements: elements.length > 0 ? elements : undefined
    });

  } catch (err) {
    process.send({ 
      id: msg.id, 
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
