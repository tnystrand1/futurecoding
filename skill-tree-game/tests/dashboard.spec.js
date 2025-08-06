import { test, expect } from '@playwright/test';

test.describe('Dashboard Basic Tests', () => {
  
  test('Modern Dashboard loads correctly', async ({ page }) => {
    await page.goto('/modern/sample_student');
    
    // Check main heading (modern dashboard title)
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
    
    // Check main dashboard elements
    await expect(page.locator('main')).toBeVisible();
    
    // Check skill tree section (modern skill tree)
    await expect(page.locator('text=Skill Development Path')).toBeVisible();
    
    // Check that we have the modern skill tree with SVG connections
    await expect(page.locator('svg[viewBox="0 0 1000 700"]')).toBeVisible();
  });

  test('Traditional Dashboard loads correctly', async ({ page }) => {
    await page.goto('/student/sample_student');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
    
    // Check main dashboard container
    await expect(page.locator('[class*="dashboard"]')).toBeVisible();
    
    // Check skill tree section
    await expect(page.locator('[class*="skillTreeSection"]')).toBeVisible();
    
    // Check website preview section  
    await expect(page.locator('[class*="previewSection"]')).toBeVisible();
  });

  test('Civ Dashboard loads correctly', async ({ page }) => {
    await page.goto('/civ/sample_student');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('DEVELOPMENT RESEARCH');
    
    // Check main dashboard container
    await expect(page.locator('[class*="dashboard"]')).toBeVisible();
  });

  test('Navigation redirects correctly', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to civ dashboard by default (feature flag is false)
    await expect(page).toHaveURL(/\/civ\/sample_student/);
    
    // Should show student name in heading
    await expect(page.locator('h1')).toContainText('SAMPLE STUDENT');
  });

  test('Loading state handles correctly', async ({ page }) => {
    await page.goto('/modern/sample_student');
    
    // Page should eventually load (not show loading spinner indefinitely)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    
    // Should not show error state
    await expect(page.locator('[class*="error"]')).not.toBeVisible();
  });
});
