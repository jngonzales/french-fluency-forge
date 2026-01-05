# Student Guide: Additional Features

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Mixed (some implemented, some planned)

---

## Table of Contents

1. [Overview](#overview)
2. [Habits Management](#habits-management)
3. [Goals and Commitments](#goals-and-commitments)
4. [Teacher/Coach Booking](#teachercoach-booking)
5. [Group Lessons](#group-lessons)
6. [Friends Signalizer](#friends-signalizer)
7. [Current Implementation Status](#current-implementation-status)
8. [Testing Guide](#testing-guide)

---

## Overview

This document covers additional features available to students:
- Daily habits tracking
- Goals and commitment contracts
- Booking sessions with teachers/coaches
- Joining group lessons
- Friends/social features (signalizer)

**Note:** Many of these features are partially implemented or planned. This document describes both what exists and what needs to be built.

---

## Habits Management

### Current Implementation

**Location:** Dashboard → Habit Grid Card

**Component:** `src/features/dashboard/components/HabitGridCard.tsx`

**What Students Can Do:**
- ✅ Create new habits
- ✅ Mark habit cells as complete/partial/not done
- ✅ View habit streaks
- ✅ See habit grid (habits × days)
- ✅ Delete habits (via actions menu)

**What It Shows:**
- Grid layout: Each habit is a row, each day is a column
- Cell status:
  - ✅ Green = Completed
  - ⚠️ Yellow = Partial
  - ❌ Gray = Not done
  - 🔒 Locked = Future date
- Streak indicators
- Add habit button

### Creating Habits

**Current Flow:**
1. Click "Add Habit" button in Habit Grid Card
2. Dialog opens
3. Enter habit name (e.g., "Practice French 15 min")
4. Click "Create"
5. Habit appears in grid
6. Can mark cells as complete

**Code Location:** `src/features/dashboard/hooks/useDashboardData.ts`

```typescript
const addHabit = (habit: Habit) => {
  setHabits((prev) => [...prev, habit]);
  // Generate grid cells for this habit
  const newCells = generateHabitCells(habit);
  setHabitGrid((prev) => [...prev, ...newCells]);
};
```

**Data Storage:**
- Currently: Local state (React state)
- Future: Database persistence (not yet implemented)
- May persist to localStorage (check implementation)

### Deleting Habits

**Current Flow:**
1. Find habit in grid
2. Click actions menu (if available)
3. Select "Delete" or "Remove"
4. Habit removed from grid
5. Grid cells removed

**Note:** Delete functionality may not be fully implemented. Check `HabitGridCard.tsx` for available actions.

### Current Limitations

- ❌ No database persistence (local state only)
- ❌ Data lost on page refresh (unless localStorage used)
- ❌ No multi-device sync
- ❌ No habit templates
- ❌ No habit categories/tags

---

## Goals and Commitments

### Current Implementation

**Location:** Dashboard → Goals Card

**Component:** `src/features/dashboard/components/GoalsCard.tsx`

**What Students Can Do:**
- ✅ Create goals (skill goals, volume goals, freeform goals)
- ✅ View goals list
- ✅ Update goal details
- ✅ See goal progress
- ✅ Lock goals (commitment)

**Goal Types:**
1. **Skill Goals:** Target score for a dimension (e.g., "Pronunciation: 80/100")
2. **Volume Goals:** Target value for a metric (e.g., "Complete 50 phrase reviews")
3. **Freeform Goals:** Custom text goals (e.g., "Have a 10-minute conversation in French")

### Creating Goals

**Current Flow:**
1. Click "Create Goal" in Goals Card
2. Dialog opens (`GoalDialog.tsx`)
3. Select goal type
4. Enter details:
   - Name
   - Description
   - Acceptance criteria
   - Deadline
   - Target value (if skill/volume)
5. Optionally check "Lock this goal" (commitment)
6. Click "Create"
7. Goal appears in list

**Code Location:** `src/features/dashboard/components/GoalDialog.tsx`

### Goal Commitment/Contract System

**Status:** ❌ **Not Fully Implemented**

**What Should Happen:**
1. Student creates goal
2. Student clicks "Commit to this goal"
3. System opens commitment form
4. Form includes:
   - Goal details (what student commits to)
   - Target numbers/metrics
   - What coach commits to
   - What student commits to
   - Agreement checkbox
5. Student and coach sign/agree
6. Contract locked (cannot be changed)
7. Tied to guarantees:
   - 14-day refund guarantee
   - 90-day extra month guarantee

**Current State:**
- Goal locking exists (UI shows "Locked" badge)
- Commitment form **not implemented**
- Contract system **not implemented**
- Guarantee integration **not implemented**

**What Needs to Be Built:**
- Commitment form component
- Contract document generation
- Contract storage (database table)
- Lock/unlock functionality (coach can unlock)
- Guarantee tracking

### Goal Parameters

**Can Students Change Parameters?**

**Unlocked Goals:**
- ✅ Yes - Students can edit all fields
- ✅ Can change deadline
- ✅ Can change target values
- ✅ Can update description

**Locked Goals:**
- ❌ No - Only coach can unlock/modify
- Locked goals show "Locked" badge
- Edit button disabled

**Code:**
```typescript
// src/features/dashboard/components/GoalDialog.tsx
{goal.locked && (
  <div className="text-sm text-muted-foreground">
    Locked goals can only be changed by your coach
  </div>
)}
```

### Current Limitations

- ❌ No database persistence (local state only)
- ❌ Commitment form not implemented
- ❌ Contract system not implemented
- ❌ Guarantee integration not implemented
- ❌ Coach unlock functionality not implemented

---

## Teacher/Coach Booking

### Current Implementation

**Status:** ❌ **Not Implemented**

**What Should Happen:**
1. Student has assigned teacher/coach
2. Student sees "Book a session" link/button
3. Click opens Calendly popup/embed
4. Student selects time slot
5. Booking confirmed
6. Calendar event created

**What Needs to Be Built:**
- Teacher/coach assignment system
- Calendly integration (embed or popup)
- Booking UI component
- Calendar sync
- Notification system

### Planned Implementation

**Database Tables Needed:**
- `coach_assignments` - Links students to coaches
- `coach_calendly_links` - Stores Calendly URLs per coach
- `bookings` - Stores booking records

**UI Components:**
- Booking button/link in dashboard
- Calendly embed component
- Booking confirmation page

**Integration:**
- Calendly embed: `<iframe src="coach-calendly-url" />`
- Or Calendly popup: `Calendly.initPopupWidget()`
- Or redirect to Calendly page

**Code Location (Planned):**
- `src/components/coach/CalendlyEmbed.tsx`
- `src/pages/BookSession.tsx`

---

## Group Lessons

### Current Implementation

**Status:** ❌ **Not Implemented**

**What Should Happen:**
1. Student sees "Group Conversation Lesson" in dashboard
2. Shows next scheduled lesson date/time
3. Shows "Group Coaching Lesson" separately
4. Click "Join" button
5. Opens Google Meet link
6. Student joins video call

**What Needs to Be Built:**
- Group lesson scheduling system
- Lesson database table
- Google Meet link storage
- Join button/link
- Upcoming lessons display

### Planned Implementation

**Database Tables Needed:**
- `group_lessons` - Stores lesson details
  - `lesson_type` (conversation/coaching)
  - `scheduled_at` (date/time)
  - `google_meet_link` (URL)
  - `coach_id` (who's leading)
  - `participant_ids` (who's enrolled)

**UI Components:**
- Upcoming lessons card in dashboard
- Join button
- Lesson history

**Integration:**
- Google Meet links stored in database
- Direct link: `window.open(googleMeetLink, '_blank')`
- Or embed (if supported)

**Code Location (Planned):**
- `src/components/lessons/UpcomingLessonsCard.tsx`
- `src/pages/GroupLesson.tsx`

---

## Friends Signalizer

### Current Implementation

**Status:** ❌ **Not Implemented**

**What Should Happen:**
- Social features for students
- Friend connections
- Progress sharing
- Motivation/accountability

**What Needs to Be Built:**
- Friend system (add/remove friends)
- Friend requests
- Progress visibility (privacy settings)
- Social feed/activity
- Leaderboards (optional)

**Note:** This feature is mentioned but not yet designed. Needs specification before implementation.

---

## Current Implementation Status

### ✅ Implemented

- [x] Habits grid UI
- [x] Create habits
- [x] Mark habit cells
- [x] Goals card UI
- [x] Create goals
- [x] Update goals
- [x] Lock goals (UI only)
- [x] Goal types (skill/volume/freeform)

### ❌ Not Implemented

- [ ] Habits database persistence
- [ ] Goals database persistence
- [ ] Commitment form
- [ ] Contract system
- [ ] Guarantee integration
- [ ] Teacher/coach booking
- [ ] Calendly integration
- [ ] Group lessons
- [ ] Google Meet integration
- [ ] Friends signalizer
- [ ] Coach unlock functionality

---

## Testing Guide

### Test Scenario 1: Create and Track Habits

**Steps:**
1. Navigate to dashboard
2. Find Habit Grid Card
3. Click "Add Habit"
4. Enter habit name
5. Create habit
6. Mark some cells as complete
7. Refresh page
8. Verify:
   - Habit persists (if localStorage used)
   - Or habit lost (if only local state)

**Expected Result:**
- Habit creation works
- Cell marking works
- Persistence depends on implementation

### Test Scenario 2: Create and Lock Goals

**Steps:**
1. Navigate to dashboard
2. Find Goals Card
3. Click "Create Goal"
4. Select "Skill Goal"
5. Enter details
6. Check "Lock this goal"
7. Create goal
8. Try to edit goal
9. Verify:
   - Goal shows "Locked" badge
   - Edit button disabled (if implemented)

**Expected Result:**
- Goal creation works
- Locking works (UI)
- Editing restricted (if implemented)

### Test Scenario 3: Teacher Booking (Not Yet Available)

**Steps:**
1. Check if booking feature exists
2. If not, verify it's planned
3. Document what needs to be built

**Expected Result:**
- Feature not available
- Needs implementation

### Test Scenario 4: Group Lessons (Not Yet Available)

**Steps:**
1. Check dashboard for group lessons
2. If not visible, verify it's planned
3. Document what needs to be built

**Expected Result:**
- Feature not available
- Needs implementation

---

## Key Files Reference

- **Habit Grid:** `src/features/dashboard/components/HabitGridCard.tsx`
- **Goals Card:** `src/features/dashboard/components/GoalsCard.tsx`
- **Goal Dialog:** `src/features/dashboard/components/GoalDialog.tsx`
- **Dashboard Hook:** `src/features/dashboard/hooks/useDashboardData.ts`
- **Dashboard Types:** `src/features/dashboard/types.ts`

---

## Next Steps for Implementation

### High Priority

1. **Database Persistence for Habits**
   - Create `habits` table
   - Create `habit_cells` table
   - Migrate from local state

2. **Database Persistence for Goals**
   - Create `goals` table
   - Migrate from local state
   - Add commitment/contract fields

3. **Commitment Form System**
   - Build commitment form component
   - Add contract generation
   - Store contracts in database

### Medium Priority

4. **Teacher/Coach Booking**
   - Build coach assignment system
   - Integrate Calendly
   - Add booking UI

5. **Group Lessons**
   - Build lesson scheduling
   - Add Google Meet integration
   - Create upcoming lessons display

### Low Priority

6. **Friends Signalizer**
   - Design social features
   - Build friend system
   - Add progress sharing

---

**This document should be updated as features are implemented or changed.**

