# French Fluency Forge - Application Overview

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production

## What Is This App?

French Fluency Forge is a comprehensive French language assessment and coaching platform that evaluates users across 6 dimensions:
- **Pronunciation** - Reading, repeating, minimal pairs
- **Fluency** - Picture description, WPM calculation
- **Confidence** - Self-assessment questionnaire + speaking
- **Syntax** - Grammar accuracy
- **Conversation** - AI agent interactions
- **Comprehension** - Listening comprehension

The app also includes a **Sales Call Copilot** system for managing high-ticket sales calls with qualification scoring and playbook-driven workflows.

## Core Value Proposition

1. **Comprehensive Assessment** - Multi-dimensional evaluation of French language skills
2. **Real-time Feedback** - Instant scores and transcriptions during assessment
3. **AI-Powered Analysis** - Azure Speech API for pronunciation, OpenAI for other modules
4. **Sales Tools** - Internal CRM for managing leads and sales calls
5. **Admin Tools** - Developer-friendly testing and navigation tools

## Key Features

### For Users
- ✅ Multi-stage assessment flow (Intake → Consent → Quiz → Assessment → Results)
- ✅ Audio recording with real-time transcription
- ✅ Personality archetype identification
- ✅ Detailed results with radar charts and score breakdowns
- ✅ Account management and purchase tracking

### For Admins
- ✅ Admin Toolbar for quick navigation
- ✅ Live Data Viewer for real-time scores/transcripts
- ✅ Session Debugger for data inspection
- ✅ Sales Copilot for managing leads and calls
- ✅ Jump to any module/stage functionality

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui components
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **AI Services:** 
  - Azure Speech API (pronunciation assessment)
  - OpenAI GPT-4 (conversation, scoring, feedback)
- **Testing:** Playwright (138 E2E tests)
- **Deployment:** Lovable (auto-deploys from GitHub)

## Application Flow

```
User Journey:
1. Sign Up / Login
2. Intake Form (demographics, goals)
3. Consent Form (data processing)
4. Personality Quiz (archetype identification)
5. Mic Check (audio setup)
6. Assessment Modules (6 dimensions)
7. Processing (score calculation)
8. Results Page (visualization + breakdown)

Admin Journey:
1. Login as admin
2. Access Admin Toolbar
3. Jump to any stage/module
4. View live data during assessment
5. Use Sales Copilot for lead management
```

## File Structure

```
src/
├── components/          # React components
│   ├── assessment/      # Assessment module components
│   ├── sales/          # Sales Copilot components
│   └── ui/             # shadcn/ui components
├── pages/              # Route pages
├── lib/                # Utilities and business logic
│   ├── sales/          # Sales Copilot engine
│   └── utils/          # Helper functions
├── hooks/              # React hooks
├── contexts/           # React contexts (Auth)
└── integrations/       # External service integrations

supabase/
├── functions/          # Edge Functions (API endpoints)
└── migrations/         # Database migrations
```

## Quick Start for New Developers

1. **Read these docs in order:**
   - `01_TECH_STACK.md` - Understand the stack
   - `02_DATABASE_SCHEMA.md` - Database structure
   - `03_FEATURES.md` - What's implemented
   - `04_API_REFERENCE.md` - API endpoints

2. **Set up locally:**
   ```bash
   npm install
   npm run dev
   ```

3. **Access admin mode:**
   - Edit `src/config/admin.ts`
   - Add your email to `ADMIN_EMAILS`
   - Sign in with that email

4. **Run tests:**
   ```bash
   npm run test:e2e:ui
   ```

## Important Notes

- **Admin-only features:** Many features require admin access (configured in `src/config/admin.ts`)
- **Environment variables:** Required Supabase keys in `.env`
- **Database migrations:** Run via Supabase SQL Editor
- **Auto-deployment:** Pushes to GitHub auto-deploy via Lovable

## Support & Documentation

- See `docs/` folder for detailed documentation
- Check `e2e/` for test examples
- Review `supabase/migrations/` for database structure

