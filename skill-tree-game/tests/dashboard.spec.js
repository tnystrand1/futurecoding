import { test, expect } from '@playwright/test';

test.describe('Dashboard Basic Tests', () => {
  
  test('Student Dashboard loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
    
    // Check main dashboard container
    await expect(page.locator('[class*="dashboard"]')).toBeVisible();
    
    // Check skill tree section
    await expect(page.locator('[class*="skillTreeSection"]')).toBeVisible();
    
    // Check website preview section  
    await expect(page.locator('[class*="previewSection"]')).toBeVisible();
  });

  test('Navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to default student
    await expect(page).toHaveURL(/\/student\/sample_student/);
    
    // Should show student name in heading
    await expect(page.locator('h1')).toContainText('sample student');
  });

  test('Loading state handles correctly', async ({ page }) => {
    await page.goto('/');
    
    // Page should eventually load (not show loading spinner indefinitely)
    await expect(page.locator('[class*="dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Should not show error state
    await expect(page.locator('[class*="error"]')).not.toBeVisible();
  });
});
