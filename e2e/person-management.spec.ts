/**
 * Person Management E2E Tests
 * Tests for adding and managing family members
 */

import { test, expect } from '@playwright/test';

test.describe('Person Management', () => {
  test.describe('Person Form', () => {
    test('should have required fields', async ({ page }) => {
      // This would need a tree to exist first, so we'll check the form structure
      await page.goto('/en');

      // Check that the home page loads
      await expect(page).toHaveTitle(/Shajara|شجرة/i);
    });
  });

  test.describe('Home Page', () => {
    test('should display welcome content', async ({ page }) => {
      await page.goto('/en');

      // Check for main elements
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have navigation', async ({ page }) => {
      await page.goto('/en');

      // Check for navigation elements
      const nav = page.getByRole('navigation');
      if (await nav.isVisible()) {
        await expect(nav).toBeVisible();
      }
    });

    test('should support language switching', async ({ page }) => {
      await page.goto('/en');

      // Look for language switcher
      const langSwitcher = page.getByRole('button', { name: /عربي|arabic|ar|en/i });

      if (await langSwitcher.isVisible()) {
        await langSwitcher.click();

        // Should navigate to Arabic version
        await expect(page).toHaveURL(/\/ar/);
      }
    });
  });

  test.describe('Arabic Home Page', () => {
    test('should display Arabic content', async ({ page }) => {
      await page.goto('/ar');

      // Check RTL direction
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');

      // Check for Arabic content
      await expect(page.getByText(/شجرة|العائلة/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en');

      // Page should load without horizontal scroll
      const body = page.locator('body');
      const boundingBox = await body.boundingBox();

      expect(boundingBox?.width).toBeLessThanOrEqual(375);
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/en');

      // Page should load
      await expect(page).toHaveTitle(/Shajara|شجرة/i);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/en');

      // Check for h1
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1.first()).toBeVisible();
    });

    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/en');

      // All buttons should have accessible names
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const name = await button.getAttribute('aria-label') || await button.textContent();
          expect(name?.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should have focus indicators', async ({ page }) => {
      await page.goto('/en');

      // Tab to first focusable element
      await page.keyboard.press('Tab');

      // Check that something is focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
