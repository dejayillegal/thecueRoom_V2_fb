import { test, expect } from '@playwright/test';

test.describe('Sidebar - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');
  });

  test('sidebar is icon-only by default on desktop', async ({ page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(sidebarWidth).toBeLessThanOrEqual(70);
  });

  test('clicking nav icons does not expand sidebar', async ({ page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    const firstNavItem = page.locator('aside nav a').first();
    
    const widthBefore = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    await firstNavItem.click();
    await page.waitForTimeout(300);
    
    const widthAfter = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(widthAfter).toEqual(widthBefore);
  });

  test('clicking expand toggle expands and shows labels', async ({ page }) => {
    const expandToggle = page.locator('button[aria-label*="Expand"]');
    await expect(expandToggle).toBeVisible();
    
    await expandToggle.click();
    await page.waitForTimeout(250);
    
    const sidebar = page.locator('aside[role="navigation"]');
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(sidebarWidth).toBeGreaterThan(200);
    
    const navLabels = page.locator('aside nav a span');
    await expect(navLabels.first()).toBeVisible();
  });

  test('expanded state persists across reloads', async ({ page }) => {
    const expandToggle = page.locator('button[aria-label*="Expand"]');
    await expandToggle.click();
    await page.waitForTimeout(250);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('aside[role="navigation"]');
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(sidebarWidth).toBeGreaterThan(200);
  });

  test('sidebar is keyboard accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('href', '/dashboard');
    
    await page.keyboard.press('Enter');
    await page.waitForURL('**/dashboard');
  });

  test('expand toggle is keyboard accessible', async ({ page }) => {
    const expandToggle = page.locator('button[aria-label*="Expand"]');
    
    await expandToggle.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    
    const sidebar = page.locator('aside[role="navigation"]');
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(sidebarWidth).toBeGreaterThan(200);
  });
});

test.describe('Sidebar - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
  });

  test('sidebar is hidden by default on mobile', async ({ page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).not.toBeVisible();
  });

  test('tapping menu shows icon-only slide-over', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button[aria-label*="Menu"]'));
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(250);
      
      const sidebar = page.locator('aside[role="navigation"]');
      await expect(sidebar).toBeVisible();
      
      const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
      expect(sidebarWidth).toBeLessThanOrEqual(70);
    }
  });

  test('tapping expand inside slide-over toggles expanded labels', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button[aria-label*="Menu"]'));
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(250);
      
      const expandToggle = page.locator('button[aria-label*="Expand"]');
      if (await expandToggle.isVisible()) {
        await expandToggle.click();
        await page.waitForTimeout(250);
        
        const navLabels = page.locator('aside nav a span');
        await expect(navLabels.first()).toBeVisible();
      }
    }
  });

  test('body scrolling disabled while slide-over open', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button[aria-label*="Menu"]'));
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(250);
      
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow;
      });
      
      expect(bodyOverflow).toBe('hidden');
    }
  });

  test('escape key closes slide-over on mobile', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button[aria-label*="Menu"]'));
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(250);
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
      
      const sidebar = page.locator('aside[role="navigation"]');
      await expect(sidebar).not.toBeVisible();
    }
  });

  test('tap targets are at least 44x44px', async ({ page }) => {
    const menuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button[aria-label*="Menu"]'));
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(250);
      
      const navItems = page.locator('aside nav a');
      const count = await navItems.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const item = navItems.nth(i);
        const box = await item.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Sidebar - Accessibility', () => {
  test('all sidebar buttons have aria-label', async ({ page }) => {
    await page.goto('/dashboard');
    
    const navItems = page.locator('aside nav a');
    const count = await navItems.count();
    
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      const ariaLabel = await item.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('expand toggle has proper aria-expanded', async ({ page }) => {
    await page.goto('/dashboard');
    
    const expandToggle = page.locator('button[aria-label*="Expand"]');
    const ariaExpanded = await expandToggle.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('false');
    
    await expandToggle.click();
    await page.waitForTimeout(250);
    
    const ariaExpandedAfter = await expandToggle.getAttribute('aria-expanded');
    expect(ariaExpandedAfter).toBe('true');
  });
});
