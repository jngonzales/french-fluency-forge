# AI Agent Context - French Fluency Forge

## Purpose of This Document

This file provides essential context for AI coding assistants (Claude, GPT-4, etc.) working on this codebase. Read this first before making changes.

---

## What Is This App?

**French Fluency Forge** is a comprehensive French language assessment and coaching platform with:
- 6-dimension skill assessment (Pronunciation, Fluency, Confidence, Syntax, Conversation, Comprehension)
- Sales Call Copilot (internal CRM for managing leads and sales calls)
- Member Dashboard (progress tracking with habits, goals, gamification)
- Admin tools (rapid testing and debugging)

**Target Users:**
- **Members:** French learners taking assessments and tracking progress
- **Admins:** Internal team managing sales and testing
- **Coaches:** (Future) Viewing member progress

---

## Critical Information

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Backend:** Supabase (PostgreSQL + Edge Functions in Deno)
- **AI:** Azure Speech API (pronunciation) + OpenAI GPT-4 (other modules)
- **Testing:** Playwright (138 E2E tests)
- **Deployment:** Lovable (auto-deploys from GitHub main branch)

### Database (Supabase PostgreSQL)

**Core tables:**
- `profiles` (user data)
- `assessment_sessions` (assessment tracking)
- `skill_recordings`, `fluency_recordings`, `comprehension_recordings` (audio + scores)
- `sales_leads`, `sales_calls`, `sales_playbook` (CRM)
- `purchases`, `app_accounts` (payment integration)

**All tables have RLS (Row Level Security) enabled.**

### File Structure

```
src/
├── components/          # React components
│   ├── assessment/      # 6 assessment modules
│   ├── sales/          # Sales Copilot components
│   └── ui/             # shadcn/ui primitives
├── pages/              # Route pages
├── features/           # Feature modules
│   └── dashboard/      # Member Dashboard
├── lib/                # Utilities and business logic
│   └── sales/          # Sales decision engine
├── hooks/              # React hooks
├── contexts/           # React contexts (Auth)
└── integrations/       # Supabase client

supabase/
├── functions/          # Edge Functions (Deno)
└── migrations/         # SQL migrations

e2e/                    # Playwright tests
docs/                   # Documentation (you're here)
```

---

## Key Patterns to Follow

### 1. Component Structure

```tsx
// Use functional components with TypeScript
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return <div>{title}</div>;
}
```

### 2. Styling

```tsx
// Use Tailwind + cn() utility
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

### 3. Data Fetching

```tsx
// Use Supabase client directly
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);
```

### 4. Protected Routes

```tsx
// Wrap protected pages
<Route path="/protected" element={
  <ProtectedRoute>
    <ProtectedPage />
  </ProtectedRoute>
} />
```

### 5. Admin-Only Features

```tsx
// Use useAdminMode hook
import { useAdminMode } from '@/hooks/useAdminMode';

const { isAdmin } = useAdminMode();

if (!isAdmin) return null;
```

---

## Important Rules

### DO

✅ **Follow existing patterns** - Look for similar code first
✅ **Use TypeScript** - Define types for all props and data
✅ **Handle errors gracefully** - Try-catch, error boundaries, fallbacks
✅ **Add loading states** - Show spinners/skeletons while loading
✅ **Add empty states** - Handle no data scenarios
✅ **Use anti-school vocabulary** - "member/coach/session/phrases"
✅ **Match SOLV brand** - Use existing colors, fonts, spacing
✅ **Test locally** - Before committing
✅ **Check RLS policies** - When adding database tables
✅ **Use shadcn/ui components** - Don't create custom primitives

### DON'T

❌ **Don't use school vocabulary** - No "student/teacher/lesson/flashcards"
❌ **Don't hardcode secrets** - Use environment variables
❌ **Don't skip error handling** - Always handle errors
❌ **Don't ignore TypeScript errors** - Fix them
❌ **Don't create custom UI primitives** - Use shadcn/ui
❌ **Don't bypass RLS** - Use proper policies
❌ **Don't commit .env files** - Keep secrets out of Git
❌ **Don't use `any` type** - Be explicit with types
❌ **Don't skip loading states** - Users need feedback

---

## Common Scenarios

### Adding a New Assessment Module

1. Create folder in `src/components/assessment/[module]/`
2. Create `[Module]Module.tsx` component
3. Add to `Assessment.tsx` switch statement
4. Create item definitions file
5. Add Edge Function for scoring (if needed)
6. Add to Admin Toolbar jump menu
7. Test with admin tools

### Adding a New Sales Feature

1. Add to `src/lib/sales/` or `src/components/sales/`
2. Update types in `src/lib/sales/types.ts`
3. Update decision engine if needed
4. Test with mock leads
5. Verify RLS policies

### Adding a New Dashboard Card

1. Create component in `src/features/dashboard/components/`
2. Add to `DashboardPage.tsx`
3. Update types if needed
4. Add mock data if needed
5. Test empty state
6. Test with real data

### Fixing a Bug

1. Reproduce the issue
2. Check browser console + Supabase logs
3. Add console.log for debugging
4. Fix the issue
5. Test the fix
6. Remove debug logs
7. Commit with clear message

---

## Data Flow Patterns

### Assessment Recording Flow

```
User clicks Record
  → MediaRecorder starts
  → User speaks
  → User clicks Stop
  → Blob created
  → Convert to base64
  → Send to Edge Function
  → Edge Function processes (Whisper/Azure/GPT-4)
  → Save to database
  → Frontend fetches results
  → Display scores + feedback
```

### Sales Call Flow

```
Admin selects lead
  → Start call
  → Decision engine selects question
  → Admin reads question
  → Lead answers
  → Admin clicks answer button
  → Score recalculated
  → Tags applied
  → Next question selected
  → Repeat until close/disqualify
```

### Dashboard Data Flow

```
User navigates to /dashboard
  → useDashboardData hook
  → Fetch real assessment data (Supabase)
  → Generate mock data (habits, goals, etc.)
  → Combine data
  → Render components
  → User interacts (habits, goals)
  → Update local state
  → (Future: persist to database)
```

---

## Known Issues & Workarounds

### 1. Azure Pronunciation Assessment

**Issue:** Sometimes returns `pronScore: 0` despite good pronunciation

**Workaround:** Fallback calculation from word-level `AccuracyScore` values

**Location:** `supabase/functions/analyze-pronunciation/index.ts`

### 2. WebM Audio Format

**Issue:** Azure prefers WAV, but browsers record WebM

**Workaround:** Azure accepts WebM but may have inconsistent results

**Future:** Convert to WAV before sending

### 3. Dashboard Persistence

**Issue:** Habits and goals stored in local state only

**Workaround:** Data resets on page refresh

**Future:** Add database tables for habits and goals

### 4. Export Functionality

**Issue:** PDF export UI exists but backend incomplete

**Workaround:** Buttons are disabled

**Future:** Implement PDF generation

---

## Integration Points

### Supabase Auth
- Email/password authentication
- Magic links
- JWT tokens
- Session management

### Azure Speech API
- Pronunciation assessment
- Word-level accuracy
- Phoneme-level feedback
- Real-time transcription

### OpenAI API
- Whisper (transcription)
- GPT-4 (scoring, feedback, conversation agent)
- TTS (text-to-speech)

### Systeme.io
- Webhook integration
- Purchase events
- Account creation

---

## Testing Strategy

### E2E Tests (Playwright)
- 138 automated tests
- Multi-browser support
- Test fixtures for auth, audio, database
- Run with: `npm run test:e2e:ui`

### Manual Testing
- Use Admin Toolbar to jump to modules
- Use Live Data Viewer to see real-time data
- Use Session Debugger to inspect database
- Test with real microphone

---

## Performance Targets

- **Page load:** < 3 seconds
- **Time to interactive:** < 5 seconds
- **Audio processing:** < 10 seconds
- **Database queries:** < 500ms
- **Edge Functions:** < 5 seconds

---

## Security Considerations

- **RLS enabled** on all tables
- **Admin access** via email whitelist
- **JWT tokens** for authentication
- **HTTPS only** in production
- **No secrets** in client code
- **Input validation** in Edge Functions

---

## Code Quality Standards

- **TypeScript:** Explicit types, no `any`
- **Linting:** ESLint with React rules
- **Formatting:** Prettier (via Lovable)
- **Testing:** E2E coverage for critical paths
- **Documentation:** Inline comments for complex logic

---

## When Making Changes

### Before Coding
1. Read relevant documentation
2. Check existing similar code
3. Verify feature isn't already implemented
4. Plan the approach

### While Coding
1. Follow existing patterns
2. Use TypeScript
3. Handle errors
4. Add loading states
5. Add empty states
6. Test incrementally

### Before Committing
1. Fix TypeScript errors
2. Fix linting errors
3. Test main user flow
4. Check browser console
5. Verify mobile responsiveness (basic)
6. Write clear commit message

### After Pushing
1. Verify Lovable deployment succeeds
2. Test on production
3. Check for errors in Supabase logs
4. Monitor for issues

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (port 8080)
npm run build            # Production build
npm run lint             # Check code quality

# Testing
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Visual test runner
npm run test:install     # Install Playwright browsers

# Git
git add .                # Stage changes
git commit -m "message"  # Commit
git push origin main     # Push (triggers deployment)
git pull --rebase        # Pull latest
```

---

## Emergency Contacts

**Developer:** Tom Gauthier (tom@solvlanguages.com)

**Resources:**
- Supabase Dashboard
- Lovable Dashboard
- GitHub Repository

---

## Final Notes for AI Agents

- **This is a production app** - Be careful with changes
- **Test thoroughly** - Use admin tools and E2E tests
- **Follow patterns** - Don't reinvent the wheel
- **Ask questions** - If requirements are unclear
- **Document changes** - Update docs if needed
- **Think about users** - UX matters
- **Security first** - RLS, validation, error handling
- **Performance matters** - Optimize where possible

**When in doubt, check existing code for similar patterns.**

