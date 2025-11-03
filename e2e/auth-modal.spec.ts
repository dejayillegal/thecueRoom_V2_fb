
import { test, expect } from '@playwright/test';

test.describe('AuthModal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Trigger auth modal - adjust selector based on your app
    await page.click('[data-testid="open-auth-modal"]');
  });

  test('opens and displays sign in form', async ({ page }) => {
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder(/name@artist.com/i)).toBeVisible();
  });

  test('switches to sign up tab', async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    await expect(page.getByText(/Create your account/i)).toBeVisible();
  });

  test('artist checkbox toggles artist fields', async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    
    // Check artist checkbox
    await page.click('input[id="artist-checkbox"]');
    
    // Verify artist fields appear
    await expect(page.getByLabel(/Artist Name/i)).toBeVisible();
    await expect(page.getByLabel(/Primary Genre/i)).toBeVisible();
    await expect(page.getByLabel(/City \/ Region/i)).toBeVisible();
    await expect(page.getByLabel(/Portfolio \/ Music Links/i)).toBeVisible();
    
    // Uncheck and verify fields disappear
    await page.click('input[id="artist-checkbox"]');
    await expect(page.getByLabel(/Artist Name/i)).not.toBeVisible();
  });

  test('validates artist signup form', async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    await page.click('input[id="artist-checkbox"]');
    
    // Fill out form
    await page.fill('input[id="firstName"]', 'John');
    await page.fill('input[id="lastName"]', 'Doe');
    await page.fill('input[id="artistName"]', 'DJ Test');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'TestPass123!');
    await page.fill('input[id="confirmPassword"]', 'TestPass123!');
    await page.fill('input[id="primaryGenre"]', 'Techno');
    await page.fill('input[id="cityRegion"]', 'Berlin, DE');
    await page.fill('input[id="portfolio"]', 'https://soundcloud.com/djtest');
    
    // Accept terms
    await page.click('input[id="agree-terms"]');
    
    // Intercept API call
    const responsePromise = page.waitForResponse('/api/auth/signup');
    
    await page.click('button:has-text("Create Artist Account")');
    
    const response = await responsePromise;
    const body = await response.json();
    
    // Verify payload includes artist fields
    expect(body).toHaveProperty('artist_name');
    expect(body).toHaveProperty('primary_genre');
    expect(body).toHaveProperty('region');
  });

  test('modal is keyboard accessible', async ({ page }) => {
    await page.click('button:has-text("Sign Up")');
    
    // Tab through fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Space on artist checkbox
    await page.keyboard.press('Space');
    
    // Verify artist fields appear
    await expect(page.getByLabel(/Artist Name/i)).toBeVisible();
    
    // ESC closes modal
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Create your account/i)).not.toBeVisible();
  });

  test('displays right rail on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.click('button:has-text("Sign Up")');
    
    await expect(page.getByText(/What's next/i)).toBeVisible();
    await expect(page.getByText(/Verification steps/i)).toBeVisible();
    await expect(page.getByText(/Community/i)).toBeVisible();
  });
});
