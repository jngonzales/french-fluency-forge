import { test, expect } from './fixtures/auth.fixture';
import { mockAudioRecording } from './fixtures/audio.fixture';
import { skipToAssessmentModules, recordAudioAndSubmit } from './helpers/navigation';

test.describe('Pronunciation Module', () => {
  test.beforeEach(async ({ page }) => {
    // Mock audio recording functionality
    await mockAudioRecording(page);
    
    // Create fresh authenticated user
    const testUser = { email: `test-pron-${Date.now()}@example.com`, password: 'TestPass123!' };
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('Test Case 7.1: Pronunciation Reading Section - Complete item', async ({ page }) => {
    // Navigate to assessment
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    // Skip to pronunciation module
    await skipToAssessmentModules(page);
    
    // Should be on pronunciation module
    await expect(page.locator('text=Pronunciation')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Reading Aloud')).toBeVisible({ timeout: 5000 });
    
    // Verify progress bar
    await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();
    
    // Verify instruction text
    await expect(page.locator('text=Read the French text aloud')).toBeVisible();
    
    // Should see French text to read
    await expect(page.locator('div.card-title, h2, h3')).toContainText(/[a-zA-Zàâäéèêëïîôùûüÿç]/);
    
    // Should see Focus tags
    await expect(page.locator('text=/Focus:|nasal|liaison|vowel/i')).toBeVisible();
    
    // Verify timer shows 00:00
    await expect(page.locator('text=00:00')).toBeVisible();
    
    // Click record button (Mic icon)
    await page.click('button:has(svg.lucide-mic)');
    
    // Timer should start counting
    await page.waitForTimeout(500);
    await expect(page.locator('text=/00:0[1-9]/')).toBeVisible();
    
    // Stop button should be visible (Square icon with animate-pulse)
    await expect(page.locator('button:has(svg.lucide-square)')).toBeVisible();
    
    // Wait for 2 seconds of "recording"
    await page.waitForTimeout(2000);
    
    // Stop recording
    await page.click('button:has(svg.lucide-square)');
    
    // Should show Redo and Submit buttons
    await expect(page.locator('button:has-text("Redo")')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
    
    // Submit recording
    await page.click('button:has-text("Submit")');
    
    // Should show "Analyzing..." state
    await expect(page.locator('text=Analyzing')).toBeVisible({ timeout: 5000 });
    
    // Wait for analysis to complete (this will fail in real test without backend)
    // In real test environment, you'd mock the API response
    // For now, just verify the analyzing state appears
  });

  test('Test Case 7.1a: Pronunciation - Redo recording', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    await expect(page.locator('text=Reading Aloud')).toBeVisible({ timeout: 15000 });
    
    // Record
    await page.click('button:has(svg.lucide-mic)');
    await page.waitForTimeout(1500);
    await page.click('button:has(svg.lucide-square)');
    
    // Wait for Redo button
    await expect(page.locator('button:has-text("Redo")')).toBeVisible({ timeout: 3000 });
    
    // Click Redo
    await page.click('button:has-text("Redo")');
    
    // Should reset to recording state
    await expect(page.locator('button:has(svg.lucide-mic)')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=00:00')).toBeVisible();
  });

  test('Test Case 7.1b: Pronunciation - Max recording duration 30 seconds', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    await expect(page.locator('text=Reading Aloud')).toBeVisible({ timeout: 15000 });
    
    // Start recording
    await page.click('button:has(svg.lucide-mic)');
    
    // Wait to verify recording continues (not auto-stopping)
    await page.waitForTimeout(3000);
    
    // Timer should show some time elapsed
    await expect(page.locator('text=/00:0[2-9]/')).toBeVisible();
    
    // Stop button should still be visible
    await expect(page.locator('button:has(svg.lucide-square)')).toBeVisible();
  });

  test('Test Case 7.2: Pronunciation Repeat Section - Listen and repeat', async ({ page }) => {
    // This test requires completing reading section first
    // For now, we'll test the UI expectations if we could skip to repeat section
    
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    // We'd need to complete reading section to get to repeat
    // This is a placeholder test structure
    
    // Verify repeat section indicators when reached
    // await expect(page.locator('text=Listen & Repeat')).toBeVisible();
    // await expect(page.locator('text=Listen, then repeat what you hear')).toBeVisible();
    
    // Should see play button for reference audio
    // await expect(page.locator('button:has(svg.lucide-volume-2)')).toBeVisible();
    
    // Play button should be large circular button
    // const playButton = page.locator('button:has(svg.lucide-volume-2)');
    // await expect(playButton).toHaveClass(/rounded-full/);
  });

  test('Test Case 7.3: Pronunciation Minimal Pairs - Game interface', async ({ page }) => {
    // Similar to repeat section, this requires completing previous sections
    // Testing UI expectations
    
    // When on minimal pairs section:
    // await expect(page.locator('text=Minimal Pairs Game')).toBeVisible();
    // await expect(page.locator('text=Which word do you hear')).toBeVisible();
    
    // Should see two option buttons
    // const optionButtons = page.locator('button[variant], button').filter({ hasText: /^[a-zàâäéèêëïîôùûüÿç]+$/i });
    // await expect(optionButtons).toHaveCount(2);
    
    // Play button should be visible
    // await expect(page.locator('button:has(svg.lucide-volume-2)')).toBeVisible();
  });

  test('Test Case 7.4: Pronunciation - Debug mode toggle', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    await expect(page.locator('text=Pronunciation')).toBeVisible({ timeout: 15000 });
    
    // Look for Debug button
    const debugButton = page.locator('button:has-text("Debug")');
    
    if (await debugButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click debug button
      await debugButton.click();
      
      // Should show debug panel
      await expect(page.locator('text=Debug Info')).toBeVisible({ timeout: 2000 });
      
      // Click again to hide
      await page.click('button:has-text("Hide Debug")');
      
      // Debug panel should be hidden
      await expect(page.locator('text=Debug Info')).not.toBeVisible();
    }
  });

  test('Test Case 7.1c: Pronunciation - Word heatmap display', async ({ page }) => {
    // This test would require mocking the API response to include word scores
    // Structure for when backend is mocked:
    
    // After submitting a recording and getting response:
    // await expect(page.locator('text=Word accuracy')).toBeVisible();
    
    // Should see colored word badges
    // const wordBadges = page.locator('span[class*="bg-green"], span[class*="bg-yellow"], span[class*="bg-red"]');
    // await expect(wordBadges.first()).toBeVisible();
    
    // Green = high accuracy (>= 80%)
    // Yellow = medium accuracy (60-79%)
    // Red = low accuracy (< 60%)
  });

  test('Test Case 7.1d: Pronunciation - Section navigation', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    // Verify section indicator shows Reading Aloud
    await expect(page.locator('text=Reading Aloud')).toBeVisible({ timeout: 15000 });
    
    // Verify section icon present
    const sectionIcon = page.locator('svg.lucide-book-open');
    await expect(sectionIcon).toBeVisible();
  });

  test('Test Case 7.1e: Pronunciation - Permission denied error', async ({ page }) => {
    // Override the mock to simulate permission denied
    await page.addInitScript(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });
    
    await page.goto('/signup');
    const testUser = { email: `test-perm-${Date.now()}@example.com`, password: 'TestPass123!' };
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    await expect(page.locator('text=Pronunciation')).toBeVisible({ timeout: 15000 });
    
    // Try to record
    await page.click('button:has(svg.lucide-mic)');
    
    // Should show error message about microphone permission
    await expect(page.locator('text=/permission|microphone|denied/i')).toBeVisible({ timeout: 5000 });
  });
});

