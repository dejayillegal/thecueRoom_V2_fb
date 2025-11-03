
import { test, expect } from '@playwright/test';

test.describe('Artist Signup Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Open signup modal (assuming there's a Sign Up button)
    await page.click('button:has-text("Sign Up")');
    await expect(page.locator('text=Welcome to thecueRoom')).toBeVisible();
    
    // Switch to Sign Up tab
    await page.click('button[role="tab"]:has-text("Sign Up")');
  });

  test('should display Artist checkbox and toggle fields', async ({ page }) => {
    // Artist checkbox should be visible
    const artistCheckbox = page.locator('#artist-checkbox');
    await expect(artistCheckbox).toBeVisible();
    
    // Artist fields should not be visible initially
    await expect(page.locator('#artistName')).not.toBeVisible();
    
    // Check the Artist checkbox
    await artistCheckbox.click();
    
    // Artist fields should now be visible
    await expect(page.locator('#artistName')).toBeVisible();
    await expect(page.locator('#region')).toBeVisible();
    await expect(page.locator('#primaryGenre')).toBeVisible();
    await expect(page.locator('#publicProfileUrl')).toBeVisible();
    await expect(page.locator('#musicPlatformLink')).toBeVisible();
  });

  test('should complete Artist signup with all required fields', async ({ page }) => {
    // Check Artist checkbox
    await page.click('#artist-checkbox');
    
    // Fill common fields
    await page.fill('#displayName', 'Test Artist User');
    await page.fill('#bio', 'Electronic music producer');
    
    // Fill artist fields
    await page.fill('#artistName', `TestArtist${Date.now()}`);
    
    // Wait for availability check
    await expect(page.locator('#artistName-status svg[aria-label="Available"]')).toBeVisible({ timeout: 5000 });
    
    // Select region
    await page.click('#region');
    await page.click('text=Berlin, EU');
    
    await page.fill('#primaryGenre', 'Techno, Minimal');
    await page.fill('#publicProfileUrl', 'https://soundcloud.com/testartist');
    await page.fill('#musicPlatformLink', 'https://soundcloud.com/testartist/tracks');
    
    // Fill email and password
    await page.fill('#signup-email', `artist${Date.now()}@example.test`);
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    // Wait for email availability
    await expect(page.locator('#email-status svg[aria-label="Available"]')).toBeVisible({ timeout: 5000 });
    
    // Submit form
    const submitButton = page.locator('button:has-text("Sign Up as Artist")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Should show success or verification message
    await expect(page.locator('text=/verification in progress|account created/i')).toBeVisible({ timeout: 10000 });
  });

  test('should manage social links (add and remove)', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Should start with 1 social link input
    const initialLinks = await page.locator('input[placeholder*="instagram.com"]').count();
    expect(initialLinks).toBe(1);
    
    // Add 4 more links (total 5)
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("Add Link")');
    }
    
    const maxLinks = await page.locator('input[placeholder*="instagram.com"]').count();
    expect(maxLinks).toBe(5);
    
    // Add button should not be visible anymore
    await expect(page.locator('button:has-text("Add Link")')).not.toBeVisible();
    
    // Remove a link
    const removeButtons = page.locator('button[aria-label*="Remove social link"]');
    await removeButtons.first().click();
    
    const afterRemove = await page.locator('input[placeholder*="instagram.com"]').count();
    expect(afterRemove).toBe(4);
    
    // Add button should be visible again
    await expect(page.locator('button:has-text("Add Link")')).toBeVisible();
  });

  test('should validate music platform URL restrictions', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Fill required fields
    await page.fill('#displayName', 'Test User');
    await page.fill('#artistName', 'TestArtist123');
    await page.fill('#primaryGenre', 'Techno');
    
    // Invalid music platform URL
    await page.fill('#musicPlatformLink', 'https://example.com/profile');
    
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    // Try to submit
    await page.click('button:has-text("Sign Up as Artist")');
    
    // Should show validation error
    await expect(page.locator('text=/valid music platform link/i')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab'); // Display Name
    await page.keyboard.press('Tab'); // Bio
    await page.keyboard.press('Tab'); // Artist checkbox
    
    // Check Artist checkbox with Space
    await page.keyboard.press('Space');
    
    // Artist fields should appear
    await expect(page.locator('#artistName')).toBeVisible();
    
    // Continue tabbing through artist fields
    await page.keyboard.press('Tab'); // Artist Name
    await page.keyboard.type('TestArtist');
    
    await page.keyboard.press('Tab'); // Region select
    await page.keyboard.press('Enter'); // Open select
    await page.keyboard.press('ArrowDown'); // Navigate options
    await page.keyboard.press('Enter'); // Select option
  });

  test('should show "Other" region input when selected', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Select region dropdown
    await page.click('#region');
    
    // Select "Other"
    await page.click('text=Other');
    
    // Custom region input should appear
    await expect(page.locator('#customRegion')).toBeVisible();
    await expect(page.locator('#customRegion')).toHaveAttribute('required');
  });

  test('should disable submit during submission', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Fill all required fields quickly
    await page.fill('#displayName', 'Test User');
    await page.fill('#artistName', 'TestArtist');
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#password', 'SecurePass123!');
    await page.fill('#confirmPassword', 'SecurePass123!');
    
    const submitButton = page.locator('button:has-text("Sign Up as Artist")');
    
    // Click submit
    await submitButton.click();
    
    // Button should be disabled and show loading state
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('text=/creating artist account/i')).toBeVisible();
  });

  test('should show inline error messages for invalid fields', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Fill with invalid data
    await page.fill('#artistName', 'T'); // Too short
    await page.fill('#primaryGenre', 'A'); // Too short
    await page.fill('#publicProfileUrl', 'not-a-url'); // Invalid URL
    
    // Try to submit
    await page.click('button:has-text("Sign Up as Artist")');
    
    // Should show field-level errors
    await expect(page.locator('text=/artist name must be at least 2 characters/i')).toBeVisible();
  });

  test('should maintain accessibility attributes', async ({ page }) => {
    await page.click('#artist-checkbox');
    
    // Check aria attributes
    const artistNameInput = page.locator('#artistName');
    await expect(artistNameInput).toHaveAttribute('aria-required', 'true');
    await expect(artistNameInput).toHaveAttribute('aria-describedby');
    
    const regionSelect = page.locator('#region');
    await expect(regionSelect).toHaveAttribute('aria-invalid', 'false');
    
    // After triggering validation error
    await page.fill('#artistName', 'T');
    await page.click('button:has-text("Sign Up as Artist")');
    
    await expect(artistNameInput).toHaveAttribute('aria-invalid', 'true');
  });
});
