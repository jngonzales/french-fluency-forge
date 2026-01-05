# Implementation Guide: Testing and Hypotheses

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Reference Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Testing Scenarios](#testing-scenarios)
4. [Implementation Hypotheses](#implementation-hypotheses)
5. [Dummy Data Testing](#dummy-data-testing)
6. [Feature Implementation Checklist](#feature-implementation-checklist)

---

## Overview

This document provides a comprehensive guide for testing the application and implementing new features. It includes testing scenarios, hypotheses for what needs to be built, and strategies for testing with dummy data.

**Purpose:**
- Guide for project managers
- Testing scenarios for QA
- Implementation hypotheses for developers
- Dummy data strategies for testing

---

## Testing Strategy

### Testing Levels

1. **Unit Tests** - Individual components/functions
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user flows (Playwright)
4. **Manual Testing** - Human verification
5. **Dummy Data Testing** - Test with mock data

### Current Test Coverage

**E2E Tests (Playwright):**
- ✅ 138 automated tests
- ✅ Authentication flows
- ✅ UI/Accessibility tests
- ✅ Assessment modules
- ⚠️ Some tests require Supabase credentials

**Manual Testing:**
- ✅ Admin tools for quick testing
- ✅ Mock data for dashboard
- ✅ LocalStorage for phrases

---

## Testing Scenarios

### Scenario 1: New Student Journey

**Goal:** Test complete flow from purchase to first dashboard view

**Steps:**
1. **Purchase Flow:**
   - Complete purchase on Systeme.io (test mode)
   - Verify webhook received
   - Verify `app_accounts` record created with `access_status = 'active'`

2. **Activation Flow:**
   - Navigate to `/activate`
   - Enter purchase email
   - Verify magic link sent
   - Click magic link (or use test link)
   - Verify redirect to dashboard

3. **First Dashboard View:**
   - Verify dashboard loads
   - Check for mock data (if no assessments)
   - Verify all components render
   - Check mobile responsiveness

**Expected Results:**
- ✅ Student can access dashboard
- ✅ Mock data appears (if no real data)
- ✅ All components functional
- ✅ No errors in console

**Hypothesis:**
- If student has no assessments, dashboard shows mock data
- If student has assessments, dashboard shows real data
- Dashboard should always load (never crash)

### Scenario 2: Speaking Assessment Integration

**Goal:** Test how speaking assessment results appear on dashboard

**Steps:**
1. **Complete Assessment:**
   - Complete full speaking assessment (all 6 modules)
   - Wait for processing
   - Verify results page shows scores

2. **Check Database:**
   ```sql
   SELECT * FROM assessment_sessions 
   WHERE user_id = 'test-user-id' 
   ORDER BY created_at DESC;
   
   SELECT * FROM skill_recordings 
   WHERE session_id = 'session-id';
   
   SELECT * FROM fluency_recordings 
   WHERE session_id = 'session-id';
   ```

3. **View Dashboard:**
   - Navigate to `/dashboard`
   - Verify radar chart shows all 6 dimensions
   - Verify timeline includes new assessment
   - Verify scores match results page

4. **Refresh and Verify:**
   - Refresh page
   - Verify data persists
   - Verify scores are accurate

**Expected Results:**
- ✅ Assessment results appear on dashboard
- ✅ Radar chart shows all dimensions
- ✅ Timeline shows progress
- ✅ Data persists after refresh

**Hypothesis:**
- Dashboard fetches assessment data from database
- Scores calculated from recordings
- Dashboard updates when new assessment completed
- Data always fresh (no stale cache)

### Scenario 3: Flashcards/Phrases System

**Goal:** Test phrases system functionality

**Steps:**
1. **First-Time User:**
   - Navigate to `/phrases`
   - Verify empty state
   - Click "Add a starter pack"
   - Verify 10 phrases added
   - Check localStorage: `solv_phrases_cards_${userId}`

2. **Start Session:**
   - Click "Start a session"
   - Verify queue built (due + new cards)
   - Review a card:
     - See prompt
     - Click "Reveal answer"
     - Rate card (Good)
   - Verify next card appears
   - Verify toast shows next review date

3. **Check Library:**
   - Navigate to `/phrases/library`
   - Verify card shows updated due date
   - Verify stats updated (reviews count)

4. **Change Settings:**
   - Navigate to `/phrases/settings`
   - Change "New per day" to 10
   - Start new session
   - Verify limits respected

**Expected Results:**
- ✅ Phrases system works end-to-end
- ✅ Cards rescheduled correctly
- ✅ Settings applied
- ✅ Data persists (localStorage)

**Hypothesis:**
- Phrases system works with localStorage (v0)
- Database persistence needed for v1
- Settings affect next session (not current)

### Scenario 4: Habits and Goals

**Goal:** Test habits and goals functionality

**Steps:**
1. **Create Habit:**
   - Navigate to dashboard
   - Find Habit Grid Card
   - Click "Add Habit"
   - Enter habit name
   - Create habit
   - Verify habit appears in grid

2. **Track Habit:**
   - Mark some cells as complete
   - Mark some as partial
   - Verify grid updates
   - Refresh page
   - Verify persistence (if localStorage used)

3. **Create Goal:**
   - Find Goals Card
   - Click "Create Goal"
   - Select "Skill Goal"
   - Enter details (name, target score, deadline)
   - Check "Lock this goal"
   - Create goal
   - Verify goal appears

4. **Test Goal Locking:**
   - Try to edit locked goal
   - Verify edit disabled (if implemented)
   - Verify "Locked" badge shown

**Expected Results:**
- ✅ Habits can be created and tracked
- ✅ Goals can be created
- ✅ Locking works (UI)
- ⚠️ Persistence may vary (local state vs localStorage)

**Hypothesis:**
- Habits/goals work in local state
- Database persistence needed
- Commitment form not yet implemented

### Scenario 5: Teacher/Coach Features

**Goal:** Test teacher access to student data

**Steps:**
1. **View Student Dashboard (Admin):**
   - Log in as admin
   - Get student user ID from database
   - Navigate to `/dashboard?memberId=student-id`
   - Verify student's data loads
   - Verify all components show student data

2. **Coach Phrases View:**
   - Navigate to `/phrases/coach`
   - Verify coach view loads
   - Select mock member
   - Verify member stats shown (mock)

3. **Test Permissions:**
   - Try to access student data as non-admin
   - Verify access denied (if RLS policies exist)

**Expected Results:**
- ✅ Admin can view student data
- ✅ Coach view works (mock)
- ⚠️ Teacher dashboard not yet implemented

**Hypothesis:**
- Teacher dashboard needs to be built
- Permission system needs implementation
- Student assignment system needed

### Scenario 6: Mobile Access

**Goal:** Test mobile responsiveness

**Steps:**
1. **Desktop View:**
   - Open app on desktop
   - Verify layout works
   - Test all features

2. **Mobile Viewport:**
   - Open DevTools
   - Set viewport to 375px (iPhone)
   - Test all pages:
     - Dashboard
     - Assessment
     - Phrases
   - Verify:
     - No horizontal scroll
     - Touch targets adequate
     - Forms usable

3. **Real Mobile Device:**
   - Deploy to production
   - Open on real device
   - Test audio recording
   - Test navigation
   - Verify performance

**Expected Results:**
- ✅ App works on mobile
- ⚠️ Some features may be difficult
- ⚠️ Audio may have device-specific issues

**Hypothesis:**
- Responsive design works but not optimized
- Mobile-first optimization needed
- Native app may be needed long-term

---

## Implementation Hypotheses

### Hypothesis 1: Authentication Flow

**What Exists:**
- Sign up, login, activation pages
- Systeme.io webhook handler
- Magic link authentication

**What Needs to Be Built:**
- Logout button in dashboard (UI exists but disabled)
- Password reset flow (pages exist but may need work)
- Direct link from Systeme.io to activation page
- Account linking (if student uses different email)

**Testing:**
- Test complete purchase → activation → dashboard flow
- Test login/logout
- Test password reset (if implemented)

### Hypothesis 2: Dashboard with Dummy Data

**What Exists:**
- Dashboard with mock data fallback
- Real assessment data fetching
- Score calculation

**What Needs to Be Built:**
- Database persistence for habits
- Database persistence for goals
- Real phrase stats (currently mock)
- Auto-refresh on assessment completion

**Testing:**
- Test with no assessments (mock data)
- Test with one assessment (baseline only)
- Test with multiple assessments (progress visible)
- Test habits/goals persistence

### Hypothesis 3: Speaking Assessment Integration

**What Exists:**
- Assessment system (6 modules)
- Score calculation
- Dashboard data fetching

**What Needs to Be Built:**
- Real-time updates (auto-refresh)
- Historical comparison (beyond baseline vs current)
- Export functionality

**Testing:**
- Complete assessment
- Verify results appear on dashboard
- Verify data persists
- Test score accuracy

### Hypothesis 4: Flashcards/Phrases System

**What Exists:**
- Complete UI (v0)
- Mock data and localStorage
- Simple scheduler

**What Needs to Be Built:**
- Database persistence (v1)
- Real FSRS scheduler
- Real audio playback
- Real speech recognition
- Pack assignment system

**Testing:**
- Test with localStorage (current)
- Test seed pack functionality
- Test rescheduling
- Test settings changes

### Hypothesis 5: Teacher/Coach Features

**What Exists:**
- Admin can view student data (via URL parameter)
- Coach view for phrases (mock)

**What Needs to Be Built:**
- Teacher dashboard
- Student list view
- Permission system
- Contract management
- Notes system
- CRM integration

**Testing:**
- Test admin viewing student data
- Test coach phrases view
- Document what's missing

### Hypothesis 6: Additional Features

**What Exists:**
- Habits/goals UI (local state)
- Goal locking (UI only)

**What Needs to Be Built:**
- Commitment form
- Contract system
- Teacher booking (Calendly)
- Group lessons (Google Meet)
- Friends signalizer

**Testing:**
- Test habits/goals (local state)
- Document missing features

---

## Dummy Data Testing

### Strategy 1: Mock Data in Dashboard

**How It Works:**
- Dashboard automatically uses mock data if no real assessments
- Mock data includes historical assessments
- Good for testing UI and components

**Usage:**
1. Create new account (or use account with no assessments)
2. Navigate to `/dashboard`
3. Mock data appears automatically

**Files:**
- `src/features/dashboard/data/mockData.ts`

### Strategy 2: Seed Pack for Phrases

**How It Works:**
- Phrases system has seed pack functionality
- Adds 10 phrases to localStorage
- Good for testing phrases flow

**Usage:**
1. Navigate to `/phrases`
2. Click "Add a starter pack"
3. Phrases added to localStorage

**Files:**
- `src/pages/PhrasesLandingPage.tsx`
- `src/features/phrases/data/mockPhrasesData.ts`

### Strategy 3: Admin Tools for Testing

**How It Works:**
- Admin toolbar allows jumping to any module
- Can create test sessions
- Good for quick testing

**Usage:**
1. Log in as admin
2. Use admin toolbar to jump to module
3. Complete module quickly
4. Test dashboard with real data

**Files:**
- `src/components/AdminToolbar.tsx`

### Strategy 4: Direct Database Inserts (Advanced)

**How It Works:**
- Insert test data directly into database
- Good for testing specific scenarios
- Requires database access

**Example:**
```sql
-- Create test assessment
INSERT INTO assessment_sessions (user_id, status, completed_at)
VALUES ('user-id', 'completed', NOW());

-- Add test recordings (simplified)
-- This requires actual recording data
```

**Note:** Complex and not recommended. Use mock data or complete real assessments instead.

---

## Feature Implementation Checklist

### High Priority

- [ ] **Logout Button**
  - Enable logout in dashboard
  - Test logout flow

- [ ] **Database Persistence for Habits**
  - Create `habits` table
  - Create `habit_cells` table
  - Migrate from local state

- [ ] **Database Persistence for Goals**
  - Create `goals` table
  - Migrate from local state
  - Add commitment/contract fields

- [ ] **Teacher Dashboard**
  - Create teacher dashboard page
  - Build student list
  - Add student search/filter

### Medium Priority

- [ ] **Commitment Form System**
  - Build commitment form
  - Add contract generation
  - Store contracts in database

- [ ] **Teacher Booking (Calendly)**
  - Build coach assignment system
  - Integrate Calendly
  - Add booking UI

- [ ] **Group Lessons**
  - Build lesson scheduling
  - Add Google Meet integration
  - Create upcoming lessons display

- [ ] **Real Phrase Stats**
  - Connect to phrases system
  - Fetch real data from database

### Low Priority

- [ ] **Friends Signalizer**
  - Design social features
  - Build friend system
  - Add progress sharing

- [ ] **Mobile Optimization**
  - Create mobile-specific layouts
  - Optimize for touch
  - Improve mobile experience

---

## Key Files Reference

**Testing:**
- E2E Tests: `e2e/` folder
- Test Config: `playwright.config.ts`
- Test Fixtures: `e2e/fixtures/`

**Mock Data:**
- Dashboard Mock: `src/features/dashboard/data/mockData.ts`
- Phrases Mock: `src/features/phrases/data/mockPhrasesData.ts`

**Admin Tools:**
- Admin Toolbar: `src/components/AdminToolbar.tsx`
- Admin Config: `src/config/admin.ts`

**Database:**
- Migrations: `supabase/migrations/`
- Schema: See `docs/02_DATABASE_SCHEMA.md`

---

## Next Steps

1. **Review All Documentation**
   - Read all 8 documentation files
   - Understand current state
   - Identify gaps

2. **Prioritize Features**
   - Use checklist above
   - Assign priorities
   - Plan implementation

3. **Set Up Testing**
   - Configure test environment
   - Set up dummy data
   - Run test scenarios

4. **Implement Features**
   - Start with high priority
   - Test as you go
   - Update documentation

---

**This document should be updated as features are implemented and tested.**

