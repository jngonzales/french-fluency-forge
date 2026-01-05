# Project Manager Documentation Index

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive documentation for senior project managers

---

## Overview

This documentation package provides a complete overview of the French Fluency Forge application, covering:
- Student features and workflows
- Teacher/coach features
- Technical implementation details
- Testing strategies
- Implementation hypotheses

**Total Documents:** 8 comprehensive guides

---

## Documentation Structure

### Student Guides (4 documents)

1. **[Authentication and Access Flow](STUDENT_GUIDE_01_AUTHENTICATION_AND_ACCESS.md)**
   - How students get access after payment
   - Sign up, sign in, log in, log out processes
   - Systeme.io payment integration
   - Account activation flow
   - Current implementation status

2. **[Dashboard and Progress Tracking](STUDENT_GUIDE_02_DASHBOARD_AND_PROGRESS.md)**
   - Initial dashboard state (dummy data vs real data)
   - Dashboard components (timeline, radar chart, habits, goals, badges)
   - Speaking assessment integration
   - How results appear on dashboard
   - Testing with dummy data

3. **[Flashcards and Phrases System](STUDENT_GUIDE_03_FLASHCARDS_AND_PHRASES.md)**
   - How to create flashcards/phrases
   - Database structure
   - Rescheduling and parameters
   - Can students change parameters?
   - Current v0 implementation (localStorage)

4. **[Additional Features](STUDENT_GUIDE_04_ADDITIONAL_FEATURES.md)**
   - Habits management (create, delete, track)
   - Goals and commitments (create, lock, contract system)
   - Teacher/coach booking (Calendly integration - not yet implemented)
   - Group lessons (Google Meet - not yet implemented)
   - Friends signalizer (not yet implemented)

### Teacher Guides (1 document)

5. **[Teacher Dashboard and Student Access](TEACHER_GUIDE_01_DASHBOARD_AND_STUDENT_ACCESS.md)**
   - Teacher dashboard (not yet fully implemented)
   - Accessing student data
   - Viewing student dashboards
   - Modifying student data (unlock goals, cancel contracts)
   - CRM information
   - Notes system

### Technical Guides (1 document)

6. **[Mobile Responsiveness](TECHNICAL_GUIDE_01_MOBILE_RESPONSIVENESS.md)**
   - Current responsive design
   - Mobile access strategy
   - What to do if students try to access on mobile
   - Testing mobile responsiveness
   - Known issues and limitations

### Implementation Guides (1 document)

7. **[Testing and Hypotheses](IMPLEMENTATION_GUIDE_01_TESTING_AND_HYPOTHESES.md)**
   - Testing strategy
   - Complete testing scenarios
   - Implementation hypotheses (what exists vs what needs to be built)
   - Dummy data testing strategies
   - Feature implementation checklist

---

## Quick Reference: What Exists vs What Needs to Be Built

### ✅ Fully Implemented

- **Authentication:** Sign up, login, activation, Systeme.io webhook
- **Dashboard:** Progress tracking, radar chart, habits (local state), goals (local state), badges
- **Speaking Assessment:** Complete 6-module assessment system, results display
- **Phrases System:** Complete UI (v0), localStorage persistence, simple scheduler
- **Mobile:** Responsive design (not optimized)

### ⚠️ Partially Implemented

- **Logout:** UI exists but button disabled
- **Habits/Goals:** UI works but no database persistence
- **Teacher Dashboard:** Admin can view student data, but no dedicated teacher dashboard
- **Commitment System:** Goal locking exists (UI), but commitment form not built
- **Phrases:** Complete UI but no database (localStorage only)

### ❌ Not Implemented

- **Teacher Booking:** Calendly integration needed
- **Group Lessons:** Google Meet integration needed
- **Friends Signalizer:** Not designed yet
- **Contract System:** Commitment form, contract generation, guarantee integration
- **Database Persistence:** Habits, goals, phrases need database migration
- **Real FSRS Scheduler:** Phrases using mock scheduler
- **Real Audio/Speech:** Phrases using mock audio/STT

---

## Key Features Summary

### Student Features

**Access:**
- Purchase through Systeme.io → Activation link → Magic link login
- Or sign up directly → Must purchase to activate

**Dashboard:**
- Progress timeline (real assessment data + mock if no data)
- Radar chart (6 dimensions: Pronunciation, Fluency, Confidence, Syntax, Conversation, Comprehension)
- Habits grid (create, track, local state)
- Goals (create, lock, local state)
- Badges and achievements
- Phrase stats (mock currently)

**Speaking Assessment:**
- Complete assessment system
- Results appear on dashboard automatically
- Data persists in database

**Phrases/Flashcards:**
- Complete UI system (v0)
- Seed pack functionality
- Review sessions
- Library management
- Settings (new per day, reviews per day, etc.)
- localStorage persistence (v0)

**Additional:**
- Habits: Create, track, delete (local state)
- Goals: Create, lock, commit (commitment form not built)
- Teacher booking: Not implemented
- Group lessons: Not implemented

### Teacher Features

**Current:**
- Admin can view student dashboards (via URL parameter)
- Coach view for phrases (mock, UI-only)
- Sales Copilot (CRM for sales, not teaching)

**Needed:**
- Teacher dashboard with student list
- Student assignment system
- Permission system
- Contract management
- Notes system
- CRM integration in teacher view

---

## Testing Guide

### Quick Test Scenarios

1. **New Student Journey:**
   - Purchase → Activation → Dashboard
   - Verify mock data appears if no assessments

2. **Speaking Assessment:**
   - Complete assessment → Check dashboard
   - Verify results appear correctly

3. **Phrases System:**
   - Add starter pack → Start session → Review cards
   - Verify rescheduling works

4. **Mobile Access:**
   - Open on mobile device
   - Verify responsive design works
   - Note any limitations

### Dummy Data Testing

- **Dashboard:** Automatically uses mock data if no real assessments
- **Phrases:** Seed pack adds 10 phrases to localStorage
- **Admin Tools:** Jump to any module for quick testing

---

## Implementation Priorities

### High Priority

1. **Database Persistence**
   - Habits → database
   - Goals → database
   - Phrases → database (v1)

2. **Teacher Dashboard**
   - Student list view
   - Student assignment system
   - Permission system

3. **Logout Functionality**
   - Enable logout button
   - Test logout flow

### Medium Priority

4. **Commitment/Contract System**
   - Build commitment form
   - Contract generation
   - Guarantee integration

5. **Teacher Booking**
   - Calendly integration
   - Booking UI

6. **Group Lessons**
   - Lesson scheduling
   - Google Meet integration

### Low Priority

7. **Friends Signalizer**
   - Design and implement social features

8. **Mobile Optimization**
   - Mobile-first layouts
   - Native app (long-term)

---

## Database Schema Reference

### Key Tables

- `profiles` - User profiles
- `app_accounts` - Access control (email-based)
- `assessment_sessions` - Speaking assessments
- `skill_recordings` - Assessment recordings
- `fluency_recordings` - Fluency/WPM data
- `comprehension_recordings` - Comprehension data
- `phrases` - Phrase content (v1)
- `member_phrase_cards` - Student phrase cards (v1)
- `sales_leads` - CRM data
- `sales_calls` - Sales call records

### Tables Needed (Not Yet Created)

- `habits` - Student habits
- `habit_cells` - Habit tracking data
- `goals` - Student goals
- `goal_contracts` - Goal commitments
- `coach_assignments` - Teacher-student links
- `student_notes` - Teacher notes
- `group_lessons` - Group lesson scheduling
- `bookings` - Teacher booking records

---

## Key Files Reference

### Student Features
- Dashboard: `src/pages/DashboardPage.tsx`
- Phrases: `src/pages/PhrasesLandingPage.tsx`, `src/pages/PhrasesSessionPage.tsx`
- Authentication: `src/pages/Signup.tsx`, `src/pages/Login.tsx`, `src/pages/Activate.tsx`

### Teacher Features
- Coach Phrases: `src/pages/PhrasesCoachPage.tsx`
- Sales Copilot: `src/pages/admin/SalesCopilot.tsx`

### Technical
- Mobile Hook: `src/hooks/use-mobile.tsx`
- Admin Tools: `src/components/AdminToolbar.tsx`
- Database Migrations: `supabase/migrations/`

---

## Next Steps for Project Manager

1. **Review All Documentation**
   - Read through all 8 documents
   - Understand current state
   - Identify gaps and priorities

2. **Plan Implementation**
   - Use implementation checklist
   - Assign priorities
   - Estimate effort

3. **Set Up Testing**
   - Configure test environment
   - Run test scenarios
   - Document issues

4. **Coordinate Development**
   - Assign tasks to developers
   - Track progress
   - Update documentation as features are built

---

## Support and Questions

**For Technical Questions:**
- See individual documentation files
- Check `CODEBASE_SUMMARY.md` for technical overview
- Review `docs/` folder for detailed technical docs

**For Feature Questions:**
- See student/teacher guides
- Check implementation guide for hypotheses
- Review testing scenarios

**For Database Questions:**
- See `docs/02_DATABASE_SCHEMA.md`
- Check migration files in `supabase/migrations/`

---

**This index should be updated as documentation evolves.**

