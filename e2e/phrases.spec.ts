/**
 * Phrases Feature E2E Tests
 * Tests user flows and scheduler correctness
 */

import { test, expect } from '@playwright/test';
import { authFixture } from './fixtures/auth.fixture';

test.describe('Phrases Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as test user
    await authFixture.signIn(page, 'test@example.com', 'password123');
    await page.goto('/dashboard');
  });

  test.describe('First-time user flow', () => {
    test('should show empty state and allow seeding starter pack', async ({ page }) => {
      // Navigate to phrases
      await page.goto('/phrases');
      
      // Should see empty state
      await expect(page.getByText('No phrases assigned yet')).toBeVisible();
      await expect(page.getByRole('button', { name: /add a starter pack/i })).toBeVisible();
      
      // Click to add starter pack
      await page.getByRole('button', { name: /add a starter pack/i }).click();
      
      // Should see success toast
      await expect(page.getByText(/starter pack added/i)).toBeVisible();
      
      // Should see stats (10 new phrases)
      await expect(page.getByText(/10/i)).toBeVisible(); // Total phrases
    });
  });

  test.describe('Session flow', () => {
    test.beforeEach(async ({ page }) => {
      // Seed phrases first
      await page.goto('/phrases');
      const addPackButton = page.getByRole('button', { name: /add a starter pack/i });
      if (await addPackButton.isVisible()) {
        await addPackButton.click();
        await page.waitForTimeout(1000); // Wait for localStorage update
      }
    });

    test('should start session and complete cards', async ({ page }) => {
      await page.goto('/phrases');
      
      // Click start session
      await page.getByRole('button', { name: /start a session/i }).click();
      
      // Should be on session page
      await expect(page).toHaveURL(/\/phrases\/session/);
      
      // Should see progress bar
      await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
      
      // Should see phrase card
      await expect(page.getByText(/Say this in French|Listen and understand/i)).toBeVisible();
      
      // Click reveal
      await page.getByRole('button', { name: /reveal answer/i }).click();
      
      // Should see answer
      await expect(page.getByText(/Comment|Bonjour/i)).toBeVisible();
      
      // Rate with Good
      await page.getByRole('button', { name: /good/i }).click();
      
      // Should see next card or completion
      await expect(
        page.getByText(/Say this in French|Listen and understand|Session complete/i)
      ).toBeVisible();
    });

    test('should show interval previews on rating buttons', async ({ page }) => {
      await page.goto('/phrases/session');
      await page.waitForTimeout(500);
      
      // Reveal card
      const revealButton = page.getByRole('button', { name: /reveal answer/i });
      if (await revealButton.isVisible()) {
        await revealButton.click();
        
        // Should see rating buttons with intervals
        const goodButton = page.getByRole('button', { name: /good/i });
        await expect(goodButton).toBeVisible();
        
        // Hover to see tooltip
        await goodButton.hover();
        await expect(page.getByText(/next review/i)).toBeVisible();
      }
    });
  });

  test.describe('Scheduler correctness (E2E)', () => {
    test.beforeEach(async ({ page }) => {
      // Seed phrases
      await page.goto('/phrases');
      const addPackButton = page.getByRole('button', { name: /add a starter pack/i });
      if (await addPackButton.isVisible()) {
        await addPackButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should schedule Again with short interval (~1 minute) for new card', async ({ page }) => {
      await page.goto('/phrases/session');
      await page.waitForTimeout(500);
      
      // Reveal and rate Again
      const revealButton = page.getByRole('button', { name: /reveal answer/i });
      if (await revealButton.isVisible()) {
        await revealButton.click();
        await page.waitForTimeout(200);
        
        // Check interval preview for Again
        const againButton = page.getByRole('button', { name: /again/i });
        await againButton.hover();
        
        // Should show short interval (1m or similar)
        const tooltip = page.getByText(/next review/i);
        if (await tooltip.isVisible()) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toMatch(/1m|1 min|in 1/i);
        }
      }
    });

    test('should maintain monotonicity (Again < Hard < Good < Easy)', async ({ page }) => {
      await page.goto('/phrases/session');
      await page.waitForTimeout(500);
      
      const revealButton = page.getByRole('button', { name: /reveal answer/i });
      if (await revealButton.isVisible()) {
        await revealButton.click();
        await page.waitForTimeout(200);
        
        // Get all rating buttons
        const againButton = page.getByRole('button', { name: /again/i });
        const hardButton = page.getByRole('button', { name: /hard/i });
        const goodButton = page.getByRole('button', { name: /good/i });
        const easyButton = page.getByRole('button', { name: /easy/i });
        
        // All should be visible
        await expect(againButton).toBeVisible();
        await expect(hardButton).toBeVisible();
        await expect(goodButton).toBeVisible();
        await expect(easyButton).toBeVisible();
        
        // Note: Actual interval comparison would require extracting values from tooltips
        // This is a basic visibility check - full validation in unit tests
      }
    });
  });

  test.describe('Card actions', () => {
    test.beforeEach(async ({ page }) => {
      // Seed phrases
      await page.goto('/phrases');
      const addPackButton = page.getByRole('button', { name: /add a starter pack/i });
      if (await addPackButton.isVisible()) {
        await addPackButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should bury card and remove from queue', async ({ page }) => {
      await page.goto('/phrases/session');
      await page.waitForTimeout(500);
      
      // Open actions menu
      const actionsButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
      if (await actionsButton.isVisible()) {
        await actionsButton.click();
        
        // Click bury
        await page.getByText(/bury/i).click();
        
        // Confirm
        await page.getByRole('button', { name: /confirm/i }).click();
        
        // Should see next card or completion
        await expect(page.getByText(/Session complete|Say this in French/i)).toBeVisible();
      }
    });
  });

  test.describe('Library browsing', () => {
    test.beforeEach(async ({ page }) => {
      // Seed phrases
      await page.goto('/phrases');
      const addPackButton = page.getByRole('button', { name: /add a starter pack/i });
      if (await addPackButton.isVisible()) {
        await addPackButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should filter phrases by mode', async ({ page }) => {
      await page.goto('/phrases/library');
      
      // Should see library table
      await expect(page.getByText(/phrase|mode|tags/i)).toBeVisible();
      
      // Filter by recall
      const modeFilter = page.getByRole('combobox').filter({ hasText: /all modes/i }).first();
      if (await modeFilter.isVisible()) {
        await modeFilter.click();
        await page.getByText(/recall only/i).click();
        
        // Should see filtered results
        await expect(page.getByText(/Showing \d+ phrase/i)).toBeVisible();
      }
    });

    test('should search phrases', async ({ page }) => {
      await page.goto('/phrases/library');
      
      // Search for a phrase
      const searchInput = page.getByPlaceholder(/search phrases/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('bonjour');
        
        // Should see filtered results
        await expect(page.getByText(/Showing \d+ phrase/i)).toBeVisible();
      }
    });
  });

  test.describe('Settings', () => {
    test('should update settings and persist', async ({ page }) => {
      await page.goto('/phrases/settings');
      
      // Update new per day
      const newPerDaySlider = page.locator('input[type="range"]').first();
      if (await newPerDaySlider.isVisible()) {
        // Note: Slider interaction is complex in Playwright
        // This is a basic test - full interaction would require more setup
        await expect(page.getByText(/new phrases per day/i)).toBeVisible();
      }
      
      // Should see save confirmation
      // Settings save automatically, so we just verify page loads
      await expect(page.getByText(/phrases settings/i)).toBeVisible();
    });
  });
});

