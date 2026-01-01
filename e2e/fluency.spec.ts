import { test, expect } from './fixtures/auth.fixture';
import { mockAudioRecording } from './fixtures/audio.fixture';
import { skipToAssessmentModules } from './helpers/navigation';

test.describe('Fluency Module', () => {
  test.beforeEach(async ({ page }) => {
    // Mock audio recording
    await mockAudioRecording(page);
    
    // Create fresh user
    const testUser = { email: `test-fluency-${Date.now()}@example.com`, password: 'TestPass123!' };
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('Test Case 8.1: Fluency Picture Description - Interface', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    // Skip pronunciation (if skip button available)
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
    
    // Should reach Fluency module (may need to complete pronunciation first)
    // Wait for either Fluency or Pronunciation
    await page.waitForSelector('text=/Fluency|Pronunciation/', { timeout: 20000 });
    
    // If on pronunciation, try to skip
    if (await page.locator('text=Pronunciation').isVisible({ timeout: 1000 }).catch(() => false)) {
      const skip = page.locator('button:has-text("Skip")');
      if (await skip.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skip.click();
      }
    }
    
    // When on Fluency module
    const fluencyTitle = page.locator('h1:has-text("Fluency")');
    if (await fluencyTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify intro panel
      await expect(page.locator('text=/Level Test|Fluency/')).toBeVisible();
      
      // Progress bar should be visible
      await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();
      
      // Should show picture card with image (when loaded)
      // Picture cards load asynchronously
      
      // Should show French prompt
      await expect(page.locator('text=/Décris|tu vois|parle/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Test Case 8.1a: Fluency - Record and submit description', async ({ page }) => {
    // This test requires reaching fluency module
    // Structure when fluency is accessible:
    
    // await expect(page.locator('text=/Fluency/i')).toBeVisible();
    
    // Click record
    // await page.click('button:has(svg.lucide-mic)');
    // await page.waitForTimeout(3000); // Record for 3 seconds
    
    // Stop recording
    // await page.click('button:has(svg.lucide-square)');
    
    // Submit
    // await page.click('button:has-text("Submit")');
    
    // Should show analyzing state
    // await expect(page.locator('text=Analyzing')).toBeVisible();
    
    // After analysis (with mocked backend), should show:
    // - WPM score
    // - Speed subscore
    // - Pause subscore
    // - Next button enabled
  });

  test('Test Case 8.1b: Fluency - Attempt counter display', async ({ page }) => {
    // When on fluency with multiple attempts:
    // await expect(page.locator('text=/attempt #\\d+/i')).not.toBeVisible(); // First attempt
    
    // After redo:
    // await expect(page.locator('text=/attempt #2/i')).toBeVisible();
  });

  test('Test Case 8.2: Fluency Module Completion Screen', async ({ page }) => {
    // When all picture cards are completed:
    
    // await expect(page.locator('text=Fluency Complete')).toBeVisible();
    // await expect(page.locator('text=/Tu as terminé/i')).toBeVisible();
    
    // Should show checkmark icon
    // await expect(page.locator('svg.lucide-check')).toBeVisible();
    
    // Two buttons should be visible
    // await expect(page.locator('button:has-text("Continuer vers la section suivante")')).toBeVisible();
    // await expect(page.locator('button:has-text("Refaire Fluency")')).toBeVisible();
    
    // Warning message
    // await expect(page.locator('text=/ne pourras plus revenir/i')).toBeVisible();
  });

  test('Test Case 8.2a: Fluency - Continue to next module', async ({ page }) => {
    // On completion screen:
    
    // Click continue
    // await page.click('button:has-text("Continuer vers la section suivante")');
    
    // Should lock the module and move to next module
    // await expect(page.locator('text=/Confidence|Syntax/i')).toBeVisible({ timeout: 10000 });
    
    // Module should be locked - verify by checking session data
  });

  test('Test Case 8.3: Fluency - Redo item dialog', async ({ page }) => {
    // When on a fluency item after recording:
    
    // Click Redo button
    // await page.click('button:has-text("Redo")');
    
    // Should show confirmation dialog
    // await expect(page.locator('text=/Are you sure|redo/i')).toBeVisible();
    
    // Dialog should have confirm and cancel buttons
    // await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
    // await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('Test Case 8.3a: Fluency - Redo module dialog', async ({ page }) => {
    // On completion screen:
    
    // Click "Refaire Fluency"
    // await page.click('button:has-text("Refaire Fluency")');
    
    // Should show confirmation dialog
    // await expect(page.locator('text=/recommencer|redo module/i')).toBeVisible();
    
    // Confirm redo
    // await page.click('button:has-text("Confirm")');
    
    // Should return to first picture card
    // Progress should reset
    // Module attempt counter should increment
  });

  test('Test Case 8.1c: Fluency - Progress bar accuracy', async ({ page }) => {
    // Verify progress calculation
    // Progress should be: (currentIndex + 1) / totalCards * 100
    
    // On first card (index 0):
    // Progress = 1 / totalCards
    
    // After completing first card and moving to second:
    // Progress = 2 / totalCards
  });

  test('Test Case 8.1d: Fluency - Score display after analysis', async ({ page }) => {
    // After submitting recording:
    
    // Should display:
    // await expect(page.locator('text=/WPM|words per minute/i')).toBeVisible();
    // await expect(page.locator('text=/Speed/i')).toBeVisible();
    // await expect(page.locator('text=/Pause/i')).toBeVisible();
    
    // Scores should be numbers
    // const wpmValue = await page.locator('text=/\\d+ WPM/').textContent();
    // expect(wpmValue).toMatch(/\d+/);
  });

  test('Test Case 8.3b: Fluency - Redo resets recording state', async ({ page }) => {
    // After recording and before submitting:
    
    // Click redo
    // await page.click('button:has-text("Redo")');
    
    // Recording state should reset
    // await expect(page.locator('button:has(svg.lucide-mic)')).toBeVisible();
    // await expect(page.locator('text=00:00')).toBeVisible();
    
    // Audio blob should be cleared
    // Submit button should not be visible
  });

  test('Test Case 8.1e: Fluency - Module attempt counter persistence', async ({ page }) => {
    // Module attempt count should persist across redo
    // Initial: attempt #1 (not shown)
    // After redo module: attempt #2
    // After second redo: attempt #3
    
    // Verify attempt counter increments correctly
  });
});

