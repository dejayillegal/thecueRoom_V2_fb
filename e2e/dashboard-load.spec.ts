import { test, expect } from '@playwright/test';

test('dashboard loads within 5 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');

  await expect(page.locator('h1, [data-testid="hero"]')).toBeVisible({ timeout: 5000 });

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000);
});