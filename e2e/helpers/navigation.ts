import { Page, expect } from '@playwright/test';

/**
 * Navigation helper functions for common user flows
 */

export async function completeIntakeForm(page: Page) {
  // Wait for intake form to load
  await page.waitForSelector('h1:has-text("Let\'s Get Started")', { timeout: 10000 });

  // Select gender
  await page.click('input[id="gender-female"]');

  // Select age band
  await page.click('input[id="age-25_34"]');

  // Select languages
  await page.click('input[id="lang-English"]');

  // Select primary track
  await page.click('input[id="track-small_talk"]');

  // Optional: Add goals
  await page.fill('textarea', 'I want to improve my conversational French');

  // Submit
  await page.click('button:has-text("Continue to Consent")');
  
  // Wait for consent form to load
  await page.waitForSelector('h1:has-text("Before We Begin")', { timeout: 10000 });
}

export async function completeConsentForm(page: Page) {
  // Wait for consent form
  await page.waitForSelector('h1:has-text("Before We Begin")', { timeout: 10000 });

  // Check all consent checkboxes
  await page.click('input[id="recording-consent"]');
  await page.click('input[id="data-processing-consent"]');
  await page.click('input[id="retention-acknowledged"]');

  // Submit
  await page.click('button:has-text("I Agree — Continue")');
  
  // Wait for quiz to load
  await page.waitForSelector('text=Personality Test', { timeout: 10000 });
}

export async function skipPersonalityQuiz(page: Page) {
  // Check if skip button is available (dev mode)
  const skipButton = page.locator('button:has-text("Skip")');
  
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    return;
  }

  // Otherwise, quickly complete the quiz
  await completePersonalityQuizQuickly(page);
}

export async function completePersonalityQuizQuickly(page: Page) {
  // Wait for quiz to start
  await page.waitForSelector('text=Personality Test', { timeout: 10000 });

  // Get total number of questions from progress bar or counter
  const questionText = await page.locator('text=/Question \\d+ of \\d+/').textContent();
  const match = questionText?.match(/of (\d+)/);
  const totalQuestions = match ? parseInt(match[1]) : 14;

  for (let i = 0; i < totalQuestions; i++) {
    // Wait for question to be visible
    await page.waitForSelector('h2', { timeout: 5000 });

    // Try to answer the current question
    // Look for any clickable answer option
    const answerButton = page.locator('button[role="radio"], label').first();
    
    if (await answerButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await answerButton.click();
    }

    // Click next/submit button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("See My Personality")').first();
    await nextButton.click();

    // Small delay for animation
    await page.waitForTimeout(300);
  }

  // Wait for result screen
  await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
  await page.click('button:has-text("Continue")');
}

export async function skipToAssessmentModules(page: Page) {
  // Complete intake, consent, and quiz quickly
  await completeIntakeForm(page);
  await completeConsentForm(page);
  await skipPersonalityQuiz(page);
  
  // Skip mic check
  const micCheckSkip = page.locator('button:has-text("Skip to Assessment")');
  if (await micCheckSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
    await micCheckSkip.click();
  }
}

export async function recordAudioAndSubmit(page: Page, durationMs: number = 2000) {
  // Wait for record button
  await page.waitForSelector('button:has(svg.lucide-mic)', { timeout: 10000 });
  
  // Click record button
  await page.click('button:has(svg.lucide-mic)');
  
  // Wait for recording duration
  await page.waitForTimeout(durationMs);
  
  // Click stop button
  await page.click('button:has(svg.lucide-square)');
  
  // Wait for submit button to appear
  await page.waitForSelector('button:has-text("Submit")', { timeout: 5000 });
  
  // Click submit
  await page.click('button:has-text("Submit")');
  
  // Wait for "Analyzing..." to appear and disappear
  await page.waitForSelector('text=Analyzing', { timeout: 5000 });
  await page.waitForSelector('text=Analyzing', { state: 'hidden', timeout: 30000 });
}

export async function waitForModuleLoad(page: Page, moduleName: string) {
  await page.waitForSelector(`h1:has-text("${moduleName}")`, { timeout: 15000 });
}

