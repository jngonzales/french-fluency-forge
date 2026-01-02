# Development Guide

## Getting Started

### First Time Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/tomgauth/french-fluency-forge.git
   cd french-fluency-forge
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   ```

4. **Access app:**
   - Open `http://localhost:8080`
   - Sign up or login
   - Start testing

### Becoming an Admin

1. Edit `src/config/admin.ts`
2. Add your email to `ADMIN_EMAILS` array
3. Sign in with that email
4. Yellow admin toolbar appears

## Project Structure

```
french-fluency-forge/
├── src/
│   ├── components/       # React components
│   │   ├── assessment/   # Assessment modules
│   │   ├── sales/        # Sales Copilot
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Route pages
│   ├── features/         # Feature modules
│   │   └── dashboard/    # Member Dashboard
│   ├── lib/              # Utilities
│   │   └── sales/        # Sales engine
│   ├── hooks/            # React hooks
│   ├── contexts/         # React contexts
│   └── integrations/     # External services
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
├── e2e/                  # Playwright tests
├── docs/                 # Documentation
└── public/               # Static assets
```

## Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link (if needed)
4. Test routing

Example:
```tsx
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}

// src/App.tsx
import NewPage from "./pages/NewPage";
// Add route:
<Route path="/new-page" element={<NewPage />} />
```

### Adding a New Component

1. Create component in appropriate directory
2. Export from index file (if applicable)
3. Import where needed
4. Use TypeScript for props

Example:
```tsx
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Adding a New Edge Function

1. Create folder in `supabase/functions/`
2. Create `index.ts` with Deno code
3. Test locally with Supabase CLI
4. Deploy: `supabase functions deploy function-name`

Example:
```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { data } = await req.json();
  
  // Your logic here
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Adding a Database Table

1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write SQL (CREATE TABLE, indexes, RLS policies)
3. Run in Supabase SQL Editor
4. Regenerate types (if using Supabase CLI)

### Updating Supabase Types

```bash
# If using Supabase CLI
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Or manually update `src/integrations/supabase/types.ts`

## Code Style

### TypeScript

- Use explicit types for props
- Avoid `any` when possible
- Use interfaces for objects
- Use type aliases for unions

### React

- Functional components only
- Hooks for state management
- Props destructuring
- Named exports preferred

### Styling

- Tailwind utility classes
- Use `cn()` for conditional classes
- shadcn/ui components
- Consistent spacing (4, 6, 8, 12, 16, 24)

### Naming Conventions

- **Components:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase with `use` prefix (`useMyHook.ts`)
- **Utilities:** camelCase (`myUtil.ts`)
- **Types:** PascalCase (`MyType`)
- **Constants:** UPPER_SNAKE_CASE (`MY_CONSTANT`)

## Testing

### Running Tests

```bash
# All tests
npm run test:e2e

# Visual test runner (recommended)
npm run test:e2e:ui

# Specific test file
npx playwright test e2e/auth.spec.ts

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

### Writing Tests

1. Create test file in `e2e/`
2. Use Playwright fixtures
3. Follow existing patterns
4. Test happy paths first

Example:
```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /SOLV/i })).toBeVisible();
});
```

## Debugging

### Frontend Debugging

1. **Browser DevTools:**
   - Console for errors
   - Network tab for API calls
   - React DevTools for component tree

2. **Admin Tools:**
   - Live Data Viewer for real-time data
   - Session Debugger for database inspection
   - Dev Nav for quick navigation

3. **Console Logging:**
   ```typescript
   console.log('Debug:', data);
   console.error('Error:', error);
   ```

### Backend Debugging

1. **Supabase Edge Function Logs:**
   - Go to Supabase dashboard
   - Edge Functions → Select function → Logs
   - View execution logs and errors

2. **Database Queries:**
   - Use SQL Editor to run test queries
   - Check RLS policies if access denied
   - Verify foreign key relationships

3. **API Testing:**
   - Use Postman or curl
   - Test Edge Functions directly
   - Check request/response format

## Common Issues

### Build Errors

**TypeScript errors:**
```bash
npm run lint
```
Fix type errors in reported files.

**Missing dependencies:**
```bash
npm install
```

**Cache issues:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Runtime Errors

**Supabase connection:**
- Verify environment variables
- Check network tab for 401/403 errors
- Verify RLS policies

**Audio recording:**
- Check microphone permissions
- Verify HTTPS (required for getUserMedia)
- Check browser compatibility

**Edge Function errors:**
- Check function logs in Supabase
- Verify secrets are set
- Check request payload format

## Git Workflow

### Branching Strategy

Currently: Direct commits to `main`

Recommended for team:
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: Add my feature"

# Push to GitHub
git push origin feature/my-feature

# Create pull request
# Merge to main after review
```

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

Examples:
```
feat: Add member dashboard with progress timeline
fix: Pronunciation scoring fallback calculation
docs: Add API reference documentation
```

## Performance Optimization

### Code Splitting

```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Memoization

```tsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

### Image Optimization

- Use WebP format
- Lazy load images
- Responsive images with srcset
- Compress before upload

## Security Best Practices

### Frontend

- Never store secrets in client code
- Validate all user input
- Sanitize displayed data
- Use HTTPS only
- Implement CSRF protection

### Backend

- Use RLS for all tables
- Validate input in Edge Functions
- Use parameterized queries
- Rate limit API calls
- Log security events

### Auth

- Use Supabase Auth (secure by default)
- Implement proper session management
- Require email verification
- Use strong password requirements
- Implement account lockout

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Visual test runner
npm run test:e2e:debug   # Debug tests

# Linting
npm run lint             # Check code quality

# Git
git status               # Check changes
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push origin main     # Push to GitHub
git pull --rebase        # Pull latest changes
```

## Resources

- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Supabase Docs:** https://supabase.com/docs
- **Playwright Docs:** https://playwright.dev
- **Recharts Docs:** https://recharts.org

## Getting Help

1. Check existing documentation in `docs/`
2. Search codebase for similar patterns
3. Check browser console for errors
4. Review Supabase logs
5. Check GitHub issues (if applicable)

