# Database Schema

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) enabled on all tables.

## Core Tables

### `profiles`
User profile information (extends Supabase Auth).

```sql
- id (UUID, PK, FK → auth.users)
- email (TEXT, NOT NULL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Relationships:**
- One-to-many with `assessment_sessions`
- One-to-many with `purchases`
- One-to-many with `sales_leads` (via `linked_user_id`)

### `assessment_sessions`
Main assessment session tracking.

```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- status (ENUM: intake, consent, quiz, mic_check, assessment, processing, completed, abandoned)
- purchase_id (UUID, FK → purchases, nullable)
- gender (ENUM: male, female, non_binary, prefer_not)
- age_band (ENUM: 18_24, 25_34, 35_44, 45_54, 55_64, 65_plus)
- languages_spoken (TEXT[])
- goals (TEXT)
- primary_track (ENUM: small_talk, transactions, bilingual_friends, work, home, in_laws)
- archetype (TEXT)
- started_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
- fluency_locked, confidence_locked, syntax_locked, conversation_locked, comprehension_locked (BOOLEAN)
- fluency_locked_at, confidence_locked_at, etc. (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

**Status Flow:**
```
intake → consent → quiz → mic_check → assessment → processing → completed
```

### `skill_recordings`
Audio recordings for skill-based modules (pronunciation, confidence, syntax, conversation).

```sql
- id (UUID, PK)
- session_id (UUID, FK → assessment_sessions)
- user_id (UUID, FK → profiles)
- module_type (TEXT: pronunciation, confidence, syntax, conversation)
- item_id (TEXT)
- attempt_number (INTEGER)
- duration_seconds (NUMERIC)
- transcript (TEXT)
- ai_score (NUMERIC, 0-100)
- ai_feedback (TEXT)
- ai_breakdown (JSONB)
- status (TEXT: processing, completed, failed)
- superseded (BOOLEAN)
- used_for_scoring (BOOLEAN)
- created_at, completed_at (TIMESTAMPTZ)
```

### `fluency_recordings`
Audio recordings for fluency module (picture descriptions).

```sql
- id (UUID, PK)
- session_id (UUID, FK → assessment_sessions)
- user_id (UUID, FK → profiles)
- item_id (TEXT)
- attempt_number (INTEGER)
- duration_seconds (NUMERIC)
- transcript (TEXT)
- wpm (NUMERIC) - Words per minute
- ai_feedback (TEXT)
- status (TEXT)
- superseded (BOOLEAN)
- used_for_scoring (BOOLEAN)
- created_at, completed_at (TIMESTAMPTZ)
```

### `comprehension_recordings`
Audio recordings for comprehension module.

```sql
- id (UUID, PK)
- session_id (UUID, FK → assessment_sessions)
- user_id (UUID, FK → profiles)
- item_id (TEXT)
- attempt_number (INTEGER)
- audio_played_at (TIMESTAMPTZ)
- transcript (TEXT)
- ai_score (NUMERIC)
- ai_confidence (NUMERIC)
- ai_feedback_fr (TEXT)
- intent_match (JSONB)
- understood_facts (JSONB)
- status (TEXT)
- superseded (BOOLEAN)
- used_for_scoring (BOOLEAN)
- created_at, completed_at (TIMESTAMPTZ)
```

### `purchases`
Purchase records (Systeme.io integration).

```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles, nullable)
- stripe_payment_intent_id (TEXT, UNIQUE)
- stripe_customer_id (TEXT)
- amount_cents (INTEGER)
- currency (TEXT, default: 'eur')
- status (TEXT, default: 'pending')
- email (TEXT)
- created_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
```

### `app_accounts`
Account access management (Systeme.io integration).

```sql
- id (UUID, PK)
- email (TEXT, NOT NULL)
- user_id (UUID, FK → profiles, nullable)
- access_status (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### `archetype_feedback`
Personality archetype results from quiz.

```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- session_id (UUID, FK → assessment_sessions, nullable)
- feedback_text (TEXT)
- marketing_consent (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

### `consent_records`
GDPR consent tracking.

```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- recording_consent (BOOLEAN)
- data_processing_consent (BOOLEAN)
- retention_acknowledged (BOOLEAN)
- consented_at (TIMESTAMPTZ)
- ip_address (TEXT)
- user_agent (TEXT)
```

## Sales Copilot Tables

### `sales_leads`
Lead/prospect information.

```sql
- id (UUID, PK)
- name (TEXT)
- email (TEXT, indexed)
- linked_user_id (UUID, FK → profiles, nullable) - Auto-linked by email
- timezone, country (TEXT)
- current_level, goal, deadline_urgency, motivation (TEXT)
- biggest_blockers, past_methods_tried (TEXT[])
- time_available_per_week (INTEGER)
- willingness_to_speak (INTEGER, 1-5)
- budget_comfort (INTEGER, 1-5)
- decision_maker (TEXT: yes, no, unsure)
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
- created_by (UUID, FK → profiles)
```

### `sales_calls`
Sales call records.

```sql
- id (UUID, PK)
- lead_id (UUID, FK → sales_leads)
- stage (ENUM: rapport, diagnose, qualify, present, objections, close, next_steps)
- transcript_notes (TEXT)
- tags (JSONB array)
- answers (JSONB array of {questionId, questionText, selectedOption, freeText, timestamp})
- outcome (ENUM: won, lost, follow_up, refer_out)
- follow_up_email, summary (TEXT)
- qualification_score (INTEGER, 0-100, default: 50)
- qualification_reason (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
- created_by (UUID, FK → profiles)
```

### `sales_playbook`
Sales playbook configuration (JSONB).

```sql
- id (UUID, PK)
- version (TEXT)
- name (TEXT)
- playbook_data (JSONB) - Full playbook structure
- is_active (BOOLEAN, default: false)
- created_at, updated_at (TIMESTAMPTZ)
- created_by (UUID, FK → profiles)
```

## Enums

### `session_status`
```
intake, consent, quiz, mic_check, assessment, processing, completed, abandoned
```

### `call_stage`
```
rapport, diagnose, qualify, present, objections, close, next_steps
```

### `call_outcome`
```
won, lost, follow_up, refer_out
```

### `gender_type`
```
male, female, non_binary, prefer_not
```

### `age_band_type`
```
18_24, 25_34, 35_44, 45_54, 55_64, 65_plus
```

### `track_type`
```
small_talk, transactions, bilingual_friends, work, home, in_laws
```

## Indexes

- `idx_sales_leads_email` - Fast email lookups
- `idx_sales_leads_linked_user` - User linking
- `idx_sales_calls_lead` - Call lookups by lead
- `idx_sales_playbook_active` - Active playbook lookup

## Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Users:** Can only access their own data
- **Admins:** Can access all data (via `is_admin_user()` function)
- **Service role:** Full access (for Edge Functions)

## Triggers

- `auto_link_lead_to_user()` - Auto-links leads to users by email
- `update_updated_at()` - Auto-updates `updated_at` timestamps
- `handle_new_user()` - Creates profile on auth signup

## Functions

- `is_admin_user(user_email TEXT)` - Checks if email is admin
- `auto_link_lead_to_user()` - Trigger function for lead linking
- `update_updated_at()` - Timestamp update trigger

## Storage

Supabase Storage buckets:
- Audio recordings (if stored, currently sent directly to Edge Functions)

## Migration Files

Located in `supabase/migrations/`:
- Initial schema setup
- Sales Copilot tables
- RLS policies
- Triggers and functions

