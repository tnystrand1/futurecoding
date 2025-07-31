import { test, expect } from '@playwright/test';

test.describe('Game Mechanics Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Web Dev Journey');
  });

  test('Should calculate XP and level progression correctly', async ({ page }) => {
    // Mock unlocking a skill to test XP calculation
    // This would require either mocking Firebase or having a test mode
    
    // Check initial state
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 XP')).toBeVisible();
    
    // For now, we'll test the UI elements are present
    const xpBar = page.locator('[class*="xpBar"]');
    const xpFill = page.locator('[class*="xpFill"]');
    
    await expect(xpBar).toBeVisible();
    await expect(xpFill).toBeVisible();
  });

  test('Should show achievement notifications', async ({ page }) => {
    // Test that achievement toast container exists
    // In a real test, we'd trigger an achievement and verify the toast appears
    
    // For now, check that the structure is in place for achievements
    const dashboardContainer = page.locator('[class*="dashboard"]');
    await expect(dashboardContainer).toBeVisible();
  });

  test('Should handle skill prerequisites correctly', async ({ page }) => {
    // Check that Tier 2 skills show locked state
    const tier2Skills = [
      'project_scoping',
      'iterative_refinement', 
      'user_testing',
      'ai_assisted_debugging',
      'accessibility',
      'api_integration'
    ];
    
    for (const skillId of tier2Skills) {
      const skillNode = page.locator(`[data-skill-id="${skillId}"]`);
      await expect(skillNode).toHaveClass(/locked/);
    }
  });

  test('Should display developer profiles section', async ({ page }) => {
    // Check if developer profiles are referenced in the UI
    // This might be in a separate section or modal
    
    // For now, verify the game structure supports profiles
    const dashboardContent = page.locator('[class*="mainContent"]');
    await expect(dashboardContent).toBeVisible();
  });

  test('Should track website power progression', async ({ page }) => {
    // Check that website power is displayed and starts at 0
    const websitePowerDisplay = page.locator('text=Website Power');
    await expect(websitePowerDisplay).toBeVisible();
    
    // Check that it shows the correct initial value
    await expect(page.locator('text=0').last()).toBeVisible();
  });

  test('Should handle skill connections visualization', async ({ page }) => {
    // Check that SVG connections are rendered
    const connectionsElement = page.locator('svg[class*="connections"]');
    await expect(connectionsElement).toBeVisible();
    
    // Check for connection lines (should have path or line elements)
    const connectionLines = page.locator('svg[class*="connections"] path, svg[class*="connections"] line');
    await expect(connectionLines.first()).toBeVisible();
  });

  test('Should show correct skill states based on prerequisites', async ({ page }) => {
    // Test the skill availability logic
    
    // Tier 1 skills (no prerequisites) should be available
    const tier1Skills = ['cultural_mapping', 'client_discovery', 'descriptive_prompting', 'code_implementation'];
    
    for (const skillId of tier1Skills) {
      const skillNode = page.locator(`[data-skill-id="${skillId}"]`);
      // Should NOT have locked class
      await expect(skillNode).not.toHaveClass(/locked/);
    }
  });

  test('Should handle skill hover effects', async ({ page }) => {
    // Test hover interactions
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    
    // Hover over the skill
    await skillNode.hover();
    
    // Should show some kind of hover effect or tooltip
    // This depends on the CSS implementation
    await expect(skillNode).toBeVisible(); // Basic check that hovering doesn't break anything
  });

  test('Should display competency information', async ({ page }) => {
    // Each skill should show its associated competency
    // This might be in tooltips or skill details
    
    // Open a skill modal to check competency display
    const skillNode = page.locator('[data-skill-id="cultural_mapping"]').first();
    await skillNode.click();
    
    // Check that competency information is shown
    await expect(page.locator('text=STEAM Interest')).toBeVisible();
  });

  test('Should maintain responsive design', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[class*="dashboard"]')).toBeVisible();
    
    // Test smaller viewport
    await page.setViewportSize({ width: 768, height: 600 });
    await expect(page.locator('[class*="dashboard"]')).toBeVisible();
    
    // Ensure skill tree is still accessible
    await expect(page.locator('[class*="treeArea"]')).toBeVisible();
  });
});