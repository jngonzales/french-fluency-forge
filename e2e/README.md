# E2E Test Suite for French Fluency Forge

Comprehensive end-to-end testing using Playwright for the French Fluency Forge assessment application.

## Setup

### 1. Install Dependencies

```bash
npm install
npm run test:install
```

### 2. Configure Environment

Copy the test environment template:

```bash
cp .env.test.example .env.test
```

Fill in your test Supabase credentials:
- Use a **separate test project** or test database
- Never use production credentials
- Service role key is needed for database setup/teardown

### 3. Verify Setup

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
npm run test:e2e
```

## Test Structure

### Test Files

- **`auth.spec.ts`** - Authentication flows (signup, login, password reset)
- **`intake-consent-quiz.spec.ts`** - Intake form, consent, personality quiz
- **`pronunciation.spec.ts`** - Pronunciation module (reading, repeat, minimal pairs)
- **`fluency.spec.ts`** - Fluency module (picture descriptions, WPM calculation)
- **`conversation.spec.ts`** - Conversation module (AI agent interactions)
- **`other-modules.spec.ts`** - Confidence, syntax, comprehension modules
- **`results.spec.ts`** - Results page and score calculations
- **`edge-cases.spec.ts`** - Error scenarios, network failures, validation
- **`critical-paths.spec.ts`** - Complete end-to-end happy paths

### Fixtures

Located in `e2e/fixtures/`:

- **`auth.fixture.ts`** - Authentication helpers and test users
- **`audio.fixture.ts`** - Mock audio recording functionality
- **`database.fixture.ts`** - Database helper functions

### Helpers

Located in `e2e/helpers/`:

- **`navigation.ts`** - Common navigation flows (skip to modules, complete forms, etc.)

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Test File

```bash
npx playwright test auth.spec.ts
```

### With UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

### Debug Mode (Step Through Tests)

```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report

```bash
npm run test:e2e:report
```

## Test Data Management

### Mock Audio Recording

Tests use mocked `MediaRecorder` and `getUserMedia` APIs to simulate audio recording without requiring actual microphone access. The mock is set up in `audio.fixture.ts`.

### Database Cleanup

Each test should:
1. Create fresh test users with unique emails (using timestamps)
2. Clean up after itself (optional, depending on test database strategy)
3. Not interfere with other tests

### Test Users

Tests automatically generate unique test users:

```typescript
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!'
};
```

## Mocking External Services

### Audio Recording

Audio recording is automatically mocked in tests. The mock:
- Simulates microphone permission grant
- Creates valid WebM audio blobs
- Handles recording start/stop

### Backend APIs

For full E2E tests, you need to either:

1. **Use real test backend** (recommended):
   - Deploy Edge Functions to test Supabase project
   - Use test API keys
   - May incur costs for AI services

2. **Mock API responses**:
   ```typescript
   await page.route('**/functions/v1/analyze-pronunciation', route => {
     route.fulfill({
       status: 200,
       body: JSON.stringify({
         pronScore: 85,
         words: [{ word: 'bonjour', accuracyScore: 90 }]
       })
     });
   });
   ```

## Test Coverage

### Authentication (✓)
- Signup with validation
- Login flow
- Password reset
- Activate page
- Session persistence

### Assessment Flow (✓)
- Intake form with all validations
- Consent form
- Personality quiz navigation
- Mic check skip

### Recording Modules (✓)
- Pronunciation (reading, repeat, minimal pairs)
- Fluency (picture descriptions, retry logic)
- Conversation (AI agent interaction)
- Confidence, Syntax, Comprehension

### Results (✓)
- Score calculations
- Radar chart display
- Archetype display
- Raw metrics

### Edge Cases (✓)
- Permission denied
- Network failures
- Invalid data
- Session expiration
- UI edge cases

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tips

### 1. Use UI Mode

The best way to debug tests:

```bash
npm run test:e2e:ui
```

Features:
- Visual test runner
- Time travel debugging
- Network inspection
- Console logs

### 2. Debug Specific Test

```bash
npx playwright test auth.spec.ts:10 --debug
```

### 3. Screenshots and Videos

Configured automatically in `playwright.config.ts`:
- Screenshots on failure
- Videos on failure
- Traces on first retry

### 4. Verbose Logging

```bash
DEBUG=pw:api npx playwright test
```

### 5. Keep Browser Open on Failure

```bash
npx playwright test --headed --debug
```

## Best Practices

### 1. Test Independence

Each test should be completely independent:
- Create its own test user
- Not rely on state from other tests
- Clean up after itself

### 2. Realistic User Behavior

- Use `page.click()` instead of direct API calls
- Wait for elements before interacting
- Use proper selectors (prefer text/aria labels)

### 3. Stable Selectors

Prefer in order:
1. Text content (`text=Submit`)
2. ARIA labels (`button[aria-label="Submit"]`)
3. Data attributes (`[data-testid="submit"]`)
4. IDs (`#submit-button`)
5. Classes (avoid if possible)

### 4. Proper Waits

```typescript
// Good: Wait for specific condition
await page.waitForSelector('text=Success');

// Bad: Arbitrary timeout
await page.waitForTimeout(5000);
```

### 5. Error Messages

Use descriptive assertions:

```typescript
// Good
await expect(page.locator('button:has-text("Submit")')).toBeVisible({
  timeout: 5000
});

// Less helpful
await expect(button).toBeVisible();
```

## Troubleshooting

### Tests Timing Out

1. Increase timeout for specific test:
   ```typescript
   test('long test', async ({ page }) => {
     test.setTimeout(60000);
     // ...
   });
   ```

2. Check if backend is running
3. Verify network requests aren't blocked

### Flaky Tests

1. Add proper waits before assertions
2. Use `waitForLoadState('networkidle')`
3. Increase timeout on slower operations
4. Check for race conditions

### Authentication Issues

1. Verify Supabase credentials
2. Check if test user exists
3. Clear cookies between tests
4. Verify session persistence

## Contributing

When adding new tests:

1. Follow existing patterns
2. Add descriptive test names
3. Use fixtures and helpers
4. Document complex scenarios
5. Ensure tests are independent
6. Update this README

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Configuration](https://playwright.dev/docs/ci)

