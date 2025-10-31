
import { test, expect } from '@playwright/test';

test.describe('Signup Flow E2E', () => {
  test('should complete signup with verification in TEST_MODE', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Open signup modal
    await page.click('button:has-text("Sign Up")');

    // Wait for modal
    await expect(page.locator('text=Join thecueRoom')).toBeVisible();

    // Fill form
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#artistName', 'DJ Test Phoenix');
    
    // Wait for availability check
    await expect(page.locator('[id="artistName-status"] svg')).toBeVisible({ timeout: 5000 });

    await page.fill('#email', `test${Date.now()}@example.com`);
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    await page.fill('#region', 'EU — Berlin');
    await page.fill('#genre', 'Techno, Minimal');

    // Wait for all checks to complete
    await page.waitForTimeout(1000);

    // Submit form
    await page.click('button:has-text("Register")');

    // Verification modal should appear
    await expect(page.locator('text=Account Verification')).toBeVisible({ timeout: 5000 });

    // In TEST_MODE, should complete quickly
    await expect(page.locator('text=Verified!')).toBeVisible({ timeout: 15000 });

    // Should have button to dashboard
    await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
  });

  test('should show availability indicators', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign Up")');

    // Fill artist name
    await page.fill('#artistName', 'Unique Artist Name 12345');
    
    // Should show checking state
    await expect(page.locator('[id="artistName-status"] svg.animate-spin')).toBeVisible({ timeout: 2000 });

    // Should show available (green check) or taken (red X)
    await expect(page.locator('[id="artistName-status"] svg')).toBeVisible({ timeout: 5000 });
  });
});
import { test, expect } from '@playwright/test';

test.describe('Signup Flow E2E', () => {
  test('should complete signup with verification in TEST_MODE', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Open signup modal
    await page.click('button:has-text("Sign Up")');

    // Wait for modal
    await expect(page.locator('text=Join thecueRoom')).toBeVisible();

    // Fill form
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#artistName', 'DJ Test Phoenix');
    
    // Wait for availability check
    await expect(page.locator('[id="artistName-status"] svg')).toBeVisible({ timeout: 5000 });

    await page.fill('#email', `test${Date.now()}@example.com`);
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    await page.fill('#region', 'EU — Berlin');
    await page.fill('#genre', 'Techno, Minimal');

    // Wait for all checks to complete
    await page.waitForTimeout(1000);

    // Submit form
    await page.click('button:has-text("Register")');

    // Verification modal should appear
    await expect(page.locator('text=Account Verification')).toBeVisible({ timeout: 5000 });

    // In TEST_MODE, should complete quickly
    await expect(page.locator('text=Verified!')).toBeVisible({ timeout: 15000 });

    // Should have button to dashboard
    await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
  });
});
