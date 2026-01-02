# Deployment & Environment Setup

## Deployment Platform

**Platform:** Lovable (lovable.dev)

**Auto-deployment:**
- Pushes to GitHub `main` branch trigger automatic deployment
- Build runs on Lovable infrastructure
- Deploys to production automatically
- No manual deployment steps required

## GitHub Integration

**Repository:** `tomgauth/french-fluency-forge`

**Workflow:**
1. Make changes locally
2. Commit to `main` branch
3. Push to GitHub
4. Lovable detects push
5. Builds and deploys automatically
6. Live in ~2-5 minutes

## Environment Variables

### Required (Frontend)

Set in Lovable project settings:

```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required (Supabase Edge Functions)

Set in Supabase dashboard → Edge Functions → Secrets:

```bash
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=eastus
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Supabase Setup

### 1. Project Creation

1. Go to supabase.com
2. Create new project
3. Note project URL and keys

### 2. Database Migrations

**Run migrations in order:**

Navigate to SQL Editor in Supabase dashboard, then run each migration file:

1. `20251227095032_1d079ce4-40a4-444f-9b72-bf325c0add22.sql` - Initial schema
2. `20251227095040_ab59e67b-587b-4e4d-98c2-d9dffee3dab2.sql` - Additional tables
3. `20251227102824_f9d12fc0-8602-4b6b-bd4f-a85ff089b074.sql` - More tables
4. `20251231005752_27f67131-4335-44bb-a28c-51f0e4f8569c.sql` - Updates
5. `20251231013254_9991f2a7-bd1d-4add-aaed-1651ccabf64e.sql` - More updates
6. `20251231030934_50a34ff6-3db6-45c8-acb5-3831e9bd0c13.sql` - Additional features
7. `20251231071040_1ebe9ac4-2e3d-4b62-b41d-9cd9c3d4290b.sql` - More features
8. `20251231092110_5971b3f9-2da0-443e-baa5-d6ae3f4fdf12.sql` - Updates
9. `20251231104044_6fc3489f-fa02-4342-9be4-6dd512f5d20d.sql` - More updates
10. `20251231111732_51d7876c-6308-4001-b2e2-94fa4d8b2105.sql` - Latest updates
11. `20260101212344_sales_copilot.sql` - Sales Copilot tables

**How to run:**
- Copy entire migration file contents
- Paste into Supabase SQL Editor
- Click "Run"
- Verify success

### 3. Edge Functions Deployment

**Deploy from local:**
```bash
supabase functions deploy analyze-pronunciation
supabase functions deploy analyze-fluency
supabase functions deploy analyze-skill
supabase functions deploy analyze-syntax
supabase functions deploy analyze-comprehension
supabase functions deploy conversation-agent
supabase functions deploy french-tts
supabase functions deploy transcribe-pronunciation
supabase functions deploy systemeio-webhook
```

**Or deploy all:**
```bash
supabase functions deploy
```

### 4. Set Edge Function Secrets

```bash
supabase secrets set AZURE_SPEECH_KEY=your_key
supabase secrets set AZURE_SPEECH_REGION=eastus
supabase secrets set OPENAI_API_KEY=sk-...
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/tomgauth/french-fluency-forge.git
cd french-fluency-forge

# Install dependencies
npm install

# Install Playwright (for testing)
npm run test:install

# Set up environment variables
# Create .env file with Supabase credentials
echo "VITE_SUPABASE_URL=your_url" > .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=your_key" >> .env

# Start dev server
npm run dev
```

**Dev server runs on:** `http://localhost:8080`

### Development Workflow

1. Make changes in `src/`
2. Vite hot-reloads automatically
3. Test locally
4. Commit changes
5. Push to GitHub
6. Lovable auto-deploys

## Build Process

### Local Build

```bash
npm run build
```

**Output:** `dist/` folder

### Production Build (Lovable)

Lovable runs:
```bash
npm install
npm run build
```

**Optimizations:**
- Code splitting
- Tree shaking
- Minification
- Asset optimization

## Environment-Specific Behavior

### Development Mode

- `import.meta.env.DEV === true`
- Admin tools always visible
- Console logging enabled
- Hot module replacement
- Source maps enabled

### Production Mode

- `import.meta.env.DEV === false`
- Admin tools only for configured admins
- Console logging minimal
- Optimized bundles
- No source maps

## Monitoring & Debugging

### Browser Console

Check for errors:
- Network tab for failed requests
- Console tab for JavaScript errors
- Application tab for storage/session data

### Supabase Dashboard

Monitor:
- Database → Table Editor (view data)
- Database → SQL Editor (run queries)
- Edge Functions → Logs (function execution)
- Auth → Users (user management)
- Storage → Files (if using storage)

### Error Tracking

Currently: Browser console only

Future: Consider adding Sentry or similar

## Performance

### Bundle Size

- Main bundle: ~500KB (gzipped)
- Lazy-loaded routes
- Code splitting by route

### Optimization Tips

1. Use lazy loading for heavy components
2. Memoize expensive calculations
3. Use React.memo for pure components
4. Optimize images (use WebP)
5. Minimize bundle size (tree shaking)

## Rollback

If deployment breaks:

1. **Revert in GitHub:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Lovable will auto-deploy the revert**

3. **Or manually revert in Lovable dashboard** (if available)

## Database Backups

**Supabase automatic backups:**
- Daily backups (retained 7 days)
- Point-in-time recovery (if on Pro plan)

**Manual backup:**
```bash
# Export schema
supabase db dump -f schema.sql

# Export data
supabase db dump --data-only -f data.sql
```

## Troubleshooting Deployment

### Build Fails

1. Check Lovable build logs
2. Verify all dependencies in `package.json`
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npm run lint`

### Runtime Errors in Production

1. Check browser console
2. Verify environment variables set in Lovable
3. Check Supabase Edge Function logs
4. Verify database migrations ran successfully

### Database Connection Issues

1. Verify Supabase project is active
2. Check RLS policies aren't blocking access
3. Verify API keys are correct
4. Check CORS settings in Supabase

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] RLS enabled on all tables
- [ ] Admin emails configured correctly
- [ ] Edge Function secrets set
- [ ] HTTPS only in production
- [ ] No sensitive data in client-side code
- [ ] API keys rotated regularly

