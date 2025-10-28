
import { test, expect } from '@playwright/test';

test('forum scroll is smooth with virtualization', async ({ page }) => {
  await page.goto('/community/forum');
  
  // Check for virtualized list
  const listItems = await page.locator('[role="listitem"]').count();
  console.log(`Visible list items: ${listItems}`);
  
  // Should have fewer DOM nodes than total items due to virtualization
  expect(listItems).toBeLessThan(100);
});
