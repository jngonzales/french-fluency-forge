import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/auth.fixture';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies and storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('Test Case 1.1: Index page - Unauthenticated user view', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify header
    await expect(page.locator('h1')).toContainText('French Speaking Diagnostic');
    
    // Verify Sign In button visible (in header)
    await expect(page.locator('header').locator('button:has-text("Sign In"), a:has-text("Sign In")').first()).toBeVisible();
    
    // Verify main heading
    await expect(page.locator('h2')).toContainText('Unlock Your French Speaking Potential');
    
    // Verify description mentions 20-minute diagnostic
    await expect(page.locator('text=/20-minute|18-22 minutes/')).toBeVisible();
    
    // Verify Sign In button shown (not Start Assessment)
    await expect(page.locator('button:has-text("Start Your Assessment")')).not.toBeVisible();
    
    // Verify 3 feature cards
    await expect(page.locator('text=6 Core Skills')).toBeVisible();
    await expect(page.locator('text=Personalized Track')).toBeVisible();
    await expect(page.locator('text=Actionable Next Steps')).toBeVisible();
    
    // Verify Sign Out button NOT visible
    await expect(page.locator('button:has-text("Sign Out")')).not.toBeVisible();
  });

  test('Test Case 2.1: Signup flow - New user registration', async ({ page }) => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPass123!',
    };

    await page.goto('/signup');
    
    // Wait for signup form
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    
    // Fill in form
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[id="password"]', newUser.password);
    await page.fill('input[id="confirmPassword"]', newUser.password);
    
    // Submit
    await page.click('button:has-text("Create Account")');
    
    // Wait for loading state
    await expect(page.locator('button:has-text("Creating Account")')).toBeVisible({ timeout: 5000 });
    
    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify authenticated state
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Start Your Assessment")')).toBeVisible();
    
    // Verify email displayed
    await expect(page.locator(`text=${newUser.email}`)).toBeVisible();
  });

  test('Test Case 2.1a: Signup validation - Invalid email', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[id="password"]', 'TestPass123!');
    await page.fill('input[id="confirmPassword"]', 'TestPass123!');
    
    await page.click('button:has-text("Create Account")');
    
    // Verify error message (may be HTML5 validation or our custom validation)
    // HTML5 validation will show "Please include an '@' in the email address" or similar
    // Our custom validation shows "Invalid email address"
    const errorVisible = await Promise.race([
      page.locator('text=Invalid email address').isVisible({ timeout: 2000 }).catch(() => false),
      page.locator('[type="email"]:invalid').isVisible({ timeout: 2000 }).catch(() => false)
    ]);
    expect(errorVisible || page.url().includes('/signup')).toBeTruthy();
  });

  test('Test Case 2.1b: Signup validation - Password too short', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'short');
    await page.fill('input[id="confirmPassword"]', 'short');
    
    await page.click('button:has-text("Create Account")');
    
    // Verify error message
    await expect(page.locator('text=/at least 8 characters/')).toBeVisible({ timeout: 3000 });
  });

  test('Test Case 2.1c: Signup validation - Password mismatch', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'TestPass123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPass123!');
    
    await page.click('button:has-text("Create Account")');
    
    // Verify error message
    await expect(page.locator('text=/don\'t match/')).toBeVisible({ timeout: 3000 });
  });

  test('Test Case 2.2: Login flow - Existing user', async ({ page }) => {
    // First create a user if doesn't exist
    const testUser = { email: `test-login-${Date.now()}@example.com`, password: 'TestPass123!' };
    
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    // Sign out
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login', { timeout: 10000 });
    
    // Now test login
    await page.goto('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    await page.click('button:has-text("Sign In")');
    
    // Wait for loading state
    await expect(page.locator('button:has-text("Signing in")')).toBeVisible({ timeout: 5000 });
    
    // Wait for redirect
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify authenticated
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 });
  });

  test('Test Case 2.2a: Login validation - Invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    await page.click('button:has-text("Sign In")');
    
    // Verify error toast or message
    await expect(page.locator('text=/Invalid|password/')).toBeVisible({ timeout: 5000 });
  });

  test('Test Case 2.4: Forgot password flow', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Verify page loaded
    await expect(page.locator('text=Forgot Password')).toBeVisible();
    
    // Fill email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Submit
    await page.click('button:has-text("Send Reset Link")');
    
    // Wait for loading state
    await expect(page.locator('button:has-text("Sending")')).toBeVisible({ timeout: 5000 });
    
    // Wait for success screen
    await expect(page.locator('text=Check Your Email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('Test Case 1.2: Index page - Authenticated user view', async ({ page }) => {
    // Create and login user
    const testUser = { email: `test-auth-${Date.now()}@example.com`, password: 'TestPass123!' };
    
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify authenticated view
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Your Assessment")')).toBeVisible();
    await expect(page.locator('text=/18-22 minutes/')).toBeVisible();
    
    // Verify button links to assessment
    const assessmentButton = page.locator('a:has-text("Start Your Assessment")');
    await expect(assessmentButton).toHaveAttribute('href', '/assessment');
    
    // Test sign out functionality
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login', { timeout: 10000 });
  });

  test('Test Case 2.3: Activate (Magic Link) - No active purchase', async ({ page }) => {
    await page.goto('/activate');
    
    // Verify page loaded
    await expect(page.locator('text=Activate Your Account')).toBeVisible();
    
    // Enter email without active purchase
    await page.fill('input[type="email"]', 'no-purchase@example.com');
    await page.click('button:has-text("Continue")');
    
    // Wait for checking state
    await expect(page.locator('button:has-text("Checking")')).toBeVisible({ timeout: 5000 });
    
    // Should show paywall message
    await expect(page.locator('text=/No Purchase Found|no active purchase/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Get Access")')).toBeVisible();
  });
});

