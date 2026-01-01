# E2E Testing Quick Start Guide

## Installation (5 minutes)

### 1. Install Playwright

```bash
npm install
npm run test:install
```

This installs Playwright and browser binaries (Chromium, Firefox, WebKit).

### 2. Set Up Test Environment

Create `.env.test` file in project root:

```bash
# Supabase Test Project (use separate test project!)
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173
```

**Important:** Use a **separate test Supabase project** to avoid affecting production data.

## Running Tests (2 minutes)

### Quick Test Run

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### Visual Test Runner (Recommended)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- Click to run individual tests
- Watch tests execute in real-time
- Time-travel through test steps
- Inspect network requests
- See console logs

## What's Included

### ✅ 100+ Test Cases Covering:

#### Authentication (10 tests)
- Signup with validation
- Login flow
- Password reset
- Activation flow
- Session persistence

#### Assessment Flow (15 tests)
- Intake form (all validations)
- Consent form
- Personality quiz navigation
- Question persistence

#### Recording Modules (25 tests)
- **Pronunciation**: Reading, repeat, minimal pairs
- **Fluency**: Picture descriptions, retry logic, module locking
- **Conversation**: AI agent interactions

#### Other Modules (12 tests)
- Confidence (questionnaire + speaking)
- Syntax
- Comprehension

#### Results Page (15 tests)
- Score calculations
- Radar chart
- Archetype display
- Data sources verification

#### Edge Cases (25 tests)
- Permission errors
- Network failures
- Form validation attacks
- Session expiration
- UI edge cases

#### Critical Paths (5 tests)
- Full signup → assessment → results flow
- Session resumption
- Audio recording flow

## Test Structure

```
e2e/
├── auth.spec.ts                  # Authentication flows
├── intake-consent-quiz.spec.ts   # Pre-assessment forms
├── pronunciation.spec.ts         # Pronunciation module
├── fluency.spec.ts              # Fluency module
├── conversation.spec.ts         # Conversation with AI
├── other-modules.spec.ts        # Confidence, Syntax, Comprehension
├── results.spec.ts              # Results page
├── edge-cases.spec.ts           # Error scenarios
├── critical-paths.spec.ts       # End-to-end flows
├── fixtures/
│   ├── auth.fixture.ts          # Auth helpers
│   ├── audio.fixture.ts         # Mock audio recording
│   └── database.fixture.ts      # DB helpers
└── helpers/
    └── navigation.ts            # Common flows
```

## Common Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI (best for development)
npm run test:e2e:ui

# Run specific file
npx playwright test auth.spec.ts

# Run specific test
npx playwright test auth.spec.ts -g "signup"

# Debug mode (step through)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# Generate test code
npm run test:e2e:codegen

# View last test report
npm run test:e2e:report
```

## What Gets Tested

### ✅ Fully Tested (Ready to Run)

- **Authentication**: All flows work without backend
- **Form Validation**: All validation rules tested
- **UI Navigation**: Complete navigation flows
- **Session Management**: Persistence and resumption
- **Error Handling**: Permission errors, network failures

### ⚠️ Requires Backend Mocking

Some tests require API responses and will need mocking:

1. **Audio Analysis** (Pronunciation, Fluency):
   - Mock `/functions/v1/analyze-pronunciation`
   - Mock `/functions/v1/analyze-fluency`

2. **Conversation Agent**:
   - Mock `/functions/v1/conversation-agent`

3. **TTS Service**:
   - Mock `/functions/v1/french-tts`

Example mock in test:

```typescript
await page.route('**/functions/v1/analyze-pronunciation', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({
      pronScore: 85,
      accuracyScore: 85,
      words: [
        { word: 'bonjour', accuracyScore: 90, errorType: 'None' }
      ]
    })
  });
});
```

## Debugging Failed Tests

### 1. Use UI Mode First

```bash
npm run test:e2e:ui
```

Click failed test → See step-by-step execution with screenshots

### 2. Check Test Output

Failed tests automatically capture:
- Screenshot of failure
- Video recording
- Network logs
- Console logs

Located in: `test-results/` directory

### 3. Debug Specific Test

```bash
npx playwright test auth.spec.ts:15 --debug
```

### 4. Run in Headed Mode

```bash
npx playwright test auth.spec.ts --headed
```

Watch the browser as test runs.

## Tips for Success

### 1. Start with Simple Tests

Begin with auth tests - they don't require mocking:

```bash
npx playwright test auth.spec.ts
```

### 2. Use UI Mode for Development

It's the fastest way to understand what tests do:

```bash
npm run test:e2e:ui
```

### 3. Mock Backend Responses

For tests that interact with Edge Functions, add mocks:

```typescript
test('my test', async ({ page }) => {
  // Mock the backend
  await page.route('**/functions/**', route => {
    route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  });
  
  // Rest of test...
});
```

### 4. Test in Isolation

Each test creates its own user with unique email:

```typescript
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!'
};
```

No conflicts between tests!

### 5. Check GitHub Actions

Tests run automatically on push/PR. Check `.github/workflows/` for CI configuration.

## Next Steps

1. **Run tests locally**:
   ```bash
   npm run test:e2e:ui
   ```

2. **Add backend mocks** for Edge Functions

3. **Integrate with CI/CD**

4. **Add custom tests** for your specific scenarios

5. **Review test reports** after each run

## Getting Help

- **Playwright Docs**: https://playwright.dev/
- **Test File Comments**: Each test has detailed comments
- **README.md**: Full documentation in `e2e/README.md`

## Summary

You now have **100+ automated E2E tests** covering:
- ✅ All authentication flows
- ✅ Complete assessment journey
- ✅ All 6 assessment modules
- ✅ Results page and scoring
- ✅ Edge cases and errors
- ✅ Critical user paths

**Ready to run!** Start with:
```bash
npm run test:e2e:ui
```

