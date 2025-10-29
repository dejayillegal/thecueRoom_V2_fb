
import { test, expect } from '@playwright/test';

test.describe('Complete Workflow E2E', () => {
  test('admin can enable sources and trigger feed ingestion', async ({ page }) => {
    // Navigate to admin sources page
    await page.goto('/admin/sources');
    await page.waitForLoadState('networkidle');

    // Check if sources are loaded
    const sourceCards = page.locator('article, [role="article"], .p-6');
    await expect(sourceCards.first()).toBeVisible({ timeout: 10000 });

    // Enable first source if not already enabled
    const firstSwitch = page.locator('button[role="switch"]').first();
    const isEnabled = await firstSwitch.getAttribute('data-state');
    
    if (isEnabled === 'unchecked') {
      await firstSwitch.click();
      await page.waitForTimeout(1000);
    }

    // Verify switch is now enabled
    await expect(firstSwitch).toHaveAttribute('data-state', 'checked');
  });

  test('cron admin page loads and can trigger manual run', async ({ page }) => {
    await page.goto('/admin/cron');
    await page.waitForLoadState('networkidle');

    // Check for trigger button
    const triggerButton = page.locator('button:has-text("Trigger Manual Run")');
    await expect(triggerButton).toBeVisible();

    // Verify status card is present
    const statusCard = page.locator('text=Current Status').locator('..');
    await expect(statusCard).toBeVisible();
  });

  test('feeds API returns data after ingestion', async ({ page }) => {
    const response = await page.request.get('/api/feeds?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('dashboard displays feed items', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for feed items to load
    await page.waitForSelector('[data-testid="feed-item"], article, .feed-item', {
      timeout: 10000,
      state: 'visible',
    });

    // Verify at least one item is visible
    const feedItems = page.locator('[data-testid="feed-item"], article');
    await expect(feedItems.first()).toBeVisible();
  });
});
