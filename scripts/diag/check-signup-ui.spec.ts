
import { test, expect } from '@playwright/test';

test.describe('Signup UI with Artist Checkbox', () => {
  test('should show artist fields when checkbox is checked', async ({ page }) => {
    await page.goto('http://0.0.0.0:5000');
    
    // Open signup modal
    await page.click('button:has-text("Sign Up")');
    
    // Wait for modal
    await expect(page.locator('text=Join thecueRoom')).toBeVisible();
    
    // Artist checkbox should be present
    const artistCheckbox = page.locator('#artist-checkbox');
    await expect(artistCheckbox).toBeVisible();
    
    // Artist fields should be hidden initially
    await expect(page.locator('#artistName')).not.toBeVisible();
    await expect(page.locator('#socialProfileUrl')).not.toBeVisible();
    
    // Check artist checkbox
    await artistCheckbox.click();
    
    // Artist fields should now be visible
    await expect(page.locator('#artistName')).toBeVisible();
    await expect(page.locator('#socialProfileUrl')).toBeVisible();
    await expect(page.locator('#region')).toBeVisible();
    await expect(page.locator('#genre')).toBeVisible();
    
    // Info message should be visible
    await expect(page.locator('text=Artist signups start an AI verification job')).toBeVisible();
  });

  test('should validate artist fields and show availability status', async ({ page }) => {
    await page.goto('http://0.0.0.0:5000');
    await page.click('button:has-text("Sign Up")');
    
    await page.locator('#artist-checkbox').click();
    
    // Fill artist name
    await page.fill('#artistName', 'Test DJ Artist');
    
    // Wait for availability check
    await expect(page.locator('#artistName-status svg')).toBeVisible({ timeout: 5000 });
    
    // Fill other fields
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Artist');
    await page.fill('#email', `test${Date.now()}@example.com`);
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    await page.fill('#socialProfileUrl', 'https://soundcloud.com/test-artist');
    await page.fill('#region', 'London, UK');
    await page.fill('#genre', 'Techno');
    
    // Submit button should change text for artists
    await expect(page.locator('button:has-text("Sign Up as Artist")')).toBeVisible();
  });
});
