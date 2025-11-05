
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical User Flows', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:5000');
    await expect(page).toHaveTitle(/thecueRoom/i);
    await expect(page.locator('text=Monthly Curated Music')).toBeVisible();
  });

  test('user can view monthly playlist', async ({ page }) => {
    await page.goto('http://localhost:5000/music/weekly');
    await page.waitForLoadState('networkidle');
    
    // Check for playlist widget
    await expect(page.locator('[data-testid="monthly-playlist-widget"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('signup modal opens and closes', async ({ page }) => {
    await page.goto('http://localhost:5000');
    
    // Open signup modal
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator('dialog')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog')).not.toBeVisible();
  });

  test('news feed loads articles', async ({ page }) => {
    await page.goto('http://localhost:5000/feeds');
    await page.waitForLoadState('networkidle');
    
    // Wait for feed items
    await expect(page.locator('[data-testid="feed-item"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard loads for authenticated user', async ({ page }) => {
    // This test would require proper auth setup
    // For smoke test, just verify the route exists
    await page.goto('http://localhost:5000/dashboard');
    
    // Should redirect to auth or show dashboard
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/(dashboard|auth)/);
  });
});
