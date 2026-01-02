# Admin Tools & Developer Mode

## Overview

Comprehensive admin/developer tools for rapid testing and debugging, accessible to configured admin users even in production.

**Configuration:** `src/config/admin.ts`

## Admin Mode Detection

**Hook:** `useAdminMode()`

**Activation:**
- Running in dev mode (`npm run dev`), OR
- Logged in with email in `ADMIN_EMAILS` array

**Returns:**
```typescript
{
  isAdmin: boolean,
  isLoading: boolean,
  isDev: boolean,
  showDevTools: boolean
}
```

## Admin Toolbar

**Location:** Top of screen (fixed position)

**File:** `src/components/AdminToolbar.tsx`

**Features:**
- **Jump to Stage** - Navigate to any assessment stage
  - Intake Form
  - Consent Form
  - Personality Quiz
  - Mic Check
  - Assessment Modules
  - Processing
  - Completed

- **Jump to Module** - Skip directly to assessment module
  - Pronunciation
  - Fluency
  - Confidence
  - Syntax
  - Conversation
  - Comprehension

- **New Session** - Create fresh assessment session

- **Sales Copilot** - Access sales CRM

- **Dashboard** - View member dashboard

- **Current Location** - Shows current route

**Visibility:** Admin-only (yellow toolbar)

**How it works:**
- Updates session status in database
- Stores module in `sessionStorage`
- Reloads or navigates to `/assessment`

---

## Live Data Viewer

**Location:** Bottom right (floating panel)

**File:** `src/components/LiveDataViewer.tsx`

**Features:**
- Real-time score updates
- Transcript display
- AI feedback viewing
- Auto-refresh every 3 seconds
- Last 5 recordings display

**Shows:**
- **Fluency recordings:** WPM, transcript
- **Skill recordings:** Score, transcript, feedback
- **Comprehension recordings:** Score, transcript

**Usage:**
- Automatically appears during assessment
- Updates as recordings are processed
- Helps debug scoring issues
- Verify transcription accuracy

---

## Session Debugger

**Location:** Bottom left (database icon)

**File:** `src/components/DevSessionViewer.tsx`

**Features:**
- **Fluency Tab:** All fluency recordings
- **Skills Tab:** Confidence, syntax, conversation recordings
- **Listening Tab:** Comprehension recordings
- **Events Tab:** Activity log
- **Session Tab:** Full session metadata

**Data Shown:**
- Recording IDs
- Timestamps
- Scores
- Transcripts
- AI feedback
- Attempt numbers
- Superseded status
- Used for scoring flag

**Usage:**
- Click database icon to open
- Navigate between tabs
- Inspect all session data
- Debug scoring issues
- Verify data integrity

---

## Dev Navigation

**Location:** Bottom right (menu icon)

**File:** `src/components/DevNav.tsx`

**Features:**
- Quick route navigation
- Module jumping
- Assessment phase navigation
- Direct links to all pages

**Routes:**
- Home
- Login/Signup
- Assessment
- Results
- Admin Products
- Dev Preview
- Pronunciation QA Test

---

## Dev Tools Pages

### Dev Preview

**Route:** `/dev`

**File:** `src/pages/DevPreview.tsx`

**Purpose:** General development testing page

### Pronunciation QA Test

**Route:** `/dev/pronunciation-test`

**File:** `src/pages/DevPronunciationTest.tsx`

**Features:**
- Test pronunciation assessment
- Pre-recorded audio testing
- Word-level score display
- Audio format validation
- Azure response inspection

**Usage:**
- Test pronunciation scoring
- Verify Azure API integration
- Debug word-level accuracy
- QA test with known audio

---

## Admin Padding

**Component:** `AdminPadding`

**File:** `src/components/AdminPadding.tsx`

**Purpose:**
- Adds top padding when Admin Toolbar is visible
- Prevents content from being hidden behind fixed toolbar
- Wraps page content

**Usage:**
```tsx
<AdminPadding>
  <YourPageContent />
</AdminPadding>
```

---

## Testing Tools

### E2E Test Suite

**Framework:** Playwright

**Location:** `e2e/`

**Test Files:**
- `auth.spec.ts` - Authentication flows (10 tests)
- `ui-tests.spec.ts` - UI/accessibility (24 tests)
- `edge-cases.spec.ts` - Error scenarios (27 tests)
- `intake-consent-quiz.spec.ts` - Form flows
- `pronunciation.spec.ts` - Pronunciation module
- `fluency.spec.ts` - Fluency module
- `conversation.spec.ts` - Conversation module
- `other-modules.spec.ts` - Confidence, syntax, comprehension
- `results.spec.ts` - Results page
- `critical-paths.spec.ts` - End-to-end flows

**Total:** 138 automated tests

**Run Tests:**
```bash
npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Visual test runner
npm run test:e2e:debug  # Debug mode
```

### Test Fixtures

**Location:** `e2e/fixtures/`

- `auth.fixture.ts` - Test user management
- `audio.fixture.ts` - Mock audio recording
- `database.fixture.ts` - Database cleanup

---

## Admin Workflows

### Quick Testing Flow

1. Sign in as admin
2. Click "Jump to Module" → Select module
3. Test module functionality
4. View Live Data Viewer for real-time scores
5. Check Session Debugger for data
6. Jump to next module or reset session

### Sales Call Flow

1. Click "Sales Copilot" in Admin Toolbar
2. Create or select lead
3. Start call
4. Follow question prompts
5. Use objection library as needed
6. Close when qualified
7. Mark outcome

### Dashboard Testing

1. Click "Dashboard" in Admin Toolbar
2. View real assessment data
3. Test habit tracking
4. Create goals
5. Unlock badges (demo tools)
6. Verify all interactions

---

## Configuration

### Admin Emails

**File:** `src/config/admin.ts`

```typescript
export const ADMIN_EMAILS = [
  'tom@solvlanguages.com',
  // Add more admin emails here
];
```

### Environment Variables

**Required:**
```bash
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

**Optional (for testing):**
```bash
SUPABASE_SERVICE_ROLE_KEY=service_key
AZURE_SPEECH_KEY=azure_key
OPENAI_API_KEY=openai_key
```

---

## Security

**Row Level Security:**
- All admin tables check `is_admin_user()` function
- Function validates email against hardcoded list
- Non-admins get empty results (RLS blocks access)

**Admin Toolbar:**
- Only renders if `useAdminMode()` returns true
- Checks on every render
- No sensitive data exposed to non-admins

**Sales Data:**
- Completely isolated from user data
- Admin-only policies on all sales tables
- Auto-linking is one-way (read-only)

---

## Troubleshooting

### Admin Toolbar Not Showing

1. Check `src/config/admin.ts` - Is your email in the list?
2. Sign out and sign in again
3. Check browser console for errors
4. Verify `useAdminMode()` hook returns `isAdmin: true`

### Jump to Module Not Working

1. Ensure you have an assessment session
2. Check browser console for errors
3. Verify `sessionStorage` is enabled
4. Try "New Session" first

### Live Data Viewer Not Updating

1. Check if recordings are being created in database
2. Verify Edge Functions are processing
3. Check browser console for fetch errors
4. Try refreshing the page

### Sales Copilot Access Denied

1. Verify you're signed in as admin
2. Check RLS policies in Supabase
3. Verify migration was run successfully
4. Check browser console for 403 errors

