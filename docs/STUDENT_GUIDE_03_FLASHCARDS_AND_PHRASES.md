# Student Guide: Flashcards and Phrases System

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** v0 (UI-first, mock data, local state)

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Phrases System](#accessing-the-phrases-system)
3. [Creating New Flashcards](#creating-new-flashcards)
4. [Flashcard Database Structure](#flashcard-database-structure)
5. [Rescheduling and Parameters](#rescheduling-and-parameters)
6. [Current Implementation Status](#current-implementation-status)
7. [Testing Guide](#testing-guide)

---

## Overview

The Phrases system (we call them "phrases" not "flashcards" in the UI) is a spaced repetition system (SRS) for learning French phrases. It helps students learn **syntactic chunks** (not isolated words) to speak naturally.

**Key Features:**
- Two modes: **Recall** (English → French) and **Recognition** (French audio → understand)
- Spaced repetition scheduling
- Daily practice sessions
- Progress tracking
- Library management

**Location:** `/phrases`

**Status:** v0 - UI-first implementation with mock data and local state (localStorage)

---

## Accessing the Phrases System

### How Students Access

1. **From Dashboard:**
   - Click "My Resources" menu (burger icon)
   - Select "My Phrases"
   - Or navigate to `/phrases` directly

2. **Direct Navigation:**
   - Navigate to `/phrases`
   - If not logged in, redirected to login

3. **From Other Pages:**
   - Links throughout the app
   - Dashboard phrase stats card

### Main Pages

- **Landing Page:** `/phrases` - Overview and stats
- **Session Page:** `/phrases/session` - Active practice session
- **Library Page:** `/phrases/library` - Browse and manage phrases
- **Settings Page:** `/phrases/settings` - Configure preferences

---

## Creating New Flashcards

### Current Implementation (v0)

**Status:** ❌ **Not Fully Implemented**

**What Exists:**
- UI for creating flashcards exists in library page
- Mock phrase data (40 phrases across 3 packs)
- Seed pack functionality (adds starter pack)

**What's Missing:**
- Database persistence (currently localStorage only)
- Real phrase creation UI (admin/coach only in future)
- Phrase pack assignment system

### How It Currently Works

#### Option 1: Seed Starter Pack

**File:** `src/pages/PhrasesLandingPage.tsx`

**Steps:**
1. Navigate to `/phrases`
2. If no phrases assigned, see "Add a starter pack" button
3. Click button
4. System seeds 10 phrases from "Small talk starter" pack
5. Phrases saved to localStorage
6. Page refreshes, shows stats

**Code:**
```typescript
const handleSeedStarterPack = () => {
  const starterPhrases = getPhrasesByPackId('pack-001').slice(0, 10);
  // Create cards for each phrase
  const newCards = starterPhrases.map((phrase) => ({
    id: `card-${Date.now()}-${index}`,
    member_id: memberId,
    phrase_id: phrase.id,
    status: 'active',
    scheduler: { /* ... */ }
  }));
  // Save to localStorage
  localStorage.setItem(`solv_phrases_cards_${memberId}`, JSON.stringify(allCards));
};
```

#### Option 2: Manual Creation (Future)

**Planned Implementation:**
- Coach/Admin assigns phrase packs to students
- System creates `member_phrase_cards` records
- Students see assigned phrases in their library

**Not Yet Implemented:**
- Student cannot create phrases directly
- Only coaches/admins will create phrases (content management)
- Students receive phrases through pack assignments

### Database Structure (Future)

**Tables:**
- `phrases` - Canonical phrase content (created by admin/coach)
- `member_phrase_cards` - Per-student card state (created when pack assigned)
- `phrase_packs` - Curated sets of phrases
- `member_phrase_packs` - Pack assignments

**Migration File:** `supabase/migrations/20260102164444_phrases_learning_ladder.sql`

---

## Flashcard Database Structure

### Current State (v0 - localStorage)

**Storage Key:** `solv_phrases_cards_${userId}`

**Data Structure:**
```typescript
interface MemberPhraseCard {
  id: string;
  member_id: string;
  phrase_id: string;
  status: 'active' | 'buried' | 'suspended' | 'removed';
  scheduler: {
    algorithm: 'sm2' | 'fsrs';
    state: 'new' | 'learning' | 'review' | 'relearning';
    due_at: string; // ISO timestamp
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  };
  lapses: number;
  reviews: number;
  note?: string;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}
```

### Future State (v1 - Database)

**Table: `member_phrase_cards`**

```sql
CREATE TABLE member_phrase_cards (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES profiles(id),
  phrase_id uuid REFERENCES phrases(id),
  status phrase_status NOT NULL DEFAULT 'active',
  scheduler_state scheduler_state NOT NULL DEFAULT 'new',
  due_at timestamptz NOT NULL DEFAULT now(),
  interval_ms bigint,
  stability numeric,
  difficulty numeric,
  assist_level integer NOT NULL DEFAULT 0,
  consecutive_again integer DEFAULT 0,
  again_count_24h integer DEFAULT 0,
  again_count_7d integer DEFAULT 0,
  lapses integer DEFAULT 0,
  reviews integer DEFAULT 0,
  note text,
  flag_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, phrase_id)
);
```

**Key Fields:**
- `status` - Active, buried, suspended, removed
- `scheduler_state` - New, learning, review, relearning
- `due_at` - When card is due for review
- `interval_ms` - Next review interval (milliseconds)
- `stability` - FSRS stability value
- `difficulty` - FSRS difficulty value
- `assist_level` - Scaffolding level (0-4)

---

## Rescheduling and Parameters

### How Rescheduling Works

**Current Implementation (v0):**
- Simple interval-based scheduler (mock FSRS)
- Ratings update card state immediately
- Next review date calculated based on rating

**Rating Options:**
- **Again** - Reset to 1 day, decrease ease factor
- **Hard** - 1.2x multiplier, slight ease decrease
- **Good** - 2.5x multiplier (default), ease stays same
- **Easy** - 3.0x multiplier, increase ease factor

**Code Location:** `src/features/phrases/data/schedulerMock.ts`

### Scheduler Parameters

**Current Settings (v0):**
- New cards per day: 20 (default)
- Reviews per day: 100 (default)
- Target retention: 90% (not yet implemented)
- Simple interval logic (not real FSRS)

**Settings Location:** `/phrases/settings`

**File:** `src/pages/PhrasesSettingsPage.tsx`

**Adjustable Parameters:**
- `new_per_day` - Slider (0-50)
- `reviews_per_day` - Slider (0-200)
- `target_retention` - Slider (75%-95%)
- `speech_feedback_enabled` - Toggle
- `auto_assess_enabled` - Toggle
- `recognition_shadow_default` - Toggle
- `show_time_to_recall` - Toggle

### Can Students Change Parameters?

**Current Implementation:**
- ✅ **Yes** - Students can change all parameters
- Settings saved to localStorage
- Changes apply to next session (not current)

**Future Implementation:**
- Students can change most parameters
- Coaches may override some settings
- Some parameters may be locked by plan

### How Rescheduling Appears

**During Session:**
1. Student reviews card
2. Clicks rating (Again/Hard/Good/Easy)
3. Card state updated:
   - `due_at` set to new date
   - `interval_days` updated
   - `scheduler_state` updated (if needed)
4. Toast shows: "Next review: in 3 days"
5. Card saved to localStorage (or database in v1)

**In Library:**
- Cards show due date badge:
  - "Overdue" (red)
  - "Today" (yellow)
  - "in 3 days" (gray)
  - "Tomorrow" (blue)

**Code Location:** `src/features/phrases/hooks/usePhrasesSession.ts`

---

## Current Implementation Status

### ✅ Implemented (v0)

- [x] Landing page with stats
- [x] Session page with review flow
- [x] Library page with filtering
- [x] Settings page
- [x] Mock phrase data (40 phrases)
- [x] Seed pack functionality
- [x] Simple scheduler (interval-based)
- [x] localStorage persistence
- [x] Rating system (Again/Hard/Good/Easy)
- [x] Card actions (bury, suspend, remove, flag, note)
- [x] Progress tracking
- [x] Responsive design

### ❌ Not Implemented

- [ ] Database persistence (localStorage only)
- [ ] Real FSRS scheduler (using mock)
- [ ] Real audio playback (mock buttons)
- [ ] Real speech recognition (mock UI)
- [ ] Phrase creation UI (admin/coach only)
- [ ] Pack assignment system
- [ ] Coach assignment system
- [ ] Multi-device sync
- [ ] Server-side analytics

---

## Testing Guide

### Test Scenario 1: First-Time User (Empty State)

**Steps:**
1. Create new account (or clear localStorage)
2. Navigate to `/phrases`
3. Verify:
   - Empty state message shown
   - "Add a starter pack" button visible
   - Stats show 0 phrases

**Expected Result:**
- Empty state displayed
- Can add starter pack

### Test Scenario 2: Seed Starter Pack

**Steps:**
1. Navigate to `/phrases`
2. Click "Add a starter pack"
3. Verify:
   - 10 phrases added
   - Stats update (Total: 10, New: 10)
   - Can start session

**Expected Result:**
- Phrases added successfully
- Stats updated
- Session available

### Test Scenario 3: Review Session

**Steps:**
1. Start a session (`/phrases/session`)
2. Review a card:
   - See prompt
   - Click "Reveal answer"
   - Rate card (Good)
3. Verify:
   - Next card appears
   - Toast shows next review date
   - Progress bar updates

**Expected Result:**
- Session flow works
- Ratings update card state
- Progress tracked

### Test Scenario 4: Rescheduling

**Steps:**
1. Review a card
2. Rate it "Good"
3. Check library (`/phrases/library`)
4. Verify:
   - Card shows "in 3 days" (or calculated interval)
   - Due date badge correct
   - Card state updated

**Expected Result:**
- Rescheduling works
- Due dates calculated correctly
- Library shows updated state

### Test Scenario 5: Change Parameters

**Steps:**
1. Navigate to `/phrases/settings`
2. Change "New per day" to 10
3. Change "Reviews per day" to 50
4. Start new session
5. Verify:
   - Limits respected
   - Settings persisted
   - Changes apply to session

**Expected Result:**
- Settings saved
- Limits applied
- Session respects settings

### Test Scenario 6: Card Actions

**Steps:**
1. Open library
2. Find a card
3. Click actions menu (⋯)
4. Test actions:
   - Bury card
   - Suspend card
   - Remove card
   - Flag issue
   - Add note
5. Verify:
   - Actions work
   - Card state updated
   - Changes persist

**Expected Result:**
- All actions functional
- State updates correctly
- Persistence works

---

## Key Files Reference

- **Landing Page:** `src/pages/PhrasesLandingPage.tsx`
- **Session Page:** `src/pages/PhrasesSessionPage.tsx`
- **Library Page:** `src/pages/PhrasesLibraryPage.tsx`
- **Settings Page:** `src/pages/PhrasesSettingsPage.tsx`
- **Session Hook:** `src/features/phrases/hooks/usePhrasesSession.ts`
- **Library Hook:** `src/features/phrases/hooks/usePhrasesLibrary.ts`
- **Settings Hook:** `src/features/phrases/hooks/usePhrasesSettings.ts`
- **Scheduler:** `src/features/phrases/data/schedulerMock.ts`
- **Mock Data:** `src/features/phrases/data/mockPhrasesData.ts`
- **Database Migration:** `supabase/migrations/20260102164444_phrases_learning_ladder.sql`
- **Documentation:** `docs/16_PHRASES_UX_AND_SRS_BEHAVIOR.md`

---

## Next Steps for Implementation

### High Priority (v1)

1. **Database Migration**
   - Migrate localStorage data to Supabase
   - Create `member_phrase_cards` records
   - Add RLS policies

2. **Real FSRS Scheduler**
   - Install `ts-fsrs` library
   - Replace mock scheduler
   - Implement target retention

3. **Pack Assignment System**
   - Coach assigns packs to students
   - System creates cards automatically
   - Students see assigned phrases

### Medium Priority (v1.5)

4. **Real Audio Playback**
   - Generate TTS audio for recognition phrases
   - Store in Supabase Storage
   - Implement audio player

5. **Real Speech Recognition**
   - Browser Speech API integration
   - Token matching
   - Similarity calculation

---

**This document should be updated as phrases features are implemented or changed.**

