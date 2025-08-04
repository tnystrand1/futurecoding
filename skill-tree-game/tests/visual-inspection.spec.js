import { test, expect } from '@playwright/test';

test.describe('Visual Inspection of Modern Dashboard', () => {
  
  test('Navigate and inspect modern dashboard appearance', async ({ page }) => {
    // Navigate to the modern dashboard
    await page.goto('http://localhost:5173/modern/sample_student');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a full page screenshot to see the current state
    await page.screenshot({ 
      path: 'test-results/modern-dashboard-full.png', 
      fullPage: true 
    });
    
    // Check if the main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Log the page title and main heading text
    const title = await page.title();
    const heading = await page.locator('h1').textContent();
    console.log('Page title:', title);
    console.log('Main heading:', heading);
    
    // Check for error messages in console
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait a bit to capture any console errors
    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('Console errors found:', consoleMessages);
    }
    
    // Try to find and screenshot the skill tree area
    const skillTreeCard = page.locator('[class*="skill"]').first();
    if (await skillTreeCard.isVisible()) {
      await skillTreeCard.screenshot({ 
        path: 'test-results/skill-tree-area.png' 
      });
    }
    
    // Check if there are any visible skill nodes
    const skillNodes = page.locator('[class*="skill"]');
    const skillCount = await skillNodes.count();
    console.log('Number of skill-related elements:', skillCount);
    
    // Try to hover over elements to see what happens
    const firstCard = page.locator('.w-32.h-32').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/skill-hover-state.png' 
      });
    }
    
    // Check the component switcher
    const devTools = page.locator('text=🔧 Dev Tools');
    if (await devTools.isVisible()) {
      await devTools.screenshot({ path: 'test-results/dev-tools.png' });
    }
  });
  
  test('Compare all three dashboard versions', async ({ page }) => {
    // Test modern dashboard
    await page.goto('http://localhost:5173/modern/sample_student');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/modern-dashboard.png', 
      fullPage: true 
    });
    
    // Test civ dashboard
    await page.goto('http://localhost:5173/civ/sample_student');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/civ-dashboard.png', 
      fullPage: true 
    });
    
    // Test traditional dashboard
    await page.goto('http://localhost:5173/student/sample_student');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/traditional-dashboard.png', 
      fullPage: true 
    });
  });
  
  test('Try to interact with skill tree elements', async ({ page }) => {
    await page.goto('http://localhost:5173/modern/sample_student');
    await page.waitForLoadState('networkidle');
    
    // Look for clickable skill elements
    const skillElements = await page.locator('*').all();
    let clickableElements = [];
    
    for (let element of skillElements.slice(0, 20)) { // Check first 20 elements
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class') || '';
      const cursor = await element.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      
      if (cursor === 'pointer' || className.includes('cursor-pointer')) {
        clickableElements.push({
          tagName,
          className,
          text: await element.textContent()
        });
      }
    }
    
    console.log('Found clickable elements:', clickableElements);
    
    // Try to click on filters or controls
    const filterSelect = page.locator('select');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('1');
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/tier-filter-applied.png' 
      });
    }
    
    // Try zoom controls
    const zoomPlus = page.locator('button').filter({ hasText: '+' });
    if (await zoomPlus.isVisible()) {
      await zoomPlus.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/zoomed-in.png' 
      });
    }
  });
  
});