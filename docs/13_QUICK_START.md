# Quick Start Guide

## For New Developers

### 1. Get the Code (2 minutes)

```bash
git clone https://github.com/tomgauth/french-fluency-forge.git
cd french-fluency-forge
npm install
```

### 2. Set Up Environment (3 minutes)

Create `.env` file:
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these from Supabase project settings.

### 3. Run the App (1 minute)

```bash
npm run dev
```

Open `http://localhost:8080`

### 4. Become an Admin (1 minute)

Edit `src/config/admin.ts`:
```typescript
export const ADMIN_EMAILS = [
  'tom@solvlanguages.com',
  'your-email@example.com', // Add your email
];
```

Sign up/login with that email → Yellow admin toolbar appears.

### 5. Explore (5 minutes)

**Try these:**
- Click "Jump to Module" → Select "Pronunciation"
- Record your voice
- See Live Data Viewer (bottom right) update
- Click "Dashboard" to see progress hub
- Click "Sales Copilot" to see CRM

---

## For AI Agents

### Context Files to Read First

**Essential (read these):**
1. `docs/00_OVERVIEW.md` - What this app does
2. `docs/02_DATABASE_SCHEMA.md` - Database structure
3. `docs/03_FEATURES.md` - What's implemented
4. `docs/04_API_REFERENCE.md` - API endpoints

**Detailed (read as needed):**
5. `docs/01_TECH_STACK.md` - Technologies used
6. `docs/05_COMPONENT_STRUCTURE.md` - Code organization
7. `docs/06_ASSESSMENT_MODULES.md` - Assessment details
8. `docs/07_SALES_COPILOT.md` - Sales CRM details
9. `docs/08_ADMIN_TOOLS.md` - Admin features
10. `docs/11_BRAND_IDENTITY.md` - Design system

### Quick Reference

**Tech Stack:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Edge Functions)
- Azure Speech API + OpenAI GPT-4

**Main Features:**
- 6-dimension French assessment
- Sales Call Copilot (CRM)
- Member Dashboard (progress tracking)
- Admin tools (testing, debugging)

**Database Tables:**
- `profiles`, `assessment_sessions`
- `skill_recordings`, `fluency_recordings`, `comprehension_recordings`
- `sales_leads`, `sales_calls`, `sales_playbook`
- `purchases`, `app_accounts`

**Key Patterns:**
- Protected routes with `<ProtectedRoute>`
- Admin-only features via `useAdminMode()`
- Real-time data with Supabase subscriptions
- Audio recording with MediaRecorder API

---

## Common Tasks

### Add a New Feature

1. Create types in `src/features/[feature]/types.ts`
2. Create components in `src/features/[feature]/components/`
3. Add route in `src/App.tsx`
4. Add navigation link (if needed)
5. Test locally
6. Commit and push

### Fix a Bug

1. Reproduce the issue
2. Check browser console for errors
3. Check Supabase Edge Function logs
4. Add console.log for debugging
5. Fix the issue
6. Test the fix
7. Commit and push

### Add a Database Table

1. Create migration: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
2. Write SQL (table, indexes, RLS policies)
3. Run in Supabase SQL Editor
4. Update TypeScript types
5. Create API functions
6. Test locally

### Update UI Component

1. Find component in `src/components/`
2. Make changes
3. Check for TypeScript errors
4. Test in browser
5. Verify responsiveness
6. Commit and push

---

## Testing Checklist

### Before Committing

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Tested main user flow
- [ ] Tested admin features (if applicable)
- [ ] Responsive on mobile (basic check)

### Before Deploying

- [ ] All tests pass: `npm run test:e2e`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Admin access verified

---

## Useful Links

**Live App:** https://[your-lovable-url].lovable.app

**Supabase Dashboard:** https://supabase.com/dashboard/project/[project-ref]

**GitHub Repo:** https://github.com/tomgauth/french-fluency-forge

**Documentation:** `docs/` folder in repo

---

## Getting Help

### Documentation

1. Check `docs/` folder
2. Search codebase for similar patterns
3. Read component comments

### Debugging

1. Browser console
2. Supabase Edge Function logs
3. Admin tools (Live Data Viewer, Session Debugger)
4. Playwright test results

### Common Errors

**"Access denied" in database:**
- Check RLS policies
- Verify user is authenticated
- Check if admin access required

**"Function not found" error:**
- Verify Edge Function deployed
- Check function name spelling
- Verify Supabase URL correct

**Audio recording fails:**
- Check microphone permissions
- Verify HTTPS (required for getUserMedia)
- Check browser compatibility

**Build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Verify all imports exist

---

## Next Steps

1. **Read the docs** (start with `00_OVERVIEW.md`)
2. **Run the app locally**
3. **Become an admin** (add your email)
4. **Explore admin tools**
5. **Run tests** (`npm run test:e2e:ui`)
6. **Make a small change** (test the workflow)
7. **Read code** (start with simple components)
8. **Ask questions** (check existing docs first)

---

## Pro Tips

- **Use Admin Toolbar** - Jump to any module instantly
- **Check Live Data Viewer** - See scores in real-time
- **Use Session Debugger** - Inspect all data
- **Run tests often** - Catch issues early
- **Read existing code** - Follow established patterns
- **Test on real devices** - Don't rely on browser DevTools only
- **Commit often** - Small, focused commits
- **Write clear commit messages** - Follow conventional commits

