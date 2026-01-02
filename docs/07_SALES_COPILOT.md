# Sales Call Copilot

## Overview

Internal CRM system for managing high-ticket sales calls with rule-based decision engine, qualification scoring, and playbook-driven workflows.

**Access:** Admin-only (configured in `src/config/admin.ts`)

**Route:** `/admin/sales-copilot`

## Features

### Lead Management

**Lead Inbox:**
- List all leads
- Search by name/email
- Create new lead
- Auto-link indicator (if email matches user)

**Lead Detail:**
- Full lead profile
- Assessment data integration (if linked user)
- Previous calls list
- Start new call button

**Auto-linking:**
- Leads automatically link to users by email match
- Shows assessment scores in lead detail
- Pre-populates lead fields from intake data

### Call Screen

**Layout:**
- **Left:** Lead snapshot (compact info)
- **Center:** Next best question (big text, answer buttons)
- **Right:** Notes, tags, objections
- **Top:** Qualification meter (0-100)
- **Bottom:** Stage timeline

**Question Types:**
- `script` - Read to lead, click Continue
- `free_text` - Type notes, click Submit
- `single_choice` - Click answer button (1-6 keyboard shortcuts)
- `number` - Enter number
- `scale` - Enter 1-5 scale
- `multi_prompt` - Multiple questions, click Continue

**Keyboard Shortcuts:**
- `1-6` - Select answer button
- `N` - Next/Continue
- `O` - Open objections (future)
- `S` - Generate summary (Ctrl+S)
- `C` - Close panel (Ctrl+C, future)
- `Esc` - Close modals

### Qualification System

**Scoring:**
- Starts at 50 points
- Applies deltas from answers
- Clamps to 0-100
- Updates live during call

**Score Bands:**
- **Low (0-39):** Refer out
- **Medium (40-69):** Follow up or handle objections
- **High (70-100):** Ready to close

**Hard Disqualify Rules:**
1. **Non-speaking goal:** If goal is not conversation-focused
2. **Time too low:** Less than 3 hours/week available
3. **No authority:** Not the decision maker

### Call Stages

**7 Stages (SPIN + BANT):**
1. **Rapport & Frame** - Set expectations, get lead talking
2. **Diagnose (SPIN)** - Situation, Problem, Implication, Need payoff
3. **Qualify (BANT-lite)** - Budget, Authority, Need, Timing
4. **Present the Plan** - Map problems to solution
5. **Handle Objections** - Diagnose and reframe
6. **Close** - Ask for decision
7. **Next Steps** - Follow-up or refer out

**Progression:**
- Stages advance when required checkpoints complete
- Decision engine selects next question
- Priority rules handle special cases

### Objection Library

**9 Objections:**
1. Too expensive
2. Need to think
3. Need to ask partner
4. No time
5. Tried everything already
6. Too old / bad at languages
7. No immersion
8. Want grammar first
9. Can just use an app / tutor

**Each Objection Includes:**
- Empathy line
- Diagnostic questions
- Reframes
- Proof angles
- Close questions
- "Add to notes" button

### Close Panel

**Appears when:**
- Qualification score >= 70
- Required checkpoints complete
- No hard disqualify tags

**Features:**
- Payment options (1497€ / 3×499€)
- Recommendation logic (budget_tight → suggest payment plan)
- Checkout button (opens `https://www.solvlanguages.com/3090checkout`)
- Closing scripts
- Mark as won/lost buttons

### Decision Engine

**Location:** `src/lib/sales/decisionEngine.ts`

**Core Functions:**
- `calculateQualificationScore()` - Computes score from answers/tags
- `getNextQuestion()` - Selects next question based on rules
- `getNextStage()` - Determines stage progression
- `getObjection()` - Fetches objection talk track

**Logic:**
1. Check priority rules (authority, time, grammar-first)
2. Find unanswered questions in current stage
3. Check if stage complete → advance
4. Return next question with "why" explanation

### Playbook

**Structure (JSONB):**
- Meta (offer details, pricing, checkout URL)
- Tags (qualification, blockers, objections, outcomes)
- Stages (7 stages with checkpoints)
- Question bank (11 questions)
- Qualification rules (scoring, disqualify, close)
- Objection library (9 objections with talk tracks)
- Scripts (positioning, close, disqualify, follow-up)
- Proof placeholders (testimonials)
- Decision engine hints (progression, priority rules)

**Seed Data:**
- Located in `src/lib/sales/playbookSeedData.json`
- Auto-loads on first use
- Editable via playbook editor (future)

## Database Schema

### sales_leads
```sql
- id, name, email
- linked_user_id (auto-linked by email)
- timezone, country, current_level
- goal, deadline_urgency, motivation
- biggest_blockers, past_methods_tried
- time_available_per_week
- willingness_to_speak (1-5)
- budget_comfort (1-5)
- decision_maker (yes/no/unsure)
- notes
- created_at, updated_at, created_by
```

### sales_calls
```sql
- id, lead_id
- stage (enum: rapport/diagnose/qualify/present/objections/close/next_steps)
- transcript_notes
- tags (JSONB array)
- answers (JSONB array)
- outcome (enum: won/lost/follow_up/refer_out)
- follow_up_email, summary
- qualification_score (0-100)
- qualification_reason
- created_at, updated_at, created_by
```

### sales_playbook
```sql
- id, version, name
- playbook_data (JSONB)
- is_active (boolean)
- created_at, updated_at, created_by
```

## API Layer

**Location:** `src/lib/sales/api.ts`

**Functions:**
- `fetchLeads()` - Get all leads
- `fetchLead(id)` - Get single lead
- `createLead(lead, userId)` - Create new lead
- `updateLead(id, updates)` - Update lead
- `fetchCallsForLead(leadId)` - Get calls for lead
- `createCall(call, userId)` - Create new call
- `updateCall(id, updates)` - Update call
- `fetchAssessmentData(userId)` - Get linked user's assessment data
- `fetchActivePlaybook()` - Get active playbook

## Usage Flow

### Starting a Call

1. Admin navigates to `/admin/sales-copilot`
2. Clicks "New Lead" or selects existing lead
3. Views lead detail (shows assessment data if linked)
4. Clicks "Start Call"
5. Call screen opens with first question

### During Call

1. Read question to lead
2. Listen for key points (shown in UI)
3. Click answer button or type notes
4. Qualification score updates live
5. Stage timeline shows progress
6. Access objections library as needed
7. Take notes in right panel
8. Tag lead with relevant tags

### Closing

1. When score >= 70, close panel appears
2. Review payment recommendation
3. Share closing script
4. Click "Open Checkout" to send link
5. Mark call as won/lost
6. Generate summary (future)

### Follow-up

1. If not closing, mark as follow-up
2. Schedule next call
3. Or refer out if not a fit

## Integration with Assessment Data

When lead email matches a user:
- `linked_user_id` is set automatically
- Lead detail shows:
  - Latest assessment scores
  - Personality archetype
  - Goals from intake form
  - Completion status
- Pre-populates lead fields:
  - Current level
  - Goals
  - Time available
  - Blockers

## Admin Access

**Configuration:**
- Edit `src/config/admin.ts`
- Add email to `ADMIN_EMAILS` array
- Sign in with that email
- Sales Copilot link appears in Admin Toolbar

**RLS Policies:**
- All sales tables check `is_admin_user()` function
- Function checks email against hardcoded list
- Non-admins cannot access sales data

## Future Enhancements

- [ ] LLM integration (rewrite questions, generate summaries)
- [ ] Email template generation
- [ ] Call recording/transcription
- [ ] Advanced analytics (conversion rates, stage duration)
- [ ] Playbook editor UI
- [ ] Multiple playbook versions
- [ ] A/B testing different talk tracks
- [ ] Integration with calendar for follow-ups

