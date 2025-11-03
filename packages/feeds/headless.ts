// THIS MODULE IS SERVER-ONLY. Do not import in client code.

import { fork, ChildProcess } from 'child_process';
import path from 'path';
import pLimit from 'p-limit';

// Dynamic import to prevent bundling issues in Next.js client
let _playwright: any = null;

async function getPlaywright() {
  if (!_playwright) {
    _playwright = await import('playwright');
  }
  return _playwright;
}

export async function createBrowser() {
  const { chromium } = await getPlaywright();
  return await chromium.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
}


const PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED === 'true';
const WORKER_PATH = path.join(process.cwd(), 'packages/feeds/headless-worker.js');
const limit = pLimit(parseInt(process.env.PLAYWRIGHT_CONCURRENCY || '1', 10));

export interface HeadlessOptions {
  selector?: string;
  timeout?: number;
  waitForSelector?: string;
  waitForSelectorTimeout?: number;
  emulateMobile?: boolean;
  preferHeaders?: Record<string, string>;
}

export interface HeadlessResult {
  ok: boolean;
  html?: string;
  elements?: string[];
  statusCode?: number;
  error?: string;
}

export async function renderWithPlaywright(
  url: string,
  options: HeadlessOptions = {}
): Promise<HeadlessResult> {
  if (!PLAYWRIGHT_ENABLED) {
    return {
      ok: false,
      error: 'Playwright is disabled (PLAYWRIGHT_ENABLED=false)'
    };
  }

  return limit(async () => {
    return new Promise<HeadlessResult>((resolve) => {
      const child: ChildProcess = fork(WORKER_PATH, { 
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'] 
      });

      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timer = setTimeout(() => {
        child.kill();
        resolve({ ok: false, error: 'Worker timeout' });
      }, options.timeout || 30000);

      child.on('message', (msg: any) => {
        if (msg && msg.jobId === jobId) {
          clearTimeout(timer);
          child.kill();
          resolve({ 
            ok: msg.ok, 
            html: msg.html, 
            elements: msg.elements,
            statusCode: msg.statusCode,
            error: msg.error 
          });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        child.kill();
        resolve({ ok: false, error: err.message });
      });

      child.send({ 
        jobId, 
        url, 
        selector: options.selector,
        timeout: options.timeout,
        waitForSelector: options.waitForSelector,
        waitForSelectorTimeout: options.waitForSelectorTimeout,
        emulateMobile: options.emulateMobile,
        preferHeaders: options.preferHeaders
      });
    });
  });
}