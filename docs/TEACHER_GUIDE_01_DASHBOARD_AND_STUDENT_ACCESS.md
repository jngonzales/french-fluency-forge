# Teacher Guide: Dashboard and Student Access

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Partially Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Teacher Dashboard](#teacher-dashboard)
3. [Accessing Student Data](#accessing-student-data)
4. [Student Dashboard View](#student-dashboard-view)
5. [Modifying Student Data](#modifying-student-data)
6. [CRM Information](#crm-information)
7. [Notes System](#notes-system)
8. [Current Implementation Status](#current-implementation-status)
9. [Testing Guide](#testing-guide)

---

## Overview

Teachers (we call them "coaches" in the codebase) need a dashboard to:
- View list of their students
- Access student dashboards
- View student flashcards/phrases
- Modify student data (with more autonomy)
- Cancel/modify contracts
- View CRM information
- Write notes about students

**Note:** This feature is **partially implemented**. Some functionality exists (coach view for phrases), but a full teacher dashboard is not yet built.

---

## Teacher Dashboard

### Current Implementation

**Status:** ❌ **Not Fully Implemented**

**What Exists:**
- Coach view for phrases (`/phrases/coach`)
- Admin tools (for testing)
- Sales Copilot (for sales, not teaching)

**What's Missing:**
- Dedicated teacher dashboard
- Student list view
- Student management UI
- Contract management UI

### Planned Implementation

**Location:** `/teacher` or `/coach` (TBD)

**Components Needed:**
- Student list/inbox
- Student detail view
- Quick actions (view dashboard, view phrases, etc.)
- Search/filter students
- Student assignment management

**Database Tables Needed:**
- `coach_assignments` - Links coaches to students
  ```sql
  CREATE TABLE coach_assignments (
    id uuid PRIMARY KEY,
    coach_id uuid REFERENCES profiles(id),
    student_id uuid REFERENCES profiles(id),
    assigned_at timestamptz DEFAULT now(),
    status text DEFAULT 'active',
    UNIQUE(coach_id, student_id)
  );
  ```

---

## Accessing Student Data

### Current Implementation

**Status:** ⚠️ **Partially Implemented**

**What Exists:**
- Admin can view any student's dashboard via URL parameter: `/dashboard?memberId=student-id`
- Coach view for phrases (mock, UI-only)
- Sales Copilot can view student assessment data

**What's Missing:**
- Teacher-specific access control
- Teacher dashboard with student list
- Direct links to student dashboards
- Permission system (RLS policies for teachers)

### How It Should Work

**Planned Flow:**
1. Teacher logs in
2. Sees teacher dashboard with student list
3. Clicks student name
4. Redirected to student's dashboard view
5. Can see all student data (dashboard, phrases, assessments)

**Code Location (Planned):**
- `src/pages/teacher/TeacherDashboard.tsx`
- `src/pages/teacher/StudentListView.tsx`
- `src/pages/teacher/StudentDetailView.tsx`

**Access Control:**
```typescript
// Check if user is coach for student
const isCoachForStudent = async (coachId: string, studentId: string) => {
  const { data } = await supabase
    .from('coach_assignments')
    .select('id')
    .eq('coach_id', coachId)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single();
  return !!data;
};
```

---

## Student Dashboard View

### Current Implementation

**File:** `src/pages/DashboardPage.tsx`

**Feature:** Dashboard can view another user's data via URL parameter

**Code:**
```typescript
const [searchParams] = useSearchParams();
const viewingMemberId = searchParams.get('memberId') || undefined;

const { data, loading, error } = useDashboardData(viewingMemberId);
```

**How It Works:**
- If `?memberId=xxx` in URL, dashboard loads that user's data
- If no parameter, loads current user's data
- Works for admins (no permission check yet)

**Usage:**
- Admin can view: `/dashboard?memberId=student-uuid`
- Teacher should be able to view: `/dashboard?memberId=student-uuid` (with permission check)

### What Teachers Can See

**When viewing student dashboard, teachers see:**
- ✅ Progress timeline (student's assessments)
- ✅ Radar chart (student's skill profile)
- ✅ Habit grid (student's habits)
- ✅ Goals (student's goals)
- ✅ Badges (student's achievements)
- ✅ Phrase stats (student's phrase progress)

**All the same components as student sees, but with teacher context.**

---

## Modifying Student Data

### Current Implementation

**Status:** ❌ **Not Implemented**

**What Should Happen:**
- Teachers can modify student data with more autonomy than students
- Can unlock locked goals
- Can cancel/modify contracts
- Can adjust phrase settings
- Can manage student habits/goals

**What Needs to Be Built:**
- Permission system (teacher can modify student data)
- Unlock goal functionality
- Contract management UI
- Student data modification endpoints

### Contract Management

**Status:** ❌ **Not Implemented**

**What Should Happen:**
1. Teacher views student's goals
2. Sees locked goals
3. Can unlock goal (if needed)
4. Can cancel contract (if student requests)
5. Can modify contract terms (with approval)

**What Needs to Be Built:**
- Contract table in database
- Contract management UI
- Unlock/modify/cancel functionality
- Audit log for contract changes

**Database Table Needed:**
```sql
CREATE TABLE goal_contracts (
  id uuid PRIMARY KEY,
  goal_id uuid REFERENCES goals(id),
  student_id uuid REFERENCES profiles(id),
  coach_id uuid REFERENCES profiles(id),
  contract_terms jsonb,
  locked_at timestamptz,
  locked_by uuid,
  cancelled_at timestamptz,
  cancelled_by uuid,
  created_at timestamptz DEFAULT now()
);
```

---

## CRM Information

### Current Implementation

**Status:** ⚠️ **Partially Implemented**

**What Exists:**
- Sales Copilot has CRM data (`sales_leads` table)
- Lead information includes:
  - Email, name
  - Timezone, country
  - Current level, goals
  - Motivation, blockers
  - Budget, decision maker
  - Notes

**What's Missing:**
- Teacher view of CRM data
- Student profile with CRM info
- Integration between sales and teaching

### What Teachers Should See

**Student Profile Should Include:**
- ✅ Email address
- ✅ First name, last name
- ✅ Phone number (if collected)
- ✅ Timezone
- ✅ Country
- ✅ Current French level
- ✅ Goals (from intake/assessment)
- ✅ Motivation
- ✅ Biggest blockers
- ✅ Past methods tried
- ✅ Budget comfort
- ✅ Decision maker status
- ✅ Notes (from sales calls)

**Data Sources:**
- `profiles` table (basic info)
- `sales_leads` table (CRM data)
- `assessment_sessions` table (level, goals)
- `sales_calls` table (notes)

**Code Location (Planned):**
- `src/pages/teacher/StudentProfile.tsx`
- `src/components/teacher/CRMInfoCard.tsx`

---

## Notes System

### Current Implementation

**Status:** ❌ **Not Implemented**

**What Should Happen:**
- Teachers can write notes about students
- Notes stored in database
- Simple text format (no rich text initially)
- Notes visible to teacher only (or shared with other coaches)

**What Needs to Be Built:**
- Notes table in database
- Notes UI component
- Notes editor (simple textarea)
- Notes list/history

### Planned Implementation

**Database Table:**
```sql
CREATE TABLE student_notes (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES profiles(id),
  coach_id uuid REFERENCES profiles(id),
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**UI Component:**
- Textarea for writing notes
- Save button
- Notes list (chronological)
- Edit/delete functionality (optional)

**Code Location (Planned):**
- `src/components/teacher/StudentNotes.tsx`
- `src/pages/teacher/StudentDetailView.tsx`

---

## Current Implementation Status

### ✅ Implemented

- [x] Dashboard can view other user's data (via URL parameter)
- [x] Coach view for phrases (mock, UI-only)
- [x] Sales Copilot (CRM data for sales, not teaching)
- [x] Admin tools (for testing)

### ❌ Not Implemented

- [ ] Teacher dashboard
- [ ] Student list view
- [ ] Teacher permission system
- [ ] Student assignment system
- [ ] Contract management
- [ ] Goal unlock functionality
- [ ] CRM info in teacher view
- [ ] Notes system
- [ ] Teacher-specific RLS policies

---

## Testing Guide

### Test Scenario 1: View Student Dashboard (Admin)

**Steps:**
1. Log in as admin
2. Get student user ID from database
3. Navigate to `/dashboard?memberId=student-id`
4. Verify:
   - Student's data loads
   - All components show student's data
   - No errors

**Expected Result:**
- Can view student dashboard
- Data loads correctly

### Test Scenario 2: Teacher Dashboard (Not Yet Available)

**Steps:**
1. Check if teacher dashboard exists
2. If not, verify it's planned
3. Document what needs to be built

**Expected Result:**
- Feature not available
- Needs implementation

### Test Scenario 3: Coach View for Phrases

**Steps:**
1. Log in as admin
2. Navigate to `/phrases/coach`
3. Verify:
   - Coach view loads
   - Mock member selector works
   - Can view member stats (mock)

**Expected Result:**
- Coach view works (mock data)
- UI functional

### Test Scenario 4: Modify Student Data (Not Yet Available)

**Steps:**
1. Check if modification features exist
2. If not, verify it's planned
3. Document what needs to be built

**Expected Result:**
- Feature not available
- Needs implementation

---

## Key Files Reference

- **Dashboard (with memberId):** `src/pages/DashboardPage.tsx`
- **Dashboard Hook:** `src/features/dashboard/hooks/useDashboardData.ts`
- **Coach Phrases View:** `src/pages/PhrasesCoachPage.tsx`
- **Sales Copilot:** `src/pages/admin/SalesCopilot.tsx`
- **Admin Tools:** `src/components/AdminToolbar.tsx`

---

## Next Steps for Implementation

### High Priority

1. **Teacher Dashboard**
   - Create teacher dashboard page
   - Build student list component
   - Add student search/filter

2. **Student Assignment System**
   - Create `coach_assignments` table
   - Build assignment UI
   - Add RLS policies

3. **Permission System**
   - Add teacher role detection
   - Implement `isCoachForStudent()` helper
   - Add permission checks to all student data access

### Medium Priority

4. **Contract Management**
   - Create `goal_contracts` table
   - Build contract management UI
   - Add unlock/modify/cancel functionality

5. **CRM Integration**
   - Build student profile page
   - Integrate CRM data from sales_leads
   - Show comprehensive student info

6. **Notes System**
   - Create `student_notes` table
   - Build notes UI component
   - Add notes to student detail view

---

**This document should be updated as teacher features are implemented or changed.**

