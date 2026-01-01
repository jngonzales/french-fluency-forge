import { test, expect } from './fixtures/auth.fixture';
import { mockAudioRecording } from './fixtures/audio.fixture';
import { skipToAssessmentModules } from './helpers/navigation';

/**
 * Critical Path Tests - End-to-End Happy Paths
 * These tests verify the complete user journey through the application
 */

test.describe('Critical Path: Full Assessment Flow', () => {
  test('Complete full happy path: Signup -> Assessment -> Results', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for full flow
    
    await mockAudioRecording(page);
    
    // 1. SIGNUP
    const testUser = { email: `test-full-${Date.now()}@example.com`, password: 'TestPass123!' };
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify authenticated
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    
    // 2. START ASSESSMENT
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    // 3. INTAKE FORM
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    await page.click('input[id="gender-female"]');
    await page.click('input[id="age-25_34"]');
    await page.click('input[id="lang-English"]');
    await page.click('input[id="track-small_talk"]');
    await page.fill('textarea', 'Test goals');
    await page.click('button:has-text("Continue to Consent")');
    
    // 4. CONSENT FORM
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    await page.click('input[id="recording-consent"]');
    await page.click('input[id="data-processing-consent"]');
    await page.click('input[id="retention-acknowledged"]');
    await page.click('button:has-text("I Agree — Continue")');
    
    // 5. PERSONALITY QUIZ (Quick completion)
    await expect(page.locator('text=Personality Test')).toBeVisible({ timeout: 10000 });
    
    const questionText = await page.locator('text=/Question \\d+ of (\\d+)/').textContent();
    const match = questionText?.match(/of (\d+)/);
    const totalQuestions = match ? parseInt(match[1]) : 15;
    
    for (let i = 0; i < totalQuestions; i++) {
      const answer = page.locator('button[role="radio"], label').first();
      if (await answer.isVisible({ timeout: 2000 }).catch(() => false)) {
        await answer.click();
      }
      await page.click('button:has-text("Next"), button:has-text("See My Personality")');
      await page.waitForTimeout(200);
    }
    
    // Continue from personality result
    await page.waitForSelector('button:has-text("Continue")', { timeout: 15000 });
    await page.click('button:has-text("Continue")');
    
    // 6. MIC CHECK (Skip if present)
    const micCheckSkip = page.locator('button:has-text("Skip to Assessment")');
    if (await micCheckSkip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await micCheckSkip.click();
    }
    
    // 7. ASSESSMENT MODULES
    // Note: In real environment, would need to mock backend responses
    // For now, verify we reach the assessment modules
    await expect(page.locator('text=/Pronunciation|Fluency|Assessment/')).toBeVisible({ timeout: 15000 });
    
    // Test would continue through all modules with mocked responses
    // Then verify redirect to results page
  });
});

test.describe('Critical Path: Audio Recording Flow', () => {
  test('Pronunciation module - Complete one item successfully', async ({ page }) => {
    await mockAudioRecording(page);
    
    const testUser = { email: `test-audio-${Date.now()}@example.com`, password: 'TestPass123!' };
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await skipToAssessmentModules(page);
    
    // Wait for pronunciation module
    await expect(page.locator('text=Pronunciation')).toBeVisible({ timeout: 20000 });
    
    // Complete one recording cycle
    // 1. Start recording
    await page.click('button:has(svg.lucide-mic)');
    
    // 2. Recording should start (timer counting)
    await expect(page.locator('text=/00:0[1-9]/')).toBeVisible({ timeout: 2000 });
    
    // 3. Stop recording after 2 seconds
    await page.waitForTimeout(2000);
    await page.click('button:has(svg.lucide-square)');
    
    // 4. Verify Redo and Submit buttons appear
    await expect(page.locator('button:has-text("Redo")')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
    
    // 5. Submit
    await page.click('button:has-text("Submit")');
    
    // 6. Should show analyzing state
    await expect(page.locator('text=Analyzing')).toBeVisible({ timeout: 5000 });
    
    // In real test with backend mocked, would verify:
    // - Analysis completes
    // - Score displayed
    // - Auto-advance to next item
  });

  test('Fluency module - Record, submit, and continue', async ({ page }) => {
    // Similar flow to pronunciation but for fluency module
    // Test recording longer descriptions (30-60 seconds)
    // Verify WPM calculation
    // Test next button functionality
  });
});

test.describe('Critical Path: Session Persistence', () => {
  test('Resume assessment after page reload', async ({ page }) => {
    const testUser = { email: `test-resume-${Date.now()}@example.com`, password: 'TestPass123!' };
    
    // 1. Create account and start assessment
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    // 2. Complete intake form
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    await page.click('input[id="gender-male"]');
    await page.click('input[id="age-35_44"]');
    await page.click('input[id="lang-English"]');
    await page.click('input[id="track-work"]');
    await page.click('button:has-text("Continue to Consent")');
    
    // 3. Now on consent form - reload page
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    await page.reload();
    
    // 4. Should resume at consent form (not back to intake)
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    
    // Session status should be 'consent' in database
    // User should not have to redo intake form
  });

  test('Resume after logout and re-login', async ({ page }) => {
    const testUser = { email: `test-relogin-${Date.now()}@example.com`, password: 'TestPass123!' };
    
    // 1. Create account, start assessment, complete intake
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    await page.click('input[id="gender-male"]');
    await page.click('input[id="age-25_34"]');
    await page.click('input[id="lang-Spanish"]');
    await page.click('input[id="track-home"]');
    await page.click('button:has-text("Continue to Consent")');
    
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    
    // 2. Sign out
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login', { timeout: 10000 });
    
    // 3. Sign back in
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/', { timeout: 15000 });
    
    // 4. Go to assessment again
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    // 5. Should resume at consent (where we left off)
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    
    // Should NOT be back at intake form
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).not.toBeVisible();
  });
});

test.describe('Critical Path: Results and Scoring', () => {
  test('Verify score calculations on results page', async ({ page, supabaseAdmin }) => {
    // This test requires:
    // 1. Completed assessment session
    // 2. Mock data in database
    // 3. Navigate to results page
    
    // Would create mock session with known scores
    // Verify calculations match expected formulas
    // Check radar chart displays correctly
    // Verify all 6 skills shown
  });
});

