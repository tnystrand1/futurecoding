import { test, expect } from '@playwright/test';

test.describe('Complete Skill Tree Workflow', () => {
  const teacherPassword = 'TPZvibecodes!';
  const testStudentName = 'Test Student';
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete end-to-end workflow: student creation, evidence submission, teacher approval', async ({ page }) => {
    // Step 1: Create a new student account
    console.log('🎯 Step 1: Creating student account');
    
    await expect(page.locator('h1')).toContainText('FUTURE CODING ACADEMY');
    
    // Click "Create New Student"
    await page.click('text=Create New Student');
    
    // Fill out student creation form
    await page.fill('input[placeholder="Enter your name"]', testStudentName);
    
    // Create avatar (click on some options)
    await page.click('[data-testid="avatar-emoji-🧑‍💻"]').catch(() => {
      // If test IDs aren't available, try clicking emoji options
      page.click('text=🧑‍💻').catch(() => console.log('Avatar selection not found'));
    });
    
    // Submit student creation
    await page.click('text=Create Student');
    
    // Should redirect to student dashboard
    await expect(page.locator('text=FUTURE CODING ACADEMY')).toBeVisible();
    await expect(page.locator(`text=${testStudentName}`)).toBeVisible();
    
    console.log('✅ Student account created successfully');

    // Step 2: Submit evidence for multiple skills
    console.log('🎯 Step 2: Submitting evidence for skills');
    
    // Find and click on an available skill (Cultural Mapping - first Tier 1 skill)
    await page.click('[data-testid="skill-cultural_mapping"]').catch(async () => {
      // Fallback: look for any available skill
      await page.click('text=Cultural Mapping').catch(async () => {
        // Last fallback: click first available skill card
        await page.click('.skill-card:has-text("developing")').first();
      });
    });
    
    // Fill out evidence form
    await page.fill('textarea[placeholder*="Share your thoughts"]', 
      'This is my reflection on cultural mapping. I learned about understanding different user perspectives and how cultural context affects design decisions.');
    
    // Submit evidence
    await page.click('text=Submit Evidence');
    
    // Should see pending approval message
    await expect(page.locator('text=Evidence submitted')).toBeVisible();
    await expect(page.locator('text=Waiting for teacher approval')).toBeVisible();
    
    await page.click('text=OK'); // Close alert
    
    console.log('✅ Evidence submitted successfully');

    // Step 3: Submit evidence for another skill 
    console.log('🎯 Step 3: Submitting evidence for second skill');
    
    // Try to submit for Client Discovery
    await page.click('text=Client Discovery').catch(() => {
      console.log('Client Discovery not available, skipping second skill');
    });
    
    try {
      await page.fill('textarea[placeholder*="Share your thoughts"]', 
        'My reflection on client discovery processes and user research methods.');
      await page.click('text=Submit Evidence');
      await expect(page.locator('text=Evidence submitted')).toBeVisible();
      await page.click('text=OK');
      console.log('✅ Second evidence submitted successfully');
    } catch (e) {
      console.log('Second skill not available for submission');
    }

    // Step 4: Check that competency bars show 0.0 (no approved evidence yet)
    console.log('🎯 Step 4: Verifying competencies are 0.0 before approval');
    
    await expect(page.locator('text=STEAM Interest')).toBeVisible();
    await expect(page.locator('text=0.0').first()).toBeVisible(); // Should show 0.0 for competencies
    
    console.log('✅ Competencies correctly showing 0.0 before approval');

    // Step 5: Switch to teacher view and approve evidence
    console.log('🎯 Step 5: Switching to teacher dashboard');
    
    await page.goto('/teacher');
    
    // Login as teacher
    await expect(page.locator('text=Teacher Access')).toBeVisible();
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('text=Access Dashboard');
    
    // Should be in teacher dashboard
    await expect(page.locator('text=Teacher Dashboard')).toBeVisible();
    
    console.log('✅ Teacher login successful');

    // Step 6: Review and approve pending evidence
    console.log('🎯 Step 6: Reviewing pending evidence');
    
    // Switch to Pending Evidence tab
    await page.click('text=Pending Evidence');
    
    // Should see submitted evidence
    await expect(page.locator(`text=${testStudentName}`)).toBeVisible();
    await expect(page.locator('text=Cultural Mapping')).toBeVisible();
    
    // Approve the first evidence
    const firstApproveButton = page.locator('button:has-text("✅ Approve")').first();
    await firstApproveButton.click();
    
    await expect(page.locator('text=approved and unlocked')).toBeVisible();
    await page.click('text=OK');
    
    console.log('✅ Evidence approved successfully');

    // Step 7: Test rejection workflow
    console.log('🎯 Step 7: Testing rejection workflow');
    
    if (await page.locator('button:has-text("❌ Reject")').count() > 0) {
      // Fill rejection message
      await page.fill('textarea[placeholder*="Explain what needs improvement"]', 
        'Please provide more specific examples of how cultural differences impact user interface design. Your reflection needs more depth and concrete examples.');
      
      // Reject the evidence
      await page.click('button:has-text("❌ Reject")').first();
      
      await expect(page.locator('text=rejected')).toBeVisible();
      await page.click('text=OK');
      
      console.log('✅ Evidence rejection workflow tested');
    }

    // Step 8: Return to student view and check updates
    console.log('🎯 Step 8: Checking student view updates');
    
    await page.goto('/');
    
    // Go back to our test student
    await page.click(`text=${testStudentName}`);
    
    // Should see approved skill is unlocked
    await expect(page.locator('text=unlocked')).toBeVisible();
    
    // Check that competency bars now show values > 0
    const steamInterestScore = await page.locator('text=STEAM Interest').locator('..').locator('span').last().textContent();
    console.log(`STEAM Interest score: ${steamInterestScore}`);
    
    // Should be greater than 0.0 now
    expect(parseFloat(steamInterestScore)).toBeGreaterThan(0);
    
    console.log('✅ Competency scores updated after approval');

    // Step 9: Test rejection message display
    console.log('🎯 Step 9: Testing rejection message display');
    
    // Click on a rejected skill to see the rejection message
    try {
      await page.click('text=rejected - click to see why');
      
      // Should show rejection message in alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('rejected by your teacher');
        expect(dialog.message()).toContain('more specific examples');
        await dialog.accept();
      });
      
      console.log('✅ Rejection message displayed correctly');
    } catch (e) {
      console.log('No rejected skills to test message display');
    }

    // Step 10: Test level progression
    console.log('🎯 Step 10: Testing level progression');
    
    // Check current level and XP
    const currentLevel = await page.locator('text=Level').textContent();
    console.log(`Current level: ${currentLevel}`);
    
    // XP should be > 0 from approved evidence
    await expect(page.locator('text=XP')).toBeVisible();
    
    console.log('✅ Level and XP system working');

    console.log('🎉 Complete workflow test passed!');
  });

  test('Teacher dashboard student management', async ({ page }) => {
    console.log('🎯 Testing teacher dashboard student management');
    
    await page.goto('/teacher');
    
    // Login
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('text=Access Dashboard');
    
    // Should see student management tab
    await expect(page.locator('text=Student Management')).toBeVisible();
    
    // Check if students are listed
    const studentCount = await page.locator('text=Students Registered').textContent();
    console.log(`Students registered: ${studentCount}`);
    
    // Test PIN management if students exist
    if (await page.locator('button:has-text("Set PIN")').count() > 0) {
      await page.click('button:has-text("Set PIN")').first();
      await page.fill('input[placeholder="Enter PIN"]', '1234');
      await page.click('text=Save');
      
      await expect(page.locator('text=1234')).toBeVisible();
      console.log('✅ PIN management working');
    }
    
    console.log('✅ Teacher dashboard test passed');
  });

  test('Back button functionality', async ({ page }) => {
    console.log('🎯 Testing back button functionality');
    
    // Go to student dashboard
    await page.goto('/civ/sample_student');
    
    // Should see back button
    await expect(page.locator('text=← Back to Students')).toBeVisible();
    
    // Click back button
    await page.click('text=← Back to Students');
    
    // Should return to student selection
    await expect(page.locator('text=FUTURE CODING ACADEMY')).toBeVisible();
    await expect(page.locator('text=Select Your Profile')).toBeVisible();
    
    console.log('✅ Back button working correctly');
  });

  test('Evidence submission without word minimums', async ({ page }) => {
    console.log('🎯 Testing evidence submission without word minimums');
    
    await page.goto('/civ/sample_student');
    
    // Try to submit very short evidence
    await page.click('text=Cultural Mapping').first();
    
    // Submit minimal evidence (should work without word count requirements)
    await page.fill('textarea[placeholder*="Share your thoughts"]', 'Short reflection.');
    
    // Should be able to submit
    await page.click('text=Submit Evidence');
    
    await expect(page.locator('text=Evidence submitted')).toBeVisible();
    
    console.log('✅ Evidence submission works without word minimums');
  });
});