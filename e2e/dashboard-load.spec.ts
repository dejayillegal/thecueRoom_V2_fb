
import { test, expect } from '@playwright/test';

test('dashboard loads within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  await page.waitForSelector('h2:has-text("Verification Pending")');
  const loadTime = Date.now() - startTime;
  
  console.log(`Dashboard load time: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(5000); // 5s threshold
});
