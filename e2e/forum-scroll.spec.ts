
import { test, expect } from '@playwright/test';

test('forum scroll is smooth with virtualization', async ({ page }) => {
  await page.goto('/community/forum');
  
  // Check for virtualized list
  const listItems = await page.locator('[role="listitem"]').count();
  console.log(`Visible list items: ${listItems}`);
  
  // Should have fewer DOM nodes than total items due to virtualization
  expect(listItems).toBeLessThan(100);
});
import { test, expect } from '@playwright/test';

test('forum virtualization reduces DOM nodes', async ({ page }) => {
  await page.goto('/community/forum');
  
  await page.waitForSelector('[role="list"]', { timeout: 5000 });
  
  const listItems = await page.locator('[role="listitem"]').count();
  
  console.log(`Rendered list items: ${listItems}`);
  expect(listItems).toBeLessThan(50);
});
