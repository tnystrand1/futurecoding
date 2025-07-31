import { test, expect } from '@playwright/test';

test.describe('Documentation System Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
  });

  test('Should open documentation modal for available skills', async ({ page }) => {
    // Click on an available skill
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Modal should open
    await expect(page.locator('[class*="modal"]')).toBeVisible();
    
    // Should show skill information
    await expect(page.locator('text=Cultural Asset Mapping')).toBeVisible();
    await expect(page.locator('text=Discover how your unique perspective shapes web design')).toBeVisible();
  });

  test('Should display evidence submission form', async ({ page }) => {
    // Open skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Check form elements
    await expect(page.locator('textarea')).toBeVisible(); // Reflection textarea
    await expect(page.locator('input[type="file"]')).toBeVisible(); // File upload
    await expect(page.locator('button:has-text("Submit Evidence")')).toBeVisible();
  });

  test('Should show skill requirements and XP reward', async ({ page }) => {
    // Open skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Should show XP reward
    await expect(page.locator('text=50 XP')).toBeVisible();
    
    // Should show evidence requirements
    await expect(page.locator('text=reflection')).toBeVisible();
  });

  test('Should validate evidence submission requirements', async ({ page }) => {
    // Open skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Try to submit without required evidence
    const submitButton = page.locator('button:has-text("Submit Evidence")');
    await submitButton.click();
    
    // Should show validation message or prevent submission
    // Note: This test will need to be adjusted based on actual validation implementation
  });

  test('Should handle different evidence types', async ({ page }) => {
    // Test different skills that require different evidence types
    
    // Test code evidence requirement
    const codeSkillNode = page.locator('[data-skill-id="code_implementation"]').first();
    await codeSkillNode.click();
    
    // Should show code input area
    await expect(page.locator('textarea')).toBeVisible();
    
    // Close modal
    await page.locator('button:has-text("Close")').click();
    
    // Test AI chat evidence requirement
    const aiSkillNode = page.locator('[data-skill-id="descriptive_prompting"]').first();
    await aiSkillNode.click();
    
    // Should show AI chat log input
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Should display word count for reflections', async ({ page }) => {
    // Open skill modal that requires reflection
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Type in reflection textarea
    const reflectionArea = page.locator('textarea[placeholder*="reflection"], textarea[placeholder*="Reflection"]');
    await reflectionArea.fill('This is a test reflection that should be long enough to meet the minimum word count requirements for this skill.');
    
    // Should show word count
    await expect(page.locator('text=/\\d+ words/')).toBeVisible();
  });

  test('Should close modal when clicking close button', async ({ page }) => {
    // Open modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    await expect(page.locator('[class*="modal"]')).toBeVisible();
    
    // Click close button
    await page.locator('button:has-text("Close")').click();
    
    // Modal should close
    await expect(page.locator('[class*="modal"]')).not.toBeVisible();
  });

  test('Should close modal when clicking outside', async ({ page }) => {
    // Open modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    await expect(page.locator('[class*="modal"]')).toBeVisible();
    
    // Click outside modal (on backdrop)
    await page.locator('[class*="modalBackdrop"], [class*="modal-backdrop"]').click();
    
    // Modal should close
    await expect(page.locator('[class*="modal"]')).not.toBeVisible();
  });

  test('Should show skill prompt and guidance', async ({ page }) => {
    // Open skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Should display the skill prompt
    await expect(page.locator('text=How does your cultural background influence your design choices?')).toBeVisible();
  });

  test('Should handle file uploads for screenshot evidence', async ({ page }) => {
    // Open skill that requires screenshots
    const skillNode = page.locator('[data-skill-id="client_discovery"]').first();
    await skillNode.click();
    
    // Should have file upload input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Should accept image files
    await expect(fileInput).toHaveAttribute('accept', /image/);
  });

  test('Should display evidence templates and guidance', async ({ page }) => {
    // Open skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Should show guidance or templates for evidence submission
    // This could be placeholder text, help text, or example templates
    await expect(page.locator('textarea')).toHaveAttribute('placeholder');
  });
});