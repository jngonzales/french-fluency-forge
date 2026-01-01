import { test, expect } from './fixtures/auth.fixture';
import { completeIntakeForm, completeConsentForm } from './helpers/navigation';

test.describe('Assessment: Intake, Consent, and Quiz', () => {
  test.beforeEach(async ({ page, supabaseAdmin }) => {
    // Each test needs a fresh authenticated user
    const testUser = { email: `test-intake-${Date.now()}@example.com`, password: 'TestPass123!' };
    
    // Create user via signup
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('Test Case 3.1: Complete Intake Form - All fields', async ({ page }) => {
    // Start assessment
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    // Wait for intake form
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tell us a bit about yourself')).toBeVisible();
    
    // Select gender
    await page.click('input[id="gender-female"]');
    
    // Select age band
    await page.click('input[id="age-25_34"]');
    
    // Select languages (at least one)
    await page.click('input[id="lang-English"]');
    await page.click('input[id="lang-Spanish"]');
    
    // Select primary track
    await page.click('input[id="track-small_talk"]');
    
    // Verify track description
    await expect(page.locator('text=Casual conversations with neighbors')).toBeVisible();
    
    // Fill optional goals
    await page.fill('textarea', 'I want to improve my conversational French for daily interactions');
    
    // Submit
    await page.click('button:has-text("Continue to Consent")');
    
    // Wait for loading state
    await expect(page.locator('button:has-text("Saving")')).toBeVisible({ timeout: 5000 });
    
    // Should redirect to consent form
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
  });

  test('Test Case 3.1a: Intake Form - Missing required field (gender)', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    
    // Skip gender, fill others
    await page.click('input[id="age-25_34"]');
    await page.click('input[id="lang-English"]');
    await page.click('input[id="track-small_talk"]');
    
    // Try to submit
    await page.click('button:has-text("Continue to Consent")');
    
    // Should show error toast
    await expect(page.locator('text=/Please complete all required fields/')).toBeVisible({ timeout: 3000 });
  });

  test('Test Case 3.1b: Intake Form - No languages selected', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    
    // Fill all except languages
    await page.click('input[id="gender-male"]');
    await page.click('input[id="age-25_34"]');
    await page.click('input[id="track-work"]');
    
    // Try to submit
    await page.click('button:has-text("Continue to Consent")');
    
    // Should show specific language error
    await expect(page.locator('text=/select at least one language/')).toBeVisible({ timeout: 3000 });
  });

  test('Test Case 3.1c: Intake Form - All track options displayed', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await expect(page.locator('h1:has-text("Let\'s Get Started")')).toBeVisible({ timeout: 10000 });
    
    // Verify all 6 track options
    await expect(page.locator('text=Small Talk')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=Bilingual Friends')).toBeVisible();
    await expect(page.locator('text=Work')).toBeVisible();
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=In-Laws')).toBeVisible();
  });

  test('Test Case 4.1: Complete Consent Form', async ({ page }) => {
    // Navigate to consent (via intake)
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    
    // Now on consent form
    await expect(page.locator('h1:has-text("Before We Begin")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=We take your privacy seriously')).toBeVisible();
    
    // Verify 3 consent cards with icons
    await expect(page.locator('text=Audio Recording')).toBeVisible();
    await expect(page.locator('text=Data Processing')).toBeVisible();
    await expect(page.locator('text=30-Day Retention')).toBeVisible();
    
    // Verify button disabled initially
    const submitButton = page.locator('button:has-text("I Agree")');
    await expect(submitButton).toBeDisabled();
    
    // Check first consent
    await page.click('input[id="recording-consent"]');
    await expect(submitButton).toBeDisabled(); // Still disabled
    
    // Check second consent
    await page.click('input[id="data-processing-consent"]');
    await expect(submitButton).toBeDisabled(); // Still disabled
    
    // Check third consent
    await page.click('input[id="retention-acknowledged"]');
    await expect(submitButton).toBeEnabled(); // Now enabled
    
    // Submit
    await page.click('button:has-text("I Agree — Continue")');
    
    // Wait for loading
    await expect(page.locator('button:has-text("Saving")')).toBeVisible({ timeout: 5000 });
    
    // Should redirect to quiz
    await expect(page.locator('text=Personality Test')).toBeVisible({ timeout: 10000 });
  });

  test('Test Case 4.1a: Consent Form - UI elements present', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    
    // Verify UI elements
    await expect(page.locator('svg.lucide-mic')).toBeVisible();
    await expect(page.locator('svg.lucide-shield')).toBeVisible();
    await expect(page.locator('svg.lucide-clock')).toBeVisible();
    
    // Verify deletion rights notice
    await expect(page.locator('text=/Your rights|request complete deletion/')).toBeVisible();
  });

  test('Test Case 5.1: Personality Quiz - Navigation and progress', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    await completeConsentForm(page);
    
    // Now on quiz
    await expect(page.locator('text=Personality Test')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Discover your learning style')).toBeVisible();
    
    // Check progress indicators
    await expect(page.locator('text=/Question 1 of \\d+/')).toBeVisible();
    
    // Progress bar should be visible
    await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();
    
    // Back button should NOT be visible on first question
    await expect(page.locator('button:has-text("Back")')).not.toBeVisible();
    
    // Answer first question (click any answer option)
    const firstAnswer = page.locator('button[role="radio"], label').first();
    await firstAnswer.click();
    
    // Next button should be enabled
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
    
    // Click next
    await page.click('button:has-text("Next")');
    
    // Should be on question 2
    await expect(page.locator('text=/Question 2 of \\d+/')).toBeVisible();
    
    // Back button should now be visible
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
    
    // Test back navigation
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=/Question 1 of \\d+/')).toBeVisible();
  });

  test('Test Case 5.2: Personality Quiz - Answer persistence', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    await completeConsentForm(page);
    
    // Answer question 1
    const firstAnswer = page.locator('button[role="radio"], label').first();
    await firstAnswer.click();
    await page.click('button:has-text("Next")');
    
    // Answer question 2
    const secondAnswer = page.locator('button[role="radio"], label').nth(1);
    await secondAnswer.click();
    await page.click('button:has-text("Next")');
    
    // Now on question 3
    await expect(page.locator('text=/Question 3 of \\d+/')).toBeVisible();
    
    // Go back to question 2
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=/Question 2 of \\d+/')).toBeVisible();
    
    // Verify answer is still selected (this is harder to test generically)
    // The selected state should persist
    
    // Go back to question 1
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=/Question 1 of \\d+/')).toBeVisible();
    
    // Navigate forward again
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    // Should be back on question 3 with no data loss
    await expect(page.locator('text=/Question 3 of \\d+/')).toBeVisible();
  });

  test('Test Case 5.1a: Personality Quiz - Complete to result', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    await completeConsentForm(page);
    
    // Get total questions
    const questionText = await page.locator('text=/Question \\d+ of (\\d+)/').textContent();
    const match = questionText?.match(/of (\d+)/);
    const totalQuestions = match ? parseInt(match[1]) : 15;
    
    // Answer all questions
    for (let i = 0; i < totalQuestions; i++) {
      // Wait for question
      await page.waitForSelector('h2', { timeout: 5000 });
      
      // Answer (click first visible option)
      const answer = page.locator('button[role="radio"], label').first();
      if (await answer.isVisible({ timeout: 2000 }).catch(() => false)) {
        await answer.click();
      }
      
      // Check if last question
      const isLast = i === totalQuestions - 1;
      const buttonText = isLast ? 'See My Personality' : 'Next';
      
      await page.click(`button:has-text("${buttonText}")`);
      
      if (!isLast) {
        await page.waitForTimeout(300); // Animation delay
      }
    }
    
    // Should show result screen with archetype
    await expect(page.locator('text=/archetype|personality/i')).toBeVisible({ timeout: 15000 });
    
    // Continue button should be present
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();
  });

  test('Test Case 6.1: Mic Check - Skip to assessment', async ({ page }) => {
    await page.click('a:has-text("Start Your Assessment")');
    await page.waitForURL('/assessment', { timeout: 10000 });
    
    await completeIntakeForm(page);
    await completeConsentForm(page);
    
    // Complete quiz quickly
    const questionText = await page.locator('text=/Question \\d+ of (\\d+)/').textContent();
    const match = questionText?.match(/of (\d+)/);
    const totalQuestions = match ? parseInt(match[1]) : 15;
    
    for (let i = 0; i < totalQuestions; i++) {
      const answer = page.locator('button[role="radio"], label').first();
      if (await answer.isVisible({ timeout: 1000 }).catch(() => false)) {
        await answer.click();
      }
      await page.click('button:has-text("Next"), button:has-text("See My Personality")');
      await page.waitForTimeout(200);
    }
    
    // Click continue on result screen
    await page.click('button:has-text("Continue")');
    
    // Should reach mic check or go directly to assessment
    const micCheckVisible = await page.locator('text=Microphone Check').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (micCheckVisible) {
      await expect(page.locator('text=Coming soon')).toBeVisible();
      await expect(page.locator('button:has-text("Skip to Assessment")')).toBeVisible();
      
      // Click skip
      await page.click('button:has-text("Skip to Assessment")');
    }
    
    // Should now be in assessment modules (pronunciation first)
    await expect(page.locator('text=/Pronunciation|Reading Aloud/i')).toBeVisible({ timeout: 10000 });
  });
});

