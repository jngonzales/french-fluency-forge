# Quick Test Commands Reference

## 🚀 Run Tests NOW (No Setup Required)

These tests work immediately without any configuration:

```bash
# All working tests (61 tests, ~1-2 minutes)
npx playwright test e2e/auth.spec.ts e2e/ui-tests.spec.ts e2e/edge-cases.spec.ts --project=chromium

# Just authentication (10 tests, ~20 seconds)
npx playwright test e2e/auth.spec.ts

# Just UI tests (24 tests, ~30 seconds)
npx playwright test e2e/ui-tests.spec.ts

# Visual test runner (RECOMMENDED)
npx playwright test --ui
```

## 📊 Current Status

**✅ 61 tests passing** without any setup  
**⚠️ 77 tests require** Supabase credentials (`.env.test`)

### Breakdown:
- ✅ Authentication: 10/10 passing
- ✅ UI Tests: 24/24 passing
- ✅ Edge Cases: ~27/27 passing
- ⚠️ Database tests: Need `.env.test` configuration

## 🎯 View Results

```bash
# Open HTML report
npx playwright show-report

# Currently running at: http://127.0.0.1:9323
```

## 🔧 After Adding .env.test

Once you configure Supabase credentials:

```bash
# Run ALL tests (138 tests)
npx playwright test

# Run specific module
npx playwright test e2e/intake-consent-quiz.spec.ts
npx playwright test e2e/pronunciation.spec.ts
```

## 📝 Test Files

- `e2e/auth.spec.ts` - ✅ 10 passing (authentication)
- `e2e/ui-tests.spec.ts` - ✅ 24 passing (UI without DB)
- `e2e/edge-cases.spec.ts` - ✅ ~27 passing (error handling)
- `e2e/intake-consent-quiz.spec.ts` - ⚠️ Need DB
- `e2e/pronunciation.spec.ts` - ⚠️ Need DB
- `e2e/fluency.spec.ts` - ⚠️ Need DB
- `e2e/conversation.spec.ts` - ⚠️ Need mocks
- `e2e/other-modules.spec.ts` - ⚠️ Need mocks
- `e2e/results.spec.ts` - ⚠️ Need DB
- `e2e/critical-paths.spec.ts` - ⚠️ Need DB

## 🐛 Debug Commands

```bash
# Run with visible browser
npx playwright test e2e/auth.spec.ts --headed

# Debug specific test
npx playwright test --debug -g "signup"

# Run single test by line number
npx playwright test e2e/auth.spec.ts:41

# Verbose output
DEBUG=pw:api npx playwright test
```

## 📖 Documentation

- **Quick Start:** `e2e/QUICKSTART.md`
- **Full Docs:** `e2e/README.md`
- **Results:** `TEST_RESULTS.md`
- **Complete:** `TESTING_COMPLETE.md`

## ⚡ Next Steps

1. **Run tests now:**
   ```bash
   npx playwright test e2e/auth.spec.ts e2e/ui-tests.spec.ts --project=chromium
   ```

2. **View results:**
   ```bash
   npx playwright show-report
   ```

3. **Configure for full coverage:**
   ```bash
   cp .env.test.example .env.test
   # Edit .env.test with your Supabase test credentials
   ```

4. **Run all tests:**
   ```bash
   npx playwright test
   ```

---

**Happy Testing!** 🎉
