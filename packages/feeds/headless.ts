import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;

export interface HeadlessOptions {
  selector: string;
  timeout?: number;
  waitForSelector?: string;
}

export interface HeadlessResult {
  ok: boolean;
  html?: string;
  elements?: string[];
  error?: string;
}

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function renderWithPlaywright(
  url: string,
  options: HeadlessOptions
): Promise<HeadlessResult> {
  const { selector, timeout = 10000, waitForSelector } = options;

  if (!process.env.PLAYWRIGHT_ENABLED || process.env.PLAYWRIGHT_ENABLED === 'false') {
    return {
      ok: false,
      error: 'Playwright is disabled (PLAYWRIGHT_ENABLED=false)'
    };
  }

  let page: Page | null = null;

  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();

    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout 
    });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    } else {
      await page.waitForTimeout(2000);
    }

    const elements = await page.$$(selector);
    const elementTexts: string[] = [];

    for (const element of elements) {
      const outerHTML = await element.evaluate(el => el.outerHTML);
      elementTexts.push(outerHTML);
    }

    const html = await page.content();

    return {
      ok: true,
      html,
      elements: elementTexts
    };

  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Playwright rendering failed'
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

process.on('SIGINT', () => {
  closeBrowser().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  closeBrowser().then(() => process.exit(0));
});
