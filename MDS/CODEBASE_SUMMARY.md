# French Fluency Forge - Complete Codebase Summary

**Last Updated:** January 2, 2026  
**Version:** 1.0.0  
**Status:** Production

---

## 📋 Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Features Implemented](#features-implemented)
5. [API Endpoints](#api-endpoints)
6. [File Structure](#file-structure)
7. [Key Components](#key-components)
8. [Admin Tools](#admin-tools)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Quick Commands](#quick-commands)

---

## What This App Does

### Core Product

**French Fluency Forge** evaluates French language proficiency across 6 dimensions:
1. **Pronunciation** - Azure Speech API for word-level accuracy
2. **Fluency** - WPM calculation from picture descriptions
3. **Confidence** - Questionnaire + speaking assessment
4. **Syntax** - Grammar accuracy via AI
5. **Conversation** - Multi-turn AI agent interactions
6. **Comprehension** - Listening comprehension

### Additional Systems

- **Sales Call Copilot:** Internal CRM with rule-based decision engine for managing high-ticket sales calls
- **Member Dashboard:** Progress tracking with timeline, habits, goals, badges, and gamification
- **Admin Tools:** Developer-friendly testing tools (jump navigation, live data viewer, session debugger)

---

## Tech Stack

### Frontend
- **React 18.3.1** + **TypeScript 5.8.3** + **Vite 5.4.19**
- **Tailwind CSS 3.4.17** + **shadcn/ui** (Radix UI)
- **React Router 6.30.1** - Client-side routing
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Edge Functions (Deno runtime)
  - Authentication (JWT)
  - Row Level Security (RLS)

### External APIs
- **Azure Speech API** - Pronunciation assessment
- **OpenAI GPT-4** - Conversation agent, scoring, feedback
- **Systeme.io** - Payment processing

### Testing
- **Playwright 1.57.0** - 138 E2E tests

---

## Database Schema

### Core Tables

#### `profiles`
```sql
id (UUID, PK, FK → auth.users)
email (TEXT)
created_at, updated_at (TIMESTAMPTZ)
```

#### `assessment_sessions`
```sql
id (UUID, PK)
user_id (UUID, FK → profiles)
status (ENUM: intake, consent, quiz, mic_check, assessment, processing, completed, abandoned)
gender, age_band, languages_spoken, goals, primary_track
archetype (TEXT)
fluency_locked, confidence_locked, etc. (BOOLEAN)
started_at, completed_at, created_at, updated_at (TIMESTAMPTZ)
```

#### `skill_recordings`
```sql
id (UUID, PK)
session_id, user_id (UUID, FK)
module_type (TEXT: pronunciation, confidence, syntax, conversation)
item_id (TEXT)
attempt_number (INTEGER)
duration_seconds (NUMERIC)
transcript, ai_score, ai_feedback, ai_breakdown (TEXT/NUMERIC/JSONB)
status (TEXT: processing, completed, failed)
superseded, used_for_scoring (BOOLEAN)
created_at, completed_at (TIMESTAMPTZ)
```

#### `fluency_recordings`
```sql
id, session_id, user_id, item_id, attempt_number
duration_seconds, transcript, wpm, ai_feedback
status, superseded, used_for_scoring
created_at, completed_at
```

#### `comprehension_recordings`
```sql
id, session_id, user_id, item_id, attempt_number
audio_played_at, transcript
ai_score, ai_confidence, ai_feedback_fr
intent_match, understood_facts (JSONB)
status, superseded, used_for_scoring
created_at, completed_at
```

### Sales Tables

#### `sales_leads`
```sql
id, name, email
linked_user_id (UUID, FK → profiles, auto-linked by email)
timezone, country, current_level, goal, deadline_urgency, motivation
biggest_blockers, past_methods_tried (TEXT[])
time_available_per_week, willingness_to_speak, budget_comfort (INTEGER)
decision_maker (TEXT: yes/no/unsure)
notes, created_at, updated_at, created_by
```

#### `sales_calls`
```sql
id, lead_id (UUID, FK → sales_leads)
stage (ENUM: rapport, diagnose, qualify, present, objections, close, next_steps)
transcript_notes, tags, answers (TEXT/JSONB)
outcome (ENUM: won, lost, follow_up, refer_out)
follow_up_email, summary
qualification_score (INTEGER, 0-100)
qualification_reason
created_at, updated_at, created_by
```

#### `sales_playbook`
```sql
id, version, name
playbook_data (JSONB - full playbook structure)
is_active (BOOLEAN)
created_at, updated_at, created_by
```

### Support Tables

- `purchases` - Payment records (Systeme.io integration)
- `app_accounts` - Account access management
- `consent_records` - GDPR compliance
- `archetype_feedback` - Personality quiz results

---

## Features Implemented

### ✅ Authentication
- Email/password signup and login
- Magic link authentication
- Password reset flow
- Email verification
- Protected routes

### ✅ Assessment System
- **Intake Form** - Demographics, goals, language background
- **Consent Form** - GDPR compliance, recording consent
- **Personality Quiz** - 8 question types, archetype identification
- **Mic Check** - Audio setup verification
- **6 Assessment Modules** - Full implementation
- **Processing View** - Score calculation
- **Results Page** - Radar chart, score breakdowns

### ✅ Sales Call Copilot
- Lead management (inbox, detail, create)
- Call screen (3-column layout)
- Decision engine (rule-based)
- Qualification scoring (0-100, live updates)
- Objection library (9 objections with talk tracks)
- Close panel (payment options, checkout link)
- Auto-linking (leads to users by email)
- Playbook management (JSONB storage)

### ✅ Member Dashboard
- Progress timeline (real assessment data + projections)
- 6-dimension radar chart (baseline vs current)
- Habit tracker grid (clickable cells, streak tracking)
- Goals manager (skill/volume/freeform goals)
- Phrase stats (recall vs recognition)
- Badges & points (unlock animations)
- Plan sidebar (feature gating)

### ✅ Admin Tools
- Admin Toolbar (jump to stage/module, new session)
- Live Data Viewer (real-time scores/transcripts)
- Session Debugger (all recording types)
- Dev Navigation (quick links)
- Admin mode detection (email-based)

### ✅ Testing
- 138 Playwright E2E tests
- Test fixtures (auth, audio, database)
- Multi-browser support
- CI/CD ready

---

## API Endpoints

### Edge Functions (Supabase)

Base URL: `https://[project-ref].supabase.co/functions/v1/`

#### Assessment APIs
- `POST /analyze-pronunciation` - Azure Speech API integration
- `POST /analyze-fluency` - WPM calculation
- `POST /analyze-skill` - AI scoring (confidence, syntax)
- `POST /analyze-syntax` - Grammar analysis
- `POST /analyze-comprehension` - Listening comprehension
- `POST /conversation-agent` - AI conversation partner
- `POST /french-tts` - Text-to-speech
- `POST /transcribe-pronunciation` - Audio transcription

#### System APIs
- `POST /systemeio-webhook` - Payment webhook handler

**Authentication:** All require JWT token in `Authorization: Bearer [token]` header

---

## File Structure

```
french-fluency-forge/
├── src/
│   ├── components/
│   │   ├── assessment/
│   │   │   ├── pronunciation/
│   │   │   ├── fluency/
│   │   │   ├── confidence/
│   │   │   ├── syntax/
│   │   │   ├── conversation/
│   │   │   ├── comprehension/
│   │   │   ├── personality-quiz/
│   │   │   └── shared/
│   │   ├── sales/
│   │   │   ├── CallScreen.tsx
│   │   │   ├── LeadInbox.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── QualificationMeter.tsx
│   │   │   ├── CallStageTimeline.tsx
│   │   │   ├── ObjectionLibrary.tsx
│   │   │   └── ClosePanel.tsx
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── AdminToolbar.tsx
│   │   ├── DevNav.tsx
│   │   ├── DevSessionViewer.tsx
│   │   ├── LiveDataViewer.tsx
│   │   └── AdminPadding.tsx
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Signup.tsx, Login.tsx
│   │   ├── Assessment.tsx
│   │   ├── Results.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── admin/
│   │   │   └── SalesCopilot.tsx
│   │   └── DevPronunciationTest.tsx
│   ├── features/
│   │   └── dashboard/
│   │       ├── types.ts
│   │       ├── data/
│   │       ├── hooks/
│   │       └── components/
│   ├── lib/
│   │   ├── sales/
│   │   │   ├── types.ts
│   │   │   ├── api.ts
│   │   │   ├── decisionEngine.ts
│   │   │   ├── playbookSeed.ts
│   │   │   └── playbookSeedData.json
│   │   └── utils.ts
│   ├── hooks/
│   │   └── useAdminMode.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── config/
│   │   └── admin.ts
│   ├── App.tsx
│   └── index.css
├── supabase/
│   ├── functions/
│   │   ├── analyze-pronunciation/
│   │   ├── analyze-fluency/
│   │   ├── analyze-skill/
│   │   ├── analyze-syntax/
│   │   ├── analyze-comprehension/
│   │   ├── conversation-agent/
│   │   ├── french-tts/
│   │   ├── transcribe-pronunciation/
│   │   └── systemeio-webhook/
│   └── migrations/
│       ├── [timestamp]_initial_schema.sql
│       ├── [timestamp]_sales_copilot.sql
│       └── ...
├── e2e/
│   ├── fixtures/
│   ├── helpers/
│   ├── auth.spec.ts
│   ├── ui-tests.spec.ts
│   ├── pronunciation.spec.ts
│   ├── fluency.spec.ts
│   └── ...
├── docs/
│   ├── 00_OVERVIEW.md
│   ├── 01_TECH_STACK.md
│   ├── 02_DATABASE_SCHEMA.md
│   ├── 03_FEATURES.md
│   ├── 04_API_REFERENCE.md
│   ├── 05_COMPONENT_STRUCTURE.md
│   ├── 06_ASSESSMENT_MODULES.md
│   ├── 07_SALES_COPILOT.md
│   ├── 08_ADMIN_TOOLS.md
│   ├── 09_DEPLOYMENT.md
│   ├── 10_DEVELOPMENT_GUIDE.md
│   ├── 11_BRAND_IDENTITY.md
│   ├── 12_ARCHITECTURE.md
│   ├── 13_QUICK_START.md
│   ├── 14_TROUBLESHOOTING.md
│   ├── 15_AI_AGENT_CONTEXT.md
│   └── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── playwright.config.ts
```

---

## Key Components

### Assessment Components
- `PronunciationModule.tsx` - Azure Speech API, word-level scoring, immediate feedback
- `FluencyModule.tsx` - Picture description, WPM calculation, module locking
- `ConfidenceModule.tsx` - Questionnaire + speaking, combined scoring
- `SyntaxModule.tsx` - Grammar-focused prompts, AI scoring
- `ConversationModule.tsx` - AI agent interactions, multi-turn dialogue
- `ComprehensionModule.tsx` - Audio playback, question answering

### Sales Components
- `CallScreen.tsx` - Main workspace (3-column layout, keyboard shortcuts)
- `LeadInbox.tsx` - Lead list and search
- `LeadDetail.tsx` - Lead profile + assessment data integration
- `QualificationMeter.tsx` - Live score (0-100)
- `ObjectionLibrary.tsx` - One-click objection handling
- `ClosePanel.tsx` - Payment options, checkout link

### Dashboard Components
- `ProgressTimelineCard.tsx` - Recharts timeline with projections
- `RadarCard.tsx` - 6-dimension radar chart
- `HabitGridCard.tsx` - Custom habit grid with streak tracking
- `GoalsCard.tsx` + `GoalDialog.tsx` - Goal management
- `PhraseStatsCard.tsx` - Recall vs recognition stats
- `BadgesCard.tsx` - Gamification with unlock animations

### Admin Components
- `AdminToolbar.tsx` - Top navigation bar (jump to stage/module)
- `LiveDataViewer.tsx` - Real-time scores/transcripts
- `DevSessionViewer.tsx` - Session debugging tool
- `DevNav.tsx` - Quick navigation menu

---

## Admin Tools

### Admin Mode

**Configuration:** `src/config/admin.ts`

```typescript
export const ADMIN_EMAILS = [
  'tom@solvlanguages.com',
];
```

**Features:**
- Yellow admin toolbar at top
- Jump to any assessment stage/module
- Live data viewer (real-time scores)
- Session debugger (all recordings)
- Sales Copilot access
- Dashboard access
- Dev tools in production

### Quick Testing

```
1. Add email to admin.ts
2. Sign in with that email
3. Click "Jump to Module" → Select module
4. Test functionality
5. View Live Data Viewer for scores
6. Check Session Debugger for data
```

---

## Testing

### E2E Tests (Playwright)

**Total:** 138 tests

**Categories:**
- Authentication (10 tests) - ✅ All passing
- UI/Accessibility (24 tests) - ✅ All passing
- Edge cases (27 tests) - ✅ All passing
- Assessment modules (77 tests) - ⚠️ Need Supabase credentials

**Run Tests:**
```bash
npm run test:e2e:ui      # Visual test runner (recommended)
npm run test:e2e         # Headless mode
npm run test:e2e:debug   # Debug mode
```

**Test Files:**
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/ui-tests.spec.ts` - UI and accessibility
- `e2e/edge-cases.spec.ts` - Error scenarios
- `e2e/pronunciation.spec.ts` - Pronunciation module
- `e2e/fluency.spec.ts` - Fluency module
- `e2e/conversation.spec.ts` - Conversation module
- `e2e/other-modules.spec.ts` - Confidence, syntax, comprehension
- `e2e/results.spec.ts` - Results page
- `e2e/critical-paths.spec.ts` - End-to-end flows

---

## Deployment

### Platform

**Lovable** - Auto-deploys from GitHub main branch

### Workflow

```
1. Make changes locally
2. Commit to main
3. Push to GitHub
4. Lovable builds automatically
5. Live in ~2-5 minutes
```

### Environment Variables

**Frontend (Lovable):**
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

**Backend (Supabase Edge Functions):**
```bash
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Migrations

Run in Supabase SQL Editor (in order):
1. Initial schema migrations
2. `20260101212344_sales_copilot.sql` - Sales tables

---

## Quick Commands

### Development
```bash
npm run dev              # Start dev server (port 8080)
npm run build            # Production build
npm run lint             # Check code quality
```

### Testing
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Visual test runner
npm run test:install     # Install Playwright browsers
```

### Git
```bash
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push origin main     # Push (triggers deployment)
git pull --rebase        # Pull latest changes
```

---

## Critical Files

### Configuration
- `src/config/admin.ts` - Admin email list
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind configuration
- `playwright.config.ts` - Test configuration

### Entry Points
- `src/App.tsx` - Main app component, routing
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles, CSS variables

### Core Logic
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/hooks/useAdminMode.ts` - Admin detection
- `src/lib/sales/decisionEngine.ts` - Sales logic
- `src/features/dashboard/hooks/useDashboardData.ts` - Dashboard data

---

## Brand Identity

### Colors (SOLV)
- **Carbon:** `#1a1a1a` (deep black)
- **Graphite:** `#2d2d2d` (dark gray)
- **Bone:** `#f5f5f0` (off-white)
- **Steel:** `#6b7280` (mid gray)
- **Orange:** `#f97316` (primary accent)
- **Magenta:** `#ec4899` (secondary accent)
- **UV:** `#8b5cf6` (tertiary accent)

### Fonts
- **Inter** - Body text, UI elements
- **Space Grotesk** - Headlines
- **IBM Plex Mono** - Code, technical data

### Voice & Tone

**Anti-school vocabulary:**
- ✅ Use: member, coach, session, phrases, practice
- ❌ Avoid: student, teacher, lesson, flashcards, homework

---

## Known Issues

1. **Azure Pronunciation:** Sometimes returns `pronScore: 0` (fallback implemented)
2. **WebM Audio:** Azure prefers WAV (works but may be inconsistent)
3. **Dashboard Persistence:** Habits/goals in local state only (DB persistence coming)
4. **Export Feature:** PDF export UI exists but backend incomplete

---

## Future Enhancements

- [ ] Database persistence for habits and goals
- [ ] Real phrase stats from phrases module
- [ ] AI metrics from conversation data
- [ ] LLM integration for Sales Copilot
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Advanced analytics

---

## Getting Started

### For Developers

1. Clone repo
2. Install dependencies: `npm install`
3. Set up `.env` with Supabase credentials
4. Add your email to `src/config/admin.ts`
5. Run: `npm run dev`
6. Sign in with admin email
7. Explore with admin tools

### For AI Agents

**Read these first:**
1. `docs/00_OVERVIEW.md` - What this app does
2. `docs/02_DATABASE_SCHEMA.md` - Database structure
3. `docs/03_FEATURES.md` - What's implemented
4. `docs/15_AI_AGENT_CONTEXT.md` - AI-specific guidance

**Then explore:**
- Component structure
- API reference
- Assessment modules
- Sales Copilot
- Admin tools

---

## Support

**Developer:** Tom Gauthier  
**Email:** tom@solvlanguages.com  
**Website:** https://www.solvlanguages.com

**Resources:**
- Documentation: `docs/` folder
- Tests: `e2e/` folder
- GitHub: https://github.com/tomgauth/french-fluency-forge

---

## Version History

### v1.0.0 (January 2026)
- Initial production release
- Complete assessment system (6 dimensions)
- Sales Call Copilot (CRM)
- Member Dashboard (progress tracking)
- Admin tools (testing, debugging)
- 138 E2E tests
- Full documentation

---

## License

Proprietary - SOLV Languages

---

**This document provides a complete overview of the codebase. For detailed information, see the `docs/` folder.**

