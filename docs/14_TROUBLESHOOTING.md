# Troubleshooting Guide

## Common Issues & Solutions

### Build & Compilation

#### TypeScript Errors

**Symptom:** Build fails with type errors

**Solutions:**
```bash
# Check for errors
npm run lint

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json settings
```

**Common causes:**
- Missing type definitions
- Incorrect import paths
- Mismatched prop types

#### Vite Build Fails

**Symptom:** `npm run build` fails

**Solutions:**
- Check for circular dependencies
- Verify all imports exist
- Check for dynamic imports syntax
- Clear Vite cache: `rm -rf node_modules/.vite`

---

### Authentication

#### Can't Sign In

**Symptom:** Login fails or redirects incorrectly

**Solutions:**
1. Check Supabase Auth settings
2. Verify email confirmation (if required)
3. Check browser console for errors
4. Clear cookies and try again
5. Verify RLS policies on `profiles` table

#### Session Expires Immediately

**Symptom:** Logged out after refresh

**Solutions:**
- Check Supabase Auth token expiry settings
- Verify JWT token storage
- Check for CORS issues
- Verify `AuthContext` is wrapping app

#### Protected Routes Not Working

**Symptom:** Can access protected routes without login

**Solutions:**
- Verify `<ProtectedRoute>` wrapper
- Check `useAuth()` hook returns user
- Verify redirect logic
- Check route configuration

---

### Assessment Modules

#### Audio Recording Fails

**Symptom:** Can't record audio

**Solutions:**
1. **Check microphone permissions:**
   - Browser settings → Site permissions
   - Allow microphone access

2. **Verify HTTPS:**
   - `getUserMedia` requires HTTPS
   - Use `localhost` for dev (allowed)

3. **Check browser support:**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Check version (iOS 14+)

4. **Check console errors:**
   - `NotAllowedError` → Permission denied
   - `NotFoundError` → No microphone found
   - `NotSupportedError` → Browser doesn't support

#### Pronunciation Scoring Returns 0

**Symptom:** Score shows 0.0 despite good pronunciation

**Solutions:**
- Check Edge Function logs for Azure errors
- Verify Azure Speech API key is set
- Check audio format (WebM may have issues)
- Fallback scoring should calculate from word-level data
- Check `analyze-pronunciation` function logs

#### Transcription Fails

**Symptom:** No transcript generated

**Solutions:**
- Check OpenAI API key
- Verify audio blob is valid
- Check Edge Function logs
- Verify Whisper API is accessible
- Check audio duration (too short/long?)

#### Module Won't Advance

**Symptom:** Stuck on a module, can't continue

**Solutions:**
- Check if module is locked
- Verify recording was saved to database
- Check session status
- Use Admin Toolbar → Jump to next module
- Check browser console for errors

---

### Sales Copilot

#### Can't Access Sales Copilot

**Symptom:** 404 or access denied

**Solutions:**
1. Verify you're signed in as admin
2. Check `src/config/admin.ts` - Is your email listed?
3. Sign out and sign in again
4. Check RLS policies in Supabase
5. Verify migration was run

#### No Questions Showing

**Symptom:** Call screen is blank

**Solutions:**
- Check if playbook was seeded
- Verify `sales_playbook` table has data
- Check browser console for errors
- Check `is_active` flag on playbook

#### Can't Create Lead

**Symptom:** Create lead fails

**Solutions:**
- Check RLS policies
- Verify admin access
- Check browser console for errors
- Verify `sales_leads` table exists

#### Auto-linking Not Working

**Symptom:** Lead doesn't link to user

**Solutions:**
- Check email match (case-insensitive)
- Verify trigger `auto_link_lead_trigger` exists
- Check `profiles` table has matching email
- Check function `auto_link_lead_to_user()` exists

---

### Dashboard

#### Dashboard Won't Load

**Symptom:** Blank page or loading forever

**Solutions:**
- Check browser console for errors
- Verify assessment data exists
- Check `useDashboardData` hook
- Verify route is protected
- Check admin padding

#### No Assessment Data Showing

**Symptom:** Empty states everywhere

**Solutions:**
- Complete at least one assessment
- Check `assessment_sessions` table
- Verify `status = 'completed'`
- Check `completed_at` is not null
- Verify recordings exist

#### Charts Not Rendering

**Symptom:** Recharts components don't show

**Solutions:**
- Check data format (arrays, numbers)
- Verify ResponsiveContainer has height
- Check for null/undefined values
- Verify Recharts is installed
- Check browser console for errors

---

### Admin Tools

#### Admin Toolbar Not Showing

**Symptom:** No yellow toolbar at top

**Solutions:**
1. Check `src/config/admin.ts`
2. Add your email to `ADMIN_EMAILS`
3. Sign out and sign in
4. Check `useAdminMode()` returns `isAdmin: true`
5. Clear browser cache

#### Jump to Module Not Working

**Symptom:** Click but nothing happens

**Solutions:**
- Check browser console for errors
- Verify assessment session exists
- Check `sessionStorage` is enabled
- Try "New Session" first
- Verify database update succeeds

#### Live Data Viewer Not Updating

**Symptom:** No data or stale data

**Solutions:**
- Check if recordings are being created
- Verify Edge Functions are processing
- Check auto-refresh interval (3 seconds)
- Verify query is fetching latest data
- Check browser console for fetch errors

---

### Database

#### RLS Policy Blocking Access

**Symptom:** Empty results or access denied

**Solutions:**
1. Check RLS policies on table
2. Verify `auth.uid()` matches `user_id`
3. For admin tables, check `is_admin_user()` function
4. Test query in SQL Editor with RLS disabled
5. Check policy conditions

#### Migration Fails

**Symptom:** SQL error when running migration

**Solutions:**
- Check if table already exists
- Verify foreign key references exist
- Check enum types are defined
- Run migrations in order
- Check for syntax errors

#### Trigger Not Firing

**Symptom:** Auto-linking or timestamps not working

**Solutions:**
- Verify trigger exists: `SELECT * FROM pg_trigger`
- Check trigger function exists
- Verify trigger timing (BEFORE/AFTER)
- Check function has correct signature
- Test function manually

---

### Edge Functions

#### Function Times Out

**Symptom:** Request hangs or times out

**Solutions:**
- Check function logs for errors
- Verify external API is responding
- Add timeout handling
- Check for infinite loops
- Optimize slow operations

#### CORS Errors

**Symptom:** Browser blocks request

**Solutions:**
- Verify CORS headers in function
- Check `OPTIONS` request handling
- Verify origin is allowed
- Check Supabase CORS settings

#### Function Returns 500

**Symptom:** Internal server error

**Solutions:**
- Check function logs in Supabase
- Verify all secrets are set
- Check for unhandled exceptions
- Verify request payload format
- Test function locally

---

### Testing

#### Playwright Tests Fail

**Symptom:** Tests timeout or fail

**Solutions:**
- Verify dev server is running
- Check `playwright.config.ts` baseURL
- Verify test user credentials
- Check for selector changes
- Run with `--debug` flag

#### Test User Creation Fails

**Symptom:** Auth fixture errors

**Solutions:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check test user email format
- Verify Auth is enabled in Supabase
- Check rate limits

---

### Performance

#### App Loads Slowly

**Solutions:**
- Check bundle size: `npm run build`
- Implement code splitting
- Lazy load heavy components
- Optimize images
- Check network tab for slow requests

#### Database Queries Slow

**Solutions:**
- Add indexes on queried columns
- Limit result sets
- Use selective queries (only needed columns)
- Check query execution plan
- Consider caching

#### Edge Functions Slow

**Solutions:**
- Optimize external API calls
- Implement caching
- Reduce payload size
- Use connection pooling
- Check cold start times

---

## Error Messages Decoded

### "Failed to fetch"

**Cause:** Network request failed

**Check:**
- Network connection
- Supabase URL correct
- CORS configuration
- Edge Function deployed

### "Row Level Security policy violation"

**Cause:** RLS blocking access

**Check:**
- User is authenticated
- RLS policy allows operation
- User owns the data
- Admin access if required

### "Invalid JWT"

**Cause:** Auth token issue

**Check:**
- Token not expired
- Token format correct
- Supabase project keys match
- User is still logged in

### "Function not found"

**Cause:** Edge Function doesn't exist

**Check:**
- Function is deployed
- Function name spelled correctly
- Supabase URL correct
- Function path correct

---

## Debug Checklist

When something breaks:

1. **Check browser console** - Look for errors
2. **Check network tab** - Failed requests?
3. **Check Supabase logs** - Edge Function errors?
4. **Check database** - Data exists?
5. **Check RLS policies** - Access allowed?
6. **Check admin tools** - Live Data Viewer, Session Debugger
7. **Reproduce in dev** - Same issue locally?
8. **Check recent changes** - What changed?
9. **Revert if needed** - Git revert
10. **Ask for help** - Provide error details

---

## Prevention

### Before Pushing

- [ ] Test locally
- [ ] Run linter
- [ ] Check TypeScript errors
- [ ] Test main user flows
- [ ] Verify no console errors
- [ ] Check mobile responsiveness

### Code Review Checklist

- [ ] Follows existing patterns
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] Accessible (keyboard, screen readers)
- [ ] Anti-school vocabulary used
- [ ] No hardcoded secrets

---

## Emergency Procedures

### Production is Down

1. Check Lovable status
2. Check Supabase status
3. Check recent GitHub commits
4. Revert last commit if needed
5. Check Edge Function logs
6. Verify environment variables

### Data Loss

1. Check Supabase backups
2. Restore from backup if needed
3. Check if RLS policy hiding data
4. Verify soft deletes (if implemented)
5. Check audit logs

### Security Breach

1. Rotate all API keys immediately
2. Check access logs
3. Verify RLS policies
4. Check for unauthorized data access
5. Notify affected users
6. Document incident

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Playwright Docs:** https://playwright.dev
- **Azure Speech Docs:** https://learn.microsoft.com/azure/ai-services/speech-service/
- **OpenAI Docs:** https://platform.openai.com/docs

