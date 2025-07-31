import { test, expect } from '@playwright/test';

test.describe('Skill Tree Game Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the dashboard to load
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
  });

  test('Should display skill tree with correct structure', async ({ page }) => {
    // Check that skill tree container is visible
    await expect(page.locator('[class*="treeArea"]')).toBeVisible();
    
    // Check that skill nodes are rendered (using the actual CSS class)
    const skillNodes = page.locator('[class*="node"]');
    await expect(skillNodes.first()).toBeVisible();
    
    // Check that connections SVG is present
    await expect(page.locator('svg[class*="connections"]')).toBeVisible();
  });

  test('Should show correct initial state for Tier 1 skills', async ({ page }) => {
    // Tier 1 skills should be available (not locked)
    // Look for skills by their display name since we don't have data attributes
    const culturalMapping = page.locator('text=Cultural Asset Mapping').locator('..');
    const clientDiscovery = page.locator('text=Client Discovery').locator('..');
    const descriptivePrompting = page.locator('text=Descriptive Prompting').locator('..');
    const codeImplementation = page.locator('text=Code Implementation').locator('..');
    
    // These should be available (have available class or not have locked class)
    await expect(culturalMapping).not.toHaveClass(/locked/);
    await expect(clientDiscovery).not.toHaveClass(/locked/);
    await expect(descriptivePrompting).not.toHaveClass(/locked/);
    await expect(codeImplementation).not.toHaveClass(/locked/);
  });

  test('Should show locked state for Tier 2 and 3 skills initially', async ({ page }) => {
    // Tier 2 skills should be locked initially
    const projectScoping = page.locator('text=Project Scoping').locator('..');
    const iterativeRefinement = page.locator('text=Iterative Refinement').locator('..');
    
    // These should be locked (have locked class or show lock icon)
    await expect(projectScoping).toHaveClass(/locked/);
    await expect(iterativeRefinement).toHaveClass(/locked/);
  });

  test('Should display student progress information', async ({ page }) => {
    // Check level display
    await expect(page.locator('text=Level')).toBeVisible();
    
    // Check XP display
    await expect(page.locator('text=XP')).toBeVisible();
    
    // Check Website Power display
    await expect(page.locator('text=Website Power')).toBeVisible();
    
    // Check XP bar
    await expect(page.locator('[class*="xpBar"]')).toBeVisible();
  });

  test('Should open documentation modal when clicking available skill', async ({ page }) => {
    // Click on an available Tier 1 skill
    const skillNode = page.locator('text=Cultural Asset Mapping').locator('..');
    await skillNode.click();
    
    // Check that modal opens
    await expect(page.locator('[class*="modal"]')).toBeVisible();
    
    // Check modal content
    await expect(page.locator('text=Cultural Asset Mapping')).toBeVisible();
    await expect(page.locator('text=Submit Evidence')).toBeVisible();
  });

  test('Should show skill details on hover', async ({ page }) => {
    // Hover over a skill node
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.hover();
    
    // Check for tooltip or expanded information
    await expect(page.locator('text=Discover how your unique perspective shapes web design')).toBeVisible();
  });

  test('Should display website preview section', async ({ page }) => {
    // Check that website preview is visible
    await expect(page.locator('[class*="previewSection"]')).toBeVisible();
    
    // Check for browser frame simulation
    await expect(page.locator('[class*="browserFrame"]')).toBeVisible();
    
    // Check for power score display
    await expect(page.locator('text=Website Power')).toBeVisible();
  });

  test('Should handle evidence submission form validation', async ({ page }) => {
    // Open a skill modal
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Try submitting without evidence
    const submitButton = page.locator('button:has-text("Submit Evidence")');
    await submitButton.click();
    
    // Should show validation error or prevent submission
    // This test will depend on the actual validation implementation
  });

  test('Should show correct skill tree statistics', async ({ page }) => {
    // Check that stats are displayed correctly
    const levelText = page.locator('[class*="stat"]:has-text("Level:")');
    const xpText = page.locator('[class*="stat"]:has-text("XP:")');
    const powerText = page.locator('[class*="stat"]:has-text("Website Power:")');
    
    await expect(levelText).toBeVisible();
    await expect(xpText).toBeVisible();
    await expect(powerText).toBeVisible();
    
    // Check initial values
    await expect(levelText).toContainText('1');
    await expect(xpText).toContainText('0');
    await expect(powerText).toContainText('0');
  });

  test('Should respond to skill interactions', async ({ page }) => {
    // Test clicking on different skill states
    const availableSkill = page.locator('[data-skill-id="cultural_mapping"]').first();
    const lockedSkill = page.locator('[data-skill-id="project_scoping"]').first();
    
    // Available skill should open modal
    await availableSkill.click();
    await expect(page.locator('[class*="modal"]')).toBeVisible();
    
    // Close modal
    await page.locator('button:has-text("Close")').click();
    
    // Locked skill should not open modal or show different behavior
    await lockedSkill.click();
    // Modal should not appear again
    await expect(page.locator('[class*="modal"]')).not.toBeVisible();
  });
});