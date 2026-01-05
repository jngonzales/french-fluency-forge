# Student Guide: Authentication and Access Flow

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [How Students Get Access](#how-students-get-access)
3. [Sign Up Process](#sign-up-process)
4. [Sign In / Log In Process](#sign-in--log-in-process)
5. [Log Out Process](#log-out-process)
6. [Payment Integration with Systeme.io](#payment-integration-with-systemeio)
7. [Account Activation Flow](#account-activation-flow)
8. [Current Implementation Status](#current-implementation-status)
9. [Testing Guide](#testing-guide)

---

## Overview

French Fluency Forge uses a **payment-gated authentication system** where students must purchase access through Systeme.io before they can use the platform. The system integrates payment processing with account creation and access management.

### Key Concepts

- **Payment First:** Students purchase through Systeme.io
- **Email-Based Access:** Access is tied to the email used for purchase
- **Magic Link Authentication:** Passwordless sign-in via email links
- **Account Activation:** Students activate their account after purchase

---

## How Students Get Access

### Step 1: Purchase Through Systeme.io

1. Student completes purchase on Systeme.io checkout page
2. Systeme.io sends webhook to our platform
3. Platform creates `app_accounts` record with `access_status = 'active'`
4. Student receives email with activation link (or manual link provided)

### Step 2: Account Activation

1. Student clicks activation link or navigates to `/activate`
2. Enters email address used for purchase
3. System checks `app_accounts` table for active access
4. If active, sends magic link to email
5. Student clicks magic link in email
6. Redirected to dashboard or assessment

### Step 3: First-Time Sign Up (Alternative)

If student hasn't purchased yet:
1. Navigates to `/signup`
2. Creates account with email/password
3. Account created but `access_status = 'inactive'`
4. Must purchase through Systeme.io to activate

---

## Sign Up Process

### Current Implementation

**File:** `src/pages/Signup.tsx`

**Flow:**
1. User navigates to `/signup`
2. Enters:
   - Email address
   - Password (min 8 characters)
   - Confirm password
3. System validates inputs (Zod schema)
4. Calls `supabase.auth.signUp()`
5. Creates account in Supabase Auth
6. Creates `profiles` record (if not exists)
7. Redirects to home page

**Key Features:**
- ✅ Email validation
- ✅ Password strength (min 8 chars)
- ✅ Password confirmation matching
- ✅ Error handling (already registered, etc.)
- ✅ Toast notifications
- ✅ Auto-redirect if already logged in

**Code Location:**
```typescript
// src/pages/Signup.tsx
const handleSubmit = async (e: React.FormEvent) => {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
};
```

**Note:** Sign up does NOT automatically grant access. Student must have active purchase in `app_accounts` table.

---

## Sign In / Log In Process

### Option 1: Magic Link (Passwordless)

**File:** `src/pages/Activate.tsx`

**Flow:**
1. Student navigates to `/activate`
2. Enters email address
3. System checks `app_accounts` for active access
4. If active, sends magic link via `supabase.auth.signInWithOtp()`
5. Student clicks link in email
6. Redirected to dashboard/assessment

**Code:**
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: normalizedEmail,
  options: {
    emailRedirectTo: `${window.location.origin}/assessment`,
  },
});
```

### Option 2: Email/Password Login

**File:** `src/pages/Login.tsx`

**Flow:**
1. Student navigates to `/login`
2. Enters email and password
3. System validates (Zod schema)
4. Calls `supabase.auth.signInWithPassword()`
5. If successful, redirects to dashboard
6. If failed, shows error message

**Key Features:**
- ✅ Email validation
- ✅ Password validation
- ✅ Error handling (invalid credentials)
- ✅ Toast notifications
- ✅ Auto-redirect if already logged in
- ✅ Session persistence

**Code:**
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});
```

---

## Log Out Process

### Current Implementation

**File:** `src/contexts/AuthContext.tsx`

**Method:**
```typescript
const signOut = async () => {
  await supabase.auth.signOut();
};
```

**UI Location:**
- Dashboard header (avatar dropdown)
- Currently shows "Logout" menu item (disabled in v0)

**What Happens:**
1. Clears Supabase session
2. Clears JWT token
3. Redirects to home/login page
4. All protected routes become inaccessible

**Note:** Logout functionality exists but logout button in dashboard is currently disabled. To implement:
- Enable logout button in `DashboardPage.tsx`
- Add `onClick` handler that calls `signOut()` from `AuthContext`

---

## Payment Integration with Systeme.io

### Webhook Handler

**File:** `supabase/functions/systemeio-webhook/index.ts`

**Flow:**
1. Systeme.io sends webhook on purchase event
2. Webhook includes:
   - Customer email
   - Order ID
   - Product/plan ID
   - Purchase amount
3. System verifies webhook signature
4. Creates/updates `app_accounts` record:
   ```sql
   INSERT INTO app_accounts (email, access_status)
   VALUES (customer_email, 'active')
   ON CONFLICT (email) 
   UPDATE SET access_status = 'active'
   ```
5. Creates `purchases` record (if table exists)
6. Updates credit wallet (if applicable)
7. Returns 200 OK

**Key Tables:**
- `app_accounts` - Email-based access control
- `systemeio_webhook_events` - Webhook audit log
- `credit_wallets` - Test credits (if applicable)
- `systemeio_product_map` - Product to access mapping

**Configuration:**
- Webhook secret: `SYSTEMEIO_WEBHOOK_SECRET` (env var)
- Webhook URL: `https://[project-ref].supabase.co/functions/v1/systemeio-webhook`

---

## Account Activation Flow

### Activation Page

**File:** `src/pages/Activate.tsx`

**User Journey:**
1. Student receives link after purchase (or navigates manually)
2. Lands on `/activate` page
3. Enters email address used for purchase
4. System checks `app_accounts` table:
   ```typescript
   const { data: account } = await supabase
     .from("app_accounts")
     .select("id, access_status")
     .eq("email", normalizedEmail)
     .single();
   ```
5. **If active:**
   - Sends magic link to email
   - Shows "Check Your Email" message
   - Student clicks link → redirected to dashboard
6. **If inactive/no account:**
   - Shows paywall message
   - Provides link to Systeme.io checkout
   - Student must purchase first

**Key Features:**
- ✅ Email validation
- ✅ Access status check
- ✅ Magic link generation
- ✅ Paywall for inactive accounts
- ✅ Error handling

---

## Current Implementation Status

### ✅ Implemented

- [x] Sign up page (`/signup`)
- [x] Login page (`/login`)
- [x] Activation page (`/activate`)
- [x] Systeme.io webhook handler
- [x] `app_accounts` table with access control
- [x] Magic link authentication
- [x] Email/password authentication
- [x] Session management (`AuthContext`)
- [x] Protected routes
- [x] Auto-redirect if already logged in

### ❌ Not Implemented / Needs Work

- [ ] Logout button in dashboard (UI exists but disabled)
- [ ] Password reset flow (`/forgot-password`, `/reset-password` pages exist but may need work)
- [ ] Email verification flow (signup sends verification email but flow may be incomplete)
- [ ] Direct link from Systeme.io purchase confirmation to activation page
- [ ] Account linking (if student signs up with different email than purchase)
- [ ] Access expiration handling (if subscriptions expire)
- [ ] Multiple purchase handling (upgrades, renewals)

---

## Testing Guide

### Test Scenario 1: New Student Purchase Flow

**Steps:**
1. Complete purchase on Systeme.io (test mode)
2. Verify webhook received (check `systemeio_webhook_events` table)
3. Verify `app_accounts` record created with `access_status = 'active'`
4. Navigate to `/activate`
5. Enter purchase email
6. Verify magic link sent
7. Click magic link in email (or use test link)
8. Verify redirect to dashboard

**Expected Result:**
- Student can access dashboard
- Student can start assessment
- All features accessible

### Test Scenario 2: Sign Up Without Purchase

**Steps:**
1. Navigate to `/signup`
2. Create account with new email
3. Verify account created in `profiles` table
4. Try to access `/dashboard`
5. Check if access is restricted (may need to implement)

**Expected Result:**
- Account created but access may be limited
- May need to purchase to activate

### Test Scenario 3: Login with Existing Account

**Steps:**
1. Navigate to `/login`
2. Enter email and password
3. Submit form
4. Verify redirect to dashboard
5. Verify session persists on page refresh

**Expected Result:**
- Successful login
- Session maintained
- Can access all features

### Test Scenario 4: Activation with Inactive Account

**Steps:**
1. Navigate to `/activate`
2. Enter email that doesn't have active purchase
3. Verify paywall message shown
4. Verify checkout link provided

**Expected Result:**
- Paywall displayed
- Cannot proceed without purchase

### Test Scenario 5: Mobile Access

**Steps:**
1. Open app on mobile device
2. Test sign up flow
3. Test login flow
4. Test activation flow
5. Verify all forms are usable

**Expected Result:**
- All forms responsive
- Touch targets adequate
- No horizontal scroll

---

## Database Schema Reference

### `app_accounts` Table

```sql
CREATE TABLE app_accounts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  access_status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Access Status Values:**
- `'inactive'` - No access (default)
- `'active'` - Full access granted

### `profiles` Table

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Note:** Created automatically when user signs up via Supabase Auth.

---

## Key Files Reference

- **Sign Up:** `src/pages/Signup.tsx`
- **Login:** `src/pages/Login.tsx`
- **Activation:** `src/pages/Activate.tsx`
- **Auth Context:** `src/contexts/AuthContext.tsx`
- **Webhook Handler:** `supabase/functions/systemeio-webhook/index.ts`
- **Protected Routes:** `src/components/ProtectedRoute.tsx`
- **Database Migration:** `supabase/migrations/20251231104044_*.sql`

---

## Next Steps for Implementation

### High Priority

1. **Enable Logout Button**
   - Uncomment/enable logout in `DashboardPage.tsx`
   - Test logout flow

2. **Password Reset Flow**
   - Verify `/forgot-password` and `/reset-password` pages work
   - Test email delivery

3. **Direct Purchase Link**
   - Add activation link in Systeme.io purchase confirmation email
   - Or redirect to `/activate?email=...` after purchase

### Medium Priority

4. **Access Expiration**
   - Handle subscription expiration
   - Update `access_status` when subscription ends

5. **Account Linking**
   - Allow linking purchase email to different account email
   - Or merge accounts

6. **Multiple Purchases**
   - Handle upgrades/renewals
   - Update access status accordingly

---

**This document should be updated as authentication features are implemented or changed.**

