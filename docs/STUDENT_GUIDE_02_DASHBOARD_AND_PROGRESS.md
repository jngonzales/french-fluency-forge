# Student Guide: Dashboard and Progress Tracking

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Dashboard](#accessing-the-dashboard)
3. [Initial Dashboard State](#initial-dashboard-state)
4. [Dashboard Components](#dashboard-components)
5. [Speaking Assessment Integration](#speaking-assessment-integration)
6. [Testing Dashboard with Dummy Data](#testing-dashboard-with-dummy-data)
7. [Current Implementation Status](#current-implementation-status)
8. [Testing Guide](#testing-guide)

---

## Overview

The Student Dashboard (called "Progress Hub" in the UI) is the central hub where students can:
- View their progress over time
- See their speaking assessment results
- Track daily habits
- Manage goals
- View achievements and badges
- Access all learning resources

**Location:** `/dashboard`

**File:** `src/pages/DashboardPage.tsx`

---

## Accessing the Dashboard

### How Students Access

1. **After Login/Activation:**
   - Student logs in or activates account
   - Automatically redirected to `/dashboard` (or `/` which may redirect)
   - Dashboard loads with user's data

2. **Direct Navigation:**
   - Student can navigate to `/dashboard` directly
   - If not logged in, redirected to login page
   - Protected route (requires authentication)

3. **From Other Pages:**
   - "Dashboard" link in navigation
   - "Back to Dashboard" buttons throughout app

### Authentication Check

```typescript
// Dashboard checks for user session
const { user } = useAuth();
if (!user) {
  return <div>Please sign in to view your dashboard.</div>;
}
```

---

## Initial Dashboard State

### First-Time User Experience

When a student first joins and has **no assessment data**:

1. **Progress Timeline:**
   - Shows empty state or placeholder
   - May show mock historical data for demo purposes
   - Message: "Complete your first assessment to see progress"

2. **Radar Chart (Skill Profile):**
   - Shows empty state
   - No baseline or current scores
   - Message: "Complete an assessment to see your skill profile"

3. **Habits:**
   - Shows empty habit grid
   - "Add your first habit" prompt
   - Mock habits may be pre-populated for demo

4. **Goals:**
   - Empty goals list
   - "Create your first goal" prompt
   - Mock goals may be pre-populated for demo

5. **Badges:**
   - Shows locked badges
   - "First Assessment" badge available after first assessment
   - Other badges locked until criteria met

6. **Phrase Stats:**
   - Shows 0 phrases if no phrases assigned
   - May show mock stats for demo

### Data Loading Behavior

**File:** `src/features/dashboard/hooks/useDashboardData.ts`

```typescript
// If no real assessments, uses mock data for demo
if (assessments.length === 0) {
  const { generateMockAssessmentHistory } = await import('../data/mockData');
  assessments = generateMockAssessmentHistory();
}
```

**Key Behavior:**
- Real assessment data is fetched from `assessment_sessions` table
- If no real data exists, mock data is used for demonstration
- Mock data includes:
  - Historical assessment snapshots
  - Baseline and current scores
  - Timeline projections

---

## Dashboard Components

### 1. Progress Timeline Card

**Component:** `ProgressTimelineCard.tsx`

**What It Shows:**
- Line chart showing progress over time
- X-axis: Date range (30d, 90d, 180d, 1y, all)
- Y-axis: Score (0-100)
- Multiple metrics: Overall, Pronunciation, Fluency, Confidence, Syntax, Conversation, Comprehension
- Goal markers (if goals are set)
- Assessment markers (when assessments were completed)

**Data Source:**
- Real assessment data from `assessment_sessions` table
- Calculated scores from `skill_recordings`, `fluency_recordings`, `comprehension_recordings`
- Projections for future dates (if goals set)

**Initial State:**
- Empty chart if no assessments
- Mock data if no real data (for demo)

### 2. Radar Chart (Skill Profile)

**Component:** `RadarCard.tsx`

**What It Shows:**
- 6-dimension radar/spider chart
- Dimensions: Pronunciation, Fluency, Confidence, Syntax, Conversation, Comprehension
- Two lines:
  - **Baseline:** First assessment scores
  - **Current:** Latest assessment scores
- Visual comparison of improvement

**Data Source:**
- `assessment_sessions` table
- Scores calculated from recordings
- Baseline = first completed assessment
- Current = most recent completed assessment

**Initial State:**
- Empty chart if no assessments
- Shows baseline only if only one assessment completed

### 3. Habit Grid Card

**Component:** `HabitGridCard.tsx`

**What It Shows:**
- Grid of habit tracking cells
- Each habit has a row
- Each day has a column
- Cells show completion status:
  - ✅ Completed (green)
  - ⚠️ Partial (yellow)
  - ❌ Not done (gray)
  - 🔒 Future (locked)
- Streak indicators
- Add habit button

**Data Source:**
- Currently: Local state (React state)
- Future: Database persistence (not yet implemented)
- Mock habits pre-populated for demo

**Initial State:**
- Empty grid if no habits
- May show 2-3 mock habits for demo

### 4. Goals Card

**Component:** `GoalsCard.tsx`

**What It Shows:**
- List of goals (skill goals, volume goals, freeform goals)
- Goal status (active, completed, locked)
- Deadline dates
- Progress indicators
- "Create Goal" button

**Data Source:**
- Currently: Local state (React state)
- Future: Database persistence (not yet implemented)
- Mock goals pre-populated for demo

**Initial State:**
- Empty list if no goals
- May show 1-2 mock goals for demo

### 5. Badges Card

**Component:** `BadgesCard.tsx`

**What It Shows:**
- Grid of achievement badges
- Locked badges (gray, locked icon)
- Unlocked badges (colored, with unlock animation)
- Points total
- Badge descriptions

**Data Source:**
- Mock badges list
- Unlock status based on:
  - First assessment completion
  - Habit streaks
  - Goal completion
  - Other achievements

**Initial State:**
- All badges locked except "First Assessment" (if assessment completed)
- Points start at 0

### 6. Phrase Stats Card

**Component:** `PhraseStatsCard.tsx`

**What It Shows:**
- Total phrases assigned
- Recall vs Recognition stats
- Due today count
- New phrases count
- Link to phrases page

**Data Source:**
- Phrases system (if implemented)
- Currently: Mock stats
- Future: Real data from `member_phrase_cards` table

**Initial State:**
- Shows 0 if no phrases assigned
- May show mock stats for demo

---

## Speaking Assessment Integration

### How Speaking Assessment Results Appear

**Terminology:** We use "Speaking Assessment" (not "Fluency Analyzer" or "Frequency Analyzer" in user-facing text, though code may reference "Fluency Analyzer").

### Data Flow

1. **Student Completes Assessment:**
   - Student goes through 6 assessment modules
   - Each module creates recordings in database:
     - `skill_recordings` (Pronunciation, Confidence, Syntax, Conversation)
     - `fluency_recordings` (Fluency/WPM)
     - `comprehension_recordings` (Comprehension)

2. **Scores Calculated:**
   - Processing view calculates scores from recordings
   - Scores stored in `assessment_sessions` table (or calculated on-the-fly)

3. **Dashboard Fetches Data:**
   ```typescript
   // src/features/dashboard/data/assessmentData.ts
   export async function fetchUserAssessments(userId: string) {
     // Fetches assessment_sessions
     // Calculates scores from recordings
     // Returns AssessmentSnapshot[]
   }
   ```

4. **Dashboard Displays:**
   - **Radar Chart:** Shows baseline vs current scores
   - **Timeline:** Shows progress over time
   - **Results Page:** Detailed breakdown (separate page)

### Integration Points

**File:** `src/features/dashboard/data/assessmentData.ts`

**Key Functions:**
- `fetchUserAssessments()` - Gets all assessments for user
- `calculateSessionScores()` - Calculates scores from recordings
- `getBaselineAndCurrent()` - Gets first and latest assessments

**Score Calculation:**
```typescript
// For each assessment session:
// 1. Fetch all recordings (skill, fluency, comprehension)
// 2. Calculate dimension scores:
//    - Pronunciation: Average of pronunciation recordings
//    - Fluency: Average WPM from fluency recordings
//    - Confidence: Combined questionnaire + speaking scores
//    - Syntax: Average of syntax recordings
//    - Conversation: Average of conversation recordings
//    - Comprehension: Average of comprehension recordings
// 3. Calculate overall score (average of all dimensions)
// 4. Return AssessmentSnapshot
```

### How Results Update

1. **Real-time Updates:**
   - Dashboard doesn't auto-refresh
   - Student must refresh page to see new results
   - Or navigate away and back

2. **After Assessment Completion:**
   - Student completes assessment
   - Processing view calculates scores
   - Results page shows scores
   - Dashboard will show new data on next visit

3. **Data Persistence:**
   - All scores stored in database
   - Dashboard always fetches latest data
   - No caching (always fresh)

---

## Testing Dashboard with Dummy Data

### Method 1: Use Mock Data (Current Implementation)

**How It Works:**
- Dashboard automatically uses mock data if no real assessments exist
- Mock data includes:
  - 3-5 historical assessment snapshots
  - Baseline and current scores
  - Timeline projections

**To Test:**
1. Create new account (or use account with no assessments)
2. Navigate to `/dashboard`
3. Verify mock data appears
4. Check all components render correctly

### Method 2: Create Test Assessment

**Steps:**
1. Complete a real assessment (or use admin tools to jump to results)
2. Verify assessment appears in database:
   ```sql
   SELECT * FROM assessment_sessions 
   WHERE user_id = 'your-user-id' 
   ORDER BY created_at DESC;
   ```
3. Refresh dashboard
4. Verify real data appears

### Method 3: Use Admin Tools to Create Dummy Assessment

**Steps:**
1. Log in as admin
2. Use admin toolbar to "Jump to Module" → Complete a module
3. Or use admin tools to create test session
4. Verify data appears in dashboard

### Method 4: Direct Database Insert (For Testing)

**SQL Example:**
```sql
-- Create test assessment session
INSERT INTO assessment_sessions (
  user_id, 
  status, 
  completed_at
) VALUES (
  'your-user-id',
  'completed',
  NOW()
);

-- Add test recordings (simplified)
-- This would require actual recording data
```

**Note:** This method is complex and not recommended. Use mock data or complete real assessments instead.

---

## Current Implementation Status

### ✅ Implemented

- [x] Dashboard page (`/dashboard`)
- [x] Progress timeline chart (Recharts)
- [x] Radar chart (6 dimensions)
- [x] Habit grid (local state)
- [x] Goals card (local state)
- [x] Badges card (mock data)
- [x] Phrase stats card (mock data)
- [x] Mock data fallback (if no real data)
- [x] Real assessment data fetching
- [x] Score calculation from recordings
- [x] Baseline vs current comparison
- [x] Timeline projections
- [x] Responsive design (mobile-friendly)

### ❌ Not Implemented / Needs Work

- [ ] Habit persistence to database (currently local state only)
- [ ] Goal persistence to database (currently local state only)
- [ ] Real phrase stats (currently mock)
- [ ] Auto-refresh on assessment completion
- [ ] Export functionality (PDF, social slides)
- [ ] Historical comparison (beyond baseline vs current)
- [ ] Goal commitment/contract system (see separate doc)
- [ ] Coach view of student dashboard (see teacher guide)

---

## Testing Guide

### Test Scenario 1: First-Time User (No Data)

**Steps:**
1. Create new account
2. Navigate to `/dashboard`
3. Verify:
   - Mock data appears (or empty states)
   - All components render
   - No errors in console
   - Mobile responsive

**Expected Result:**
- Dashboard loads successfully
- Mock data or empty states shown
- All UI elements functional

### Test Scenario 2: User with One Assessment

**Steps:**
1. Complete one assessment
2. Navigate to `/dashboard`
3. Verify:
   - Radar chart shows baseline only (or baseline = current)
   - Timeline shows one data point
   - Badges show "First Assessment" unlocked
   - Real data appears (not mock)

**Expected Result:**
- Real assessment data displayed
- Baseline = current (since only one assessment)
- Badge unlocked

### Test Scenario 3: User with Multiple Assessments

**Steps:**
1. Complete 2+ assessments
2. Navigate to `/dashboard`
3. Verify:
   - Radar chart shows baseline vs current (different)
   - Timeline shows multiple data points
   - Progress visible over time
   - All dimensions have scores

**Expected Result:**
- Progress visible
- Baseline and current differ
- Timeline shows improvement

### Test Scenario 4: Mobile Responsiveness

**Steps:**
1. Open dashboard on mobile device (or resize browser)
2. Verify:
   - All components stack vertically
   - Charts are readable
   - Touch targets adequate
   - No horizontal scroll
   - Habit grid scrolls horizontally if needed

**Expected Result:**
- Fully responsive
- Usable on mobile
- No layout issues

### Test Scenario 5: Speaking Assessment Results Display

**Steps:**
1. Complete speaking assessment
2. Wait for processing
3. Navigate to `/dashboard`
4. Verify:
   - Radar chart shows all 6 dimensions
   - Scores match results page
   - Timeline includes new assessment
   - Data persists after refresh

**Expected Result:**
- Assessment results appear correctly
- Scores accurate
- Data persists

### Test Scenario 6: Habits and Goals (Local State)

**Steps:**
1. Add a habit
2. Mark habit cells as complete
3. Create a goal
4. Refresh page
5. Verify:
   - Habits persist (localStorage)
   - Goals persist (localStorage)
   - Or data lost (if not persisted)

**Expected Result:**
- Local state works
- May or may not persist (depending on implementation)

---

## Key Files Reference

- **Dashboard Page:** `src/pages/DashboardPage.tsx`
- **Dashboard Hook:** `src/features/dashboard/hooks/useDashboardData.ts`
- **Assessment Data:** `src/features/dashboard/data/assessmentData.ts`
- **Mock Data:** `src/features/dashboard/data/mockData.ts`
- **Progress Timeline:** `src/features/dashboard/components/ProgressTimelineCard.tsx`
- **Radar Chart:** `src/features/dashboard/components/RadarCard.tsx`
- **Habit Grid:** `src/features/dashboard/components/HabitGridCard.tsx`
- **Goals Card:** `src/features/dashboard/components/GoalsCard.tsx`
- **Badges Card:** `src/features/dashboard/components/BadgesCard.tsx`
- **Phrase Stats:** `src/features/dashboard/components/PhraseStatsCard.tsx`

---

## Next Steps for Implementation

### High Priority

1. **Database Persistence for Habits**
   - Create `habits` table
   - Create `habit_cells` table
   - Migrate from local state to database

2. **Database Persistence for Goals**
   - Create `goals` table
   - Migrate from local state to database
   - Add goal commitment/contract system

3. **Real Phrase Stats**
   - Connect to phrases system
   - Fetch real data from `member_phrase_cards`

### Medium Priority

4. **Auto-Refresh on Assessment Completion**
   - Listen for new assessments
   - Refresh dashboard automatically
   - Or show notification

5. **Historical Comparison**
   - Show more than baseline vs current
   - Allow selecting any two assessments
   - Show improvement over time

---

**This document should be updated as dashboard features are implemented or changed.**

