import { test as base, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test user credentials
export const TEST_USERS = {
  new: {
    email: `test-new-${Date.now()}@example.com`,
    password: 'TestPass123!',
  },
  existing: {
    email: 'test-existing@example.com',
    password: 'TestPass123!',
  },
  intake: {
    email: 'test-intake@example.com',
    password: 'TestPass123!',
  },
  assessment: {
    email: 'test-assessment@example.com',
    password: 'TestPass123!',
  },
  completed: {
    email: 'test-completed@example.com',
    password: 'TestPass123!',
  },
};

type AuthFixtures = {
  authenticatedPage: Page;
  supabaseAdmin: ReturnType<typeof createClient>;
};

export const test = base.extend<AuthFixtures>({
  supabaseAdmin: async ({}, use) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials for testing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    await use(supabase);
  },

  authenticatedPage: async ({ page, supabaseAdmin }, use) => {
    // Create a test user if doesn't exist
    const testUser = TEST_USERS.existing;
    
    // Try to sign up (will fail if exists, which is fine)
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    
    // Click and wait for either success or error
    await Promise.race([
      page.click('button[type="submit"]'),
      page.waitForTimeout(1000),
    ]);

    // Now login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify authenticated state
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 5000 });

    await use(page);

    // Cleanup: sign out
    await page.click('button:has-text("Sign Out")');
  },
});

export { expect } from '@playwright/test';

