/**
 * Tree Creation E2E Tests
 * Tests for creating and managing family trees
 */

import { test, expect } from '@playwright/test';

test.describe('Tree Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tree creation page
    await page.goto('/en/tree/new');
  });

  test('should show tree creation form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create|new tree/i })).toBeVisible();
  });

  test('should have name fields for Arabic and English', async ({ page }) => {
    // Check for bilingual name inputs
    const arabicNameField = page.getByLabel(/arabic|الاسم/i);
    const englishNameField = page.getByLabel(/english|name/i);

    await expect(arabicNameField.or(page.getByPlaceholder(/arabic/i))).toBeVisible();
    await expect(englishNameField.or(page.getByPlaceholder(/english/i))).toBeVisible();
  });

  test('should validate required tree name', async ({ page }) => {
    // Try to submit without name
    const submitButton = page.getByRole('button', { name: /create|save|إنشاء/i });

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation error
      await expect(page.getByText(/required|مطلوب/i)).toBeVisible();
    }
  });

  test('should have description field', async ({ page }) => {
    const descriptionField = page.getByLabel(/description|وصف/i);
    await expect(descriptionField.or(page.getByPlaceholder(/description/i))).toBeVisible();
  });
});

test.describe('Tree Creation - Arabic', () => {
  test('should show tree creation form in Arabic', async ({ page }) => {
    await page.goto('/ar/tree/new');

    // Check RTL
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Check for Arabic text
    await expect(page.getByText(/شجرة|إنشاء/)).toBeVisible();
  });
});
