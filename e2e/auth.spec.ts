/**
 * Authentication E2E Tests
 * Tests for user registration, login, and logout flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should show registration form', async ({ page }) => {
      await page.goto('/en/auth/register');

      await expect(page.getByRole('heading', { name: /register|sign up/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByLabel(/name/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/en/auth/register');

      await page.getByRole('button', { name: /register|sign up/i }).click();

      // Should show validation errors
      await expect(page.getByText(/required|email/i)).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/en/auth/register');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/password/i).fill('short');

      await page.getByRole('button', { name: /register|sign up/i }).click();

      // Should show password length error
      await expect(page.getByText(/12 characters|password/i)).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should show login form', async ({ page }) => {
      await page.goto('/en/auth/login');

      await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/en/auth/login');

      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');

      await page.getByRole('button', { name: /login|sign in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
    });

    test('should have link to registration', async ({ page }) => {
      await page.goto('/en/auth/login');

      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Arabic Language', () => {
    test('should show login form in Arabic', async ({ page }) => {
      await page.goto('/ar/auth/login');

      // Check for RTL direction
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');

      // Check for Arabic text
      await expect(page.getByText(/تسجيل الدخول|الدخول/)).toBeVisible();
    });

    test('should show registration form in Arabic', async ({ page }) => {
      await page.goto('/ar/auth/register');

      await expect(page.getByText(/حساب جديد|تسجيل/)).toBeVisible();
    });
  });
});
