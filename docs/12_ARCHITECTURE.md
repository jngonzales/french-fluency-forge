# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + TypeScript + Vite + Tailwind + shadcn/ui          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Assessment  │  │    Sales     │  │  Dashboard   │     │
│  │   Modules    │  │   Copilot    │  │  (Progress)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │     Auth     │  │    Storage   │     │
│  │   Database   │  │   (JWT)      │  │   (Files)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Edge Functions (Deno)                   │      │
│  │  - analyze-pronunciation  - conversation-agent    │      │
│  │  - analyze-fluency        - french-tts            │      │
│  │  - analyze-skill          - transcribe-*          │      │
│  │  - analyze-syntax         - systemeio-webhook     │      │
│  │  - analyze-comprehension                          │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Azure     │  │   OpenAI     │  │  Systeme.io  │     │
│  │  Speech API  │  │   GPT-4      │  │  (Payments)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Assessment Flow

```
User Records Audio
       ↓
MediaRecorder API (Browser)
       ↓
Audio Blob → Base64
       ↓
Edge Function (Supabase)
       ↓
┌──────────────┐
│ Pronunciation│ → Azure Speech API → Word-level scores
│   Fluency    │ → Whisper (OpenAI) → Transcript → WPM
│   Other      │ → Whisper → Transcript → GPT-4 → Score
└──────────────┘
       ↓
Save to Database (skill_recordings / fluency_recordings / comprehension_recordings)
       ↓
Frontend Polls/Fetches
       ↓
Display Scores & Feedback
```

### Sales Call Flow

```
Admin Creates Lead
       ↓
Auto-link to User (by email)
       ↓
Start Call
       ↓
Decision Engine Selects Question
       ↓
Admin Reads Question → Lead Answers
       ↓
Admin Clicks Answer Button
       ↓
Score Recalculated
       ↓
Tags Applied
       ↓
Next Question Selected
       ↓
Repeat until Close/Disqualify
       ↓
Mark Outcome (won/lost/follow_up)
```

### Dashboard Data Flow

```
User Navigates to /dashboard
       ↓
useDashboardData Hook
       ↓
┌─────────────────────────────────┐
│ Fetch Real Assessment Data      │
│ - Query assessment_sessions     │
│ - Query skill_recordings        │
│ - Query fluency_recordings      │
│ - Calculate baseline vs current │
└─────────────────────────────────┘
       ↓
┌─────────────────────────────────┐
│ Generate Mock Data              │
│ - Habits                        │
│ - Goals                         │
│ - Phrases                       │
│ - Badges                        │
└─────────────────────────────────┘
       ↓
Combine Data
       ↓
Render Dashboard Components
```

## Authentication Flow

```
User Signs Up/Logs In
       ↓
Supabase Auth
       ↓
JWT Token Issued
       ↓
Token Stored in Browser (httpOnly cookie)
       ↓
Profile Created (trigger)
       ↓
User Redirected to /assessment or /dashboard
       ↓
Protected Routes Check Auth
       ↓
AuthContext Provides User State
```

## State Management

### Global State

**AuthContext:**
- User object
- Session state
- Sign in/out methods

**React Query:**
- Server state caching (future)
- Currently: direct Supabase calls

### Local State

**Component State:**
- Form inputs
- UI toggles
- Modal open/close
- Selected items

**Session Storage:**
- Dev mode settings
- Assessment phase override

**Local Storage:**
- Theme preference (future)
- User preferences

## Component Architecture

### Page Components

Top-level route components:
- Handle routing
- Fetch data
- Compose feature components
- Manage page-level state

### Feature Components

Self-contained feature modules:
- Own state management
- Own data fetching
- Reusable across pages
- Clear prop interfaces

### UI Components

Presentational components:
- No business logic
- Pure rendering
- Reusable primitives
- shadcn/ui based

### Shared Components

Cross-cutting concerns:
- AdminToolbar
- DevNav
- LiveDataViewer
- ProtectedRoute

## Database Architecture

### Core Entities

```
users (Supabase Auth)
  ↓
profiles
  ↓
  ├─→ assessment_sessions
  │     ├─→ skill_recordings
  │     ├─→ fluency_recordings
  │     ├─→ comprehension_recordings
  │     └─→ archetype_feedback
  │
  ├─→ purchases
  ├─→ consent_records
  │
  └─→ sales_leads (via email link)
        └─→ sales_calls
```

### Relationships

- **One-to-Many:**
  - User → Assessment Sessions
  - Session → Recordings
  - Lead → Calls

- **One-to-One:**
  - User → Profile (extends auth.users)
  - Session → Archetype Feedback

- **Optional Links:**
  - Lead → User (via email)
  - Session → Purchase

## Security Model

### Row Level Security (RLS)

**Principle:** Database-level access control

**Policies:**
- Users can only access their own data
- Admins can access all data (via `is_admin_user()` function)
- Service role has full access (for Edge Functions)

**Example:**
```sql
CREATE POLICY "Users can view own sessions" 
ON assessment_sessions
FOR SELECT 
USING (auth.uid() = user_id);
```

### Admin Access

**Two-tier system:**
1. **Email-based:** Hardcoded in `is_admin_user()` function
2. **Application-level:** Checked via `useAdminMode()` hook

**Admin features:**
- Admin Toolbar
- Sales Copilot
- View other users' data
- Dev tools in production

## API Architecture

### Edge Functions

**Runtime:** Deno (V8 isolates)

**Pattern:**
```typescript
serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Parse request
  const { data } = await req.json();

  // Process
  const result = await processData(data);

  // Return response
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

**Error Handling:**
```typescript
try {
  // Logic
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: corsHeaders }
  );
}
```

### External API Integration

**Azure Speech API:**
- Pronunciation assessment
- Real-time transcription
- Word-level accuracy
- Phoneme-level feedback

**OpenAI API:**
- Whisper (transcription)
- GPT-4 (scoring, feedback, conversation agent)
- TTS (text-to-speech)

**Systeme.io:**
- Webhook integration
- Purchase events
- Account creation

## Performance Considerations

### Frontend Optimization

- **Code splitting:** Route-based
- **Lazy loading:** Heavy components
- **Memoization:** Expensive calculations
- **Debouncing:** Search inputs
- **Throttling:** Scroll handlers

### Database Optimization

- **Indexes:** On frequently queried columns
- **Selective queries:** Only fetch needed columns
- **Pagination:** For large result sets (future)
- **Caching:** React Query (future)

### Edge Function Optimization

- **Connection pooling:** Reuse Supabase client
- **Parallel requests:** When possible
- **Timeout handling:** Graceful degradation
- **Error recovery:** Retry logic

## Scalability

### Current Limits

- **Supabase Free Tier:**
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth/month
  - 500K Edge Function invocations/month

### Scaling Strategy

1. **Database:**
   - Add indexes as needed
   - Partition large tables (future)
   - Archive old data

2. **Edge Functions:**
   - Optimize cold starts
   - Cache responses
   - Rate limiting

3. **Frontend:**
   - CDN for static assets
   - Image optimization
   - Bundle size monitoring

## Monitoring

### Current Setup

- Browser console logging
- Supabase Edge Function logs
- Database query logs

### Future Enhancements

- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics (PostHog)
- Uptime monitoring (Pingdom)

## Deployment Architecture

```
GitHub (main branch)
       ↓
Lovable Build System
       ↓
┌─────────────────────┐
│  Build Process      │
│  - npm install      │
│  - npm run build    │
│  - Optimize assets  │
└─────────────────────┘
       ↓
Production CDN
       ↓
Users Access via HTTPS
```

## Backup & Recovery

### Database Backups

- **Automatic:** Daily backups (Supabase)
- **Retention:** 7 days
- **Point-in-time recovery:** Available on Pro plan

### Code Backups

- **Git history:** Full version control
- **GitHub:** Remote repository
- **Rollback:** `git revert` + push

### Data Export

```bash
# Export schema
supabase db dump -f schema.sql

# Export data
supabase db dump --data-only -f data.sql
```

## Testing Architecture

### E2E Tests (Playwright)

- **Browser automation:** Chromium, Firefox, WebKit
- **Test fixtures:** Auth, audio, database
- **Parallel execution:** Multiple tests simultaneously
- **Retry logic:** Flaky test handling

### Test Organization

```
e2e/
├── fixtures/         # Reusable test setup
├── helpers/          # Test utilities
├── auth.spec.ts      # Auth tests
├── ui-tests.spec.ts  # UI tests
└── [module].spec.ts  # Module-specific tests
```

## Error Handling Strategy

### Frontend

1. **Try-catch blocks:** Async operations
2. **Error boundaries:** React component errors
3. **Toast notifications:** User-friendly messages
4. **Fallback UI:** Graceful degradation

### Backend

1. **Validation:** Input validation
2. **Error responses:** Structured error format
3. **Logging:** Console + Supabase logs
4. **Retry logic:** Transient failures

### Database

1. **Constraints:** Data integrity
2. **Triggers:** Automatic data management
3. **RLS:** Access control
4. **Transactions:** Atomic operations (future)

