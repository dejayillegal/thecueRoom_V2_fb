
import { test, expect } from '@playwright/test';

test('forum scroll works without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/community/forum');
  await page.waitForLoadState('networkidle');
  
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(500);
  
  expect(errors.length).toBe(0);
});
