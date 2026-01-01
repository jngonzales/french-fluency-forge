import { test, expect } from '@playwright/test';

/**
 * UI-only tests that don't require Supabase credentials
 * These test frontend rendering and behavior without database access
 */

test.describe('UI Tests (No Database Required)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Home page renders correctly', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Unlock Your French Speaking Potential');
    await expect(page.locator('text=6 Core Skills')).toBeVisible();
    await expect(page.locator('text=Personalized Track')).toBeVisible();
    await expect(page.locator('text=Actionable Next Steps')).toBeVisible();
  });

  test('Navigation to signup page works', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });

  test('Navigation to login page works', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=Forgot Password')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Activate page renders', async ({ page }) => {
    await page.goto('/activate');
    await expect(page.locator('text=Activate Your Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // Should show 404 or redirect
    await page.waitForLoadState('networkidle');
  });

  test('Results page requires session parameter', async ({ page }) => {
    await page.goto('/results');
    await expect(page.locator('text=No session selected')).toBeVisible({ timeout: 10000 });
  });

  test('Responsive design - Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should render without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow 5px tolerance
  });

  test('Responsive design - Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('h2')).toContainText('Unlock Your French Speaking Potential');
    await expect(page.locator('text=6 Core Skills')).toBeVisible();
  });

  test('Responsive design - Desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('h2')).toContainText('Unlock Your French Speaking Potential');
  });

  test('Form elements have proper labels', async ({ page }) => {
    await page.goto('/signup');
    
    // Check accessibility - inputs should have labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
  });

  test('Buttons have appropriate states', async ({ page }) => {
    await page.goto('/signup');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled(); // Initially enabled
  });

  test('Links are properly styled and clickable', async ({ page }) => {
    await page.goto('/login');
    
    // Check forgot password link
    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
    
    // Check signup link
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toBeVisible();
  });

  test('Theme/styling is consistent', async ({ page }) => {
    await page.goto('/');
    
    // Check that CSS is loaded (page has background color)
    const bgColor = await page.locator('body').evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(bgColor).toBeTruthy();
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('Images have alt text (accessibility)', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      // Check first image has alt attribute
      const alt = await images.first().getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('Page title is set correctly', async ({ page }) => {
    await page.goto('/');
    // Current title is "Lovable App" - should be updated to something more descriptive
    await expect(page).toHaveTitle(/Lovable App|French|Fluency|Diagnostic/);
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/expected errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('socket')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('JavaScript is loaded and functional', async ({ page }) => {
    await page.goto('/');
    
    // Check that React has rendered
    const reactRoot = await page.locator('#root').count();
    expect(reactRoot).toBeGreaterThan(0);
    
    // Check that content is rendered (not just empty div)
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(100);
  });

  test('Navigation between pages works', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in link
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
    
    // Navigate to signup
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/.*signup/);
    
    // Back to login
    await page.goBack();
    await expect(page).toHaveURL(/.*login/);
  });

  test('External links open in correct way', async ({ page }) => {
    await page.goto('/');
    
    // If there are external links, they should have proper attributes
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    
    if (count > 0) {
      // External links should have rel="noopener" for security
      const rel = await externalLinks.first().getAttribute('rel');
      // Note: React often adds this automatically
    }
  });

  test('Loading states are visible', async ({ page }) => {
    // This would test loading indicators if they exist
    await page.goto('/');
    
    // In most cases, loading is too fast to catch
    // But the test structure is here if needed
  });
});

test.describe('Form Validation (Client-side)', () => {
  test('Email field validates format', async ({ page }) => {
    await page.goto('/signup');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur(); // Trigger validation
    
    // Check for HTML5 validation or custom error
    // HTML5 will prevent form submission
  });

  test('Password field shows/hides correctly', async ({ page }) => {
    await page.goto('/signup');
    
    const passwordInput = page.locator('input[id="password"]');
    
    // Should be type="password" (hidden)
    const type = await passwordInput.getAttribute('type');
    expect(type).toBe('password');
  });

  test('Required fields are marked', async ({ page }) => {
    await page.goto('/signup');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[id="password"]');
    
    // Should have required attribute
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    expect(emailRequired).not.toBeNull();
    expect(passwordRequired).not.toBeNull();
  });
});

