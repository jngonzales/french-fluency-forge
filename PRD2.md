# PRD2: French Fluency Forge - Complete Feature Specification

**Purpose:** This document specifies everything needed to recreate French Fluency Forge from scratch with your own infrastructure (Supabase, OpenAI, Azure, ElevenLabs).

**Version:** 2.0  
**Date:** January 17, 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [Environment Variables](#3-environment-variables)
4. [Tech Stack](#4-tech-stack)
5. [Database Schema](#5-database-schema)
6. [Supabase Edge Functions](#6-supabase-edge-functions)
7. [Core Features](#7-core-features)
8. [Assessment Modules](#8-assessment-modules)
9. [Dashboard & Progress Hub](#9-dashboard--progress-hub)
10. [Sales Copilot](#10-sales-copilot)
11. [Admin Tools](#11-admin-tools)
12. [Authentication Flow](#12-authentication-flow)
13. [API Integrations](#13-api-integrations)
14. [File Structure](#14-file-structure)
15. [Deployment](#15-deployment)

---

## 1. System Overview

### What It Does

French Fluency Forge is a comprehensive French language assessment and coaching platform that:
- Evaluates users across **6 skill dimensions**
- Provides **real-time AI-powered feedback**
- Tracks **progress over time** via Dashboard
- Manages **sales leads** via Sales Copilot
- Offers **admin tools** for development/testing

### Core Value Proposition

| Feature | Technology |
|---------|------------|
| Pronunciation scoring | Azure Speech API |
| Transcription | OpenAI Whisper |
| AI scoring & feedback | OpenAI GPT-4 |
| Text-to-Speech | ElevenLabs / Azure TTS |
| Database & Auth | Supabase |
| Frontend | React + TypeScript + Vite |

---

## 2. Infrastructure Requirements

### External Services Needed

| Service | Purpose | Free Tier? |
|---------|---------|------------|
| **Supabase** | Database, Auth, Edge Functions, Storage | ✅ Yes |
| **OpenAI** | GPT-4 scoring, Whisper transcription | ❌ Paid |
| **Azure Speech** | Pronunciation assessment | ❌ Paid (free trial) |
| **ElevenLabs** | Text-to-Speech (optional) | ✅ Limited free |
| **Vercel** | Frontend hosting | ✅ Yes |
| **GitHub** | Version control | ✅ Yes |

### Supabase Setup

1. Create a new Supabase project
2. Enable authentication (email/password, magic links)
3. Create storage bucket: `audio-recordings`
4. Deploy edge functions
5. Set up secrets (see Environment Variables)

---

## 3. Environment Variables

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your-anon-key

# Optional: Feature flags
VITE_ENABLE_ADMIN_MODE=true
```

### Supabase Edge Function Secrets

```bash
# Set via Supabase CLI or Dashboard
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set AZURE_SPEECH_KEY=...
supabase secrets set AZURE_SPEECH_REGION=eastus
supabase secrets set ELEVENLABS_API_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

| Secret | Required For |
|--------|--------------|
| `OPENAI_API_KEY` | Transcription, AI scoring, GPT-4 conversations |
| `AZURE_SPEECH_KEY` | Pronunciation assessment |
| `AZURE_SPEECH_REGION` | Azure region (e.g., `eastus`) |
| `ELEVENLABS_API_KEY` | Text-to-Speech (optional, can use Azure TTS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions database access |

---

## 4. Tech Stack

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool |
| React Router | 6.30.1 | Routing |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui | - | Component library |
| Framer Motion | - | Animations |
| Recharts | - | Charts (radar, line) |
| React Hook Form | 7.61.1 | Forms |
| Zod | 3.25.76 | Validation |
| TanStack Query | - | Server state |

### Backend (Supabase)

| Feature | Purpose |
|---------|---------|
| PostgreSQL | Database |
| Row Level Security | Data protection |
| Edge Functions (Deno) | Serverless APIs |
| Auth | User management |
| Storage | Audio file storage |

### Testing

| Tool | Purpose |
|------|---------|
| Playwright | E2E testing (138 tests) |
| Vitest | Unit testing |

---

## 5. Database Schema

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `assessment_sessions`
```sql
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status session_status DEFAULT 'intake',
  -- Demographics
  gender gender_type,
  age_band age_band_type,
  languages_spoken TEXT[],
  goals TEXT,
  primary_track track_type,
  -- Quiz result
  archetype TEXT,
  -- Module locking
  fluency_locked BOOLEAN DEFAULT false,
  confidence_locked BOOLEAN DEFAULT false,
  syntax_locked BOOLEAN DEFAULT false,
  conversation_locked BOOLEAN DEFAULT false,
  comprehension_locked BOOLEAN DEFAULT false,
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE session_status AS ENUM (
  'intake', 'consent', 'quiz', 'mic_check', 
  'assessment', 'processing', 'completed', 'abandoned'
);
```

#### `skill_recordings`
```sql
CREATE TABLE skill_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  user_id UUID REFERENCES profiles(id),
  module_type TEXT, -- pronunciation, confidence, syntax, conversation
  item_id TEXT,
  attempt_number INTEGER DEFAULT 1,
  duration_seconds NUMERIC,
  transcript TEXT,
  ai_score NUMERIC,
  ai_feedback TEXT,
  ai_breakdown JSONB,
  status TEXT DEFAULT 'processing',
  superseded BOOLEAN DEFAULT false,
  used_for_scoring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

#### `fluency_recordings`
```sql
CREATE TABLE fluency_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  user_id UUID REFERENCES profiles(id),
  item_id TEXT,
  attempt_number INTEGER DEFAULT 1,
  duration_seconds NUMERIC,
  transcript TEXT,
  wpm NUMERIC, -- Words per minute
  ai_feedback TEXT,
  status TEXT DEFAULT 'processing',
  superseded BOOLEAN DEFAULT false,
  used_for_scoring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `comprehension_recordings`
```sql
CREATE TABLE comprehension_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  user_id UUID REFERENCES profiles(id),
  item_id TEXT,
  transcript TEXT,
  ai_score NUMERIC,
  ai_feedback_fr TEXT,
  intent_match JSONB,
  understood_facts JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Dashboard Tables (V0-CORE)

#### `habits`
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  source TEXT DEFAULT 'personal' CHECK (source IN ('system', 'personal')),
  intensity INTEGER CHECK (intensity IS NULL OR (intensity >= 1 AND intensity <= 6)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `habit_cells`
```sql
CREATE TABLE habit_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'na' CHECK (status IN ('done', 'missed', 'na', 'future')),
  intensity INTEGER,
  UNIQUE(habit_id, date)
);
```

#### `goals`
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  deadline DATE,
  goal_type TEXT CHECK (goal_type IN ('skill', 'volume', 'freeform')),
  dimension TEXT,
  target_score INTEGER,
  metric TEXT,
  target_value INTEGER,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `member_phrase_cards`
```sql
CREATE TABLE member_phrase_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID REFERENCES phrases(id),
  due_at TIMESTAMPTZ,
  scheduler_state JSONB, -- SRS state (interval, easeFactor, etc.)
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Sales Copilot Tables

#### `sales_leads`
```sql
CREATE TABLE sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES profiles(id),
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);
```

#### `sales_calls`
```sql
CREATE TABLE sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sales_leads(id),
  stage call_stage DEFAULT 'rapport',
  answers JSONB, -- Array of {questionId, answer, timestamp}
  qualification_score INTEGER DEFAULT 50,
  outcome call_outcome,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE call_stage AS ENUM (
  'rapport', 'diagnose', 'qualify', 'present', 
  'objections', 'close', 'next_steps'
);

CREATE TYPE call_outcome AS ENUM (
  'won', 'lost', 'follow_up', 'refer_out'
);
```

---

## 6. Supabase Edge Functions

### Function List

| Function | Purpose | AI Service |
|----------|---------|------------|
| `analyze-pronunciation` | Pronunciation scoring | Azure Speech API |
| `analyze-fluency` | WPM calculation | OpenAI Whisper |
| `analyze-skill` | Generic skill scoring | OpenAI GPT-4 |
| `analyze-syntax` | Grammar scoring | OpenAI GPT-4 |
| `analyze-confidence-speaking` | Confidence scoring | OpenAI GPT-4 |
| `analyze-comprehension` | Listening comprehension | OpenAI GPT-4 |
| `conversation-agent` | AI conversation partner | OpenAI GPT-4 |
| `french-tts` | Text-to-Speech | ElevenLabs / Azure |
| `transcribe-pronunciation` | Fallback transcription | OpenAI Whisper |
| `phrase-explain` | Phrase explanations | OpenAI GPT-4 |
| `phrases-schedule-preview` | SRS scheduling | Local logic |
| `phrases-review-commit` | SRS review commit | Local logic |
| `systemeio-webhook` | Payment processing | - |

### Function Template

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, ...params } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Your logic here...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 7. Core Features

### 7.1 Authentication

| Feature | Implementation |
|---------|----------------|
| Email/Password signup | Supabase Auth |
| Email/Password login | Supabase Auth |
| Magic link login | Supabase Auth |
| Password reset | Supabase Auth |
| Protected routes | React Router + AuthContext |
| Session persistence | Supabase JWT |

### 7.2 User Journey

```
1. Sign Up / Login
   ↓
2. Intake Form
   - Gender, age band
   - Languages spoken
   - Goals
   - Primary track (small_talk, work, etc.)
   ↓
3. Consent Form
   - Recording consent
   - Data processing consent
   - GDPR compliance
   ↓
4. Personality Quiz
   - 8 questions (various types)
   - Archetype identification
   - Exportable results
   ↓
5. Mic Check
   - Permission request
   - Test recording
   - Playback verification
   ↓
6. Assessment (6 modules)
   ↓
7. Processing
   - Score calculation
   ↓
8. Results Page
   - Radar chart
   - Score breakdown
   - Recommendations
```

### 7.3 Session Status Flow

```
intake → consent → quiz → mic_check → assessment → processing → completed
                                                              ↓
                                                         abandoned
```

---

## 8. Assessment Modules

### 8.1 Pronunciation Module

| Item Type | Count | Description |
|-----------|-------|-------------|
| Reading aloud | 3 | /y/ vs /u/, nasal vowels, /s/ vs /z/ |
| Listen & repeat | 2 | Position words, liaisons |
| Minimal pairs | 6 | Click correct pronunciation |

**Technology:** Azure Speech API
- Word-level accuracy scoring
- Phoneme-level feedback
- Max 2 attempts per item

### 8.2 Fluency Module

| Item | Description |
|------|-------------|
| Picture 1 | Describe scene |
| Picture 2 | Describe scene |
| Picture 3 | Describe scene |

**Scoring:**
- Words Per Minute (WPM)
- 60+ WPM = high fluency
- Transcription via OpenAI Whisper

### 8.3 Confidence Module

**Structure:**
1. Introduction phase
2. Questionnaire (8 questions, slider + text)
3. Speaking phase (describe confidence level)

**Scoring:** 50% questionnaire + 50% AI-assessed speaking

### 8.4 Syntax Module

**Structure:**
- Grammar-focused prompts
- User records response
- AI scores grammatical accuracy

**Scoring:** OpenAI GPT-4 with French grammar rubric

### 8.5 Conversation Module

**Structure:**
- AI agent initiates dialogue
- Multi-turn conversation (3-5 turns)
- Different scenarios (café, directions, etc.)

**Technology:**
- OpenAI GPT-4 for responses
- ElevenLabs/Azure for TTS
- OpenAI Whisper for STT

### 8.6 Comprehension Module

**Structure:**
- Audio passage playback
- User answers questions verbally
- AI evaluates understanding

**Scoring:**
- Intent matching
- Fact extraction
- OpenAI GPT-4 analysis

---

## 9. Dashboard & Progress Hub

### 9.1 Components

| Component | Description |
|-----------|-------------|
| `ProgressJourneyCard` | Line chart of score history |
| `HabitGridCard` | GitHub-style habit tracker |
| `RadarCard` | 6-dimension skill profile |
| `GoalsCard` | Outcome goals with deadlines |
| `BadgesCard` | Achievement badges |
| `FlashcardStatsCard` | SRS flashcard stats |

### 9.2 Data Hook: `useDashboardData`

```typescript
const {
  data,      // Assessment history, scores
  habits,    // User habits
  habitGrid, // Daily habit cells
  goals,     // User goals
  badges,    // Achievement badges
  actions: {
    updateHabitCell,
    addHabit,
    updateHabit,
    deleteHabit,
    addGoal,
    updateGoal,
    deleteGoal,
    unlockBadge,
    refresh,
  }
} = useDashboardData();
```

### 9.3 Habit Tracker

- **Daily/Weekly habits**
- **Click cells** to toggle: na → done → missed → na
- **Streak counting**
- **CRUD operations** (create, edit, delete)

### 9.4 Goals

- **Goal types:** skill, volume, freeform
- **Deadline tracking**
- **Lock-in feature** (coach-only unlock)
- **CRUD operations**

### 9.5 Flashcards (SRS)

- **Spaced Repetition System**
- **Phrase cards** with due dates
- **Review sessions**
- **Statistics:** scheduled, learned

---

## 10. Sales Copilot

### 10.1 Purpose

Internal CRM for managing high-ticket sales calls with:
- Lead management
- Qualification scoring
- Guided call flow
- Objection handling

### 10.2 Components

| Component | Description |
|-----------|-------------|
| Lead Inbox | Search/list leads |
| Lead Detail | View lead info + assessment data |
| Call Screen | 3-column guided call interface |
| Stage Timeline | Visual progress through call |
| Objection Library | Pre-built objection handling |
| Close Panel | Payment options |

### 10.3 Call Stages

```
1. Rapport     → Build connection
2. Diagnose    → Understand needs
3. Qualify     → Score fit (0-100)
4. Present     → Show solution
5. Objections  → Handle concerns
6. Close       → Ask for sale
7. Next Steps  → Follow-up plan
```

### 10.4 Qualification Scoring

- **0-100 scale**
- **Hard disqualify rules** (auto-reject bad fits)
- **Tag-based scoring**
- **Real-time updates**

---

## 11. Admin Tools

### 11.1 Admin Toolbar

- Jump to any assessment stage
- Jump to any module
- Create new session
- View current location

### 11.2 Live Data Viewer

- Real-time score updates
- Transcript display
- AI feedback viewing
- Auto-refresh (3 seconds)

### 11.3 Session Debugger

- All recording types
- Session metadata
- Events log
- Tabbed interface

### 11.4 Admin Detection

```typescript
// src/config/admin.ts
const ADMIN_EMAILS = [
  'admin@example.com',
  'jngonzales.dev@gmail.com',
];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
```

---

## 12. Authentication Flow

### Sign Up

```
1. User enters email + password
2. Supabase creates auth user
3. Database trigger creates profile
4. Email confirmation sent
5. User clicks confirmation link
6. Redirected to dashboard
```

### Login

```
1. User enters credentials
2. Supabase validates
3. JWT returned
4. Stored in localStorage
5. AuthContext updated
6. Protected routes accessible
```

### Protected Routes

```tsx
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}
```

---

## 13. API Integrations

### 13.1 Azure Speech API

**Endpoint:** Azure Cognitive Services
**Purpose:** Pronunciation assessment

```typescript
// Request
POST /cognitiveservices/v1
Headers:
  Ocp-Apim-Subscription-Key: {AZURE_SPEECH_KEY}
Body: Audio blob

// Response
{
  NBest: [{
    Words: [{
      Word: "bonjour",
      PronunciationAssessment: {
        AccuracyScore: 85,
        ErrorType: "None"
      }
    }]
  }]
}
```

### 13.2 OpenAI GPT-4

**Purpose:** AI scoring, feedback, conversation

```typescript
// Scoring prompt structure
const systemPrompt = `You are a French language assessor.
Score the following response on a 0-100 scale.
Return JSON: { score: number, feedback: string }`;

// API call
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: transcript }
    ]
  })
});
```

### 13.3 OpenAI Whisper

**Purpose:** Audio transcription

```typescript
const formData = new FormData();
formData.append("file", audioBlob, "audio.webm");
formData.append("model", "whisper-1");
formData.append("language", "fr");

const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
  body: formData
});
```

### 13.4 ElevenLabs TTS

**Purpose:** Text-to-Speech for AI conversation

```typescript
const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/{voice_id}", {
  method: "POST",
  headers: {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Bonjour, comment allez-vous?",
    model_id: "eleven_multilingual_v2"
  })
});
// Returns: audio/mpeg
```

---

## 14. File Structure

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
│   │   │   └── personality-quiz/
│   │   ├── sales/
│   │   │   ├── LeadInbox.tsx
│   │   │   ├── CallScreen.tsx
│   │   │   └── ObjectionLibrary.tsx
│   │   ├── ui/          # shadcn/ui components
│   │   └── admin/       # Admin toolbar, debugger
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Assessment.tsx
│   │   ├── Results.tsx
│   │   ├── Login.tsx
│   │   ├── SignUp.tsx
│   │   └── ...
│   ├── features/
│   │   └── dashboard/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── data/
│   │       └── types.ts
│   ├── lib/
│   │   ├── sales/       # Sales Copilot engine
│   │   └── utils/
│   ├── hooks/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── integrations/
│       └── supabase/
│           └── client.ts
├── supabase/
│   ├── functions/
│   │   ├── analyze-pronunciation/
│   │   ├── analyze-fluency/
│   │   ├── analyze-skill/
│   │   ├── conversation-agent/
│   │   ├── french-tts/
│   │   └── ...
│   └── migrations/
├── e2e/                 # Playwright tests
├── public/
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 15. Deployment

### Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set environment variables
3. Auto-deploy on push to main

### Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy analyze-pronunciation
```

### Database Migrations

```bash
# Create migration
supabase migration new my_migration

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Create OpenAI account & API key
- [ ] Create Azure Speech Services account
- [ ] Create ElevenLabs account (optional)
- [ ] Clone repository
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in environment variables
- [ ] Run database migrations
- [ ] Deploy edge functions
- [ ] Set Supabase secrets
- [ ] Deploy to Vercel
- [ ] Test assessment flow
- [ ] Test dashboard features

---

## Cost Estimates

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Supabase (Free tier) | $0 |
| Supabase (Pro) | $25 |
| OpenAI GPT-4 | $20-100 (usage-based) |
| OpenAI Whisper | $5-20 (usage-based) |
| Azure Speech | $10-50 (usage-based) |
| ElevenLabs | $5-22 |
| Vercel (Free) | $0 |
| **Total** | **$40-217/month** |

---

*This PRD is complete. Use it to recreate the entire French Fluency Forge application with your own infrastructure.*
