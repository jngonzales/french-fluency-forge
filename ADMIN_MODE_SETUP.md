# Admin Mode Setup Guide

## Overview

Admin Mode gives you powerful developer tools that work **even in production** for testing and debugging:

- **🎯 Jump Navigation** - Skip directly to any module or stage
- **📊 Live Data Viewer** - See transcriptions and scores in real-time
- **🗄️ Session Debugger** - View all recordings and session state
- **⚡ Quick Actions** - Reset sessions, skip forms, navigate freely

---

## 🔧 Setup (2 minutes)

### Step 1: Add Your Email

Edit `src/config/admin.ts` and add your email:

```typescript
export const ADMIN_EMAILS = [
  'YOUR_EMAIL_HERE@example.com', // ← Add your email
  // Add more admin emails as needed
];
```

### Step 2: Sign Up / Log In

1. Go to your app
2. Create an account with the email you added
3. Admin tools will automatically appear

---

## 🎨 What You'll See

### 1. Admin Toolbar (Top)

Yellow bar at the top with quick actions:

- **Jump to Stage** - Go directly to intake, consent, quiz, etc.
- **Jump to Module** - Skip to pronunciation, fluency, etc.
- **New Session** - Reset and start fresh
- **Current Location** - Shows your current route

### 2. Live Data Viewer (Bottom Right)

Floating panel showing:
- Most recent recordings
- **Transcripts** as they're processed
- **Scores** (WPM, AI scores, etc.)
- Auto-refreshes every 3 seconds

### 3. Session Debugger (Bottom Left)

Blue floating button that opens panel with:
- All sessions
- All recordings (fluency, skills, comprehension)
- Event log
- Full session data

### 4. Dev Nav (Bottom Right)

Bug icon button for:
- Page navigation
- Assessment phase jumping
- Dimension sidebar with subtests

---

## 🚀 How to Use

### Quick Navigation

**Instead of completing forms every time:**

1. Click **"Jump to Module"** in admin toolbar
2. Select the module you want to test (e.g., "Pronunciation")
3. You're there instantly! 

**No more filling out intake → consent → quiz → mic check every time!**

### Live Data Monitoring

While testing a module:

1. Complete a recording
2. Watch the **Live Data Viewer** (bottom right)
3. See transcript appear
4. See score calculated
5. See AI feedback (expand for details)

**You can see what's happening in real-time!**

### Session Debugging

To see all your session data:

1. Click **Database** icon (bottom left)
2. Select session from dropdown
3. View tabs:
   - **Fluency** - All fluency recordings with WPM
   - **Skills** - Confidence, Syntax, Conversation with scores
   - **Listening** - Comprehension recordings
   - **Events** - Activity log
   - **Session** - Full session metadata

### Skip Forms

The existing skip buttons still work, but now you can:
- Jump directly to any module from anywhere
- No need to click through forms
- Reset and start fresh anytime

---

## 💡 Pro Tips

### Testing a Specific Module

```
1. Click "Jump to Module" → "Pronunciation"
2. Complete your test
3. Click "Jump to Module" → "Fluency"  
4. Test fluency
5. Repeat for any module
```

**No waiting! No forms!**

### Seeing Scores Immediately

The Live Data Viewer shows scores **as soon as they're calculated**.

Watch for:
- **Green score badges** - AI score out of 100
- **WPM numbers** - For fluency
- **Transcripts** - What the AI understood
- **Feedback** - Click to expand AI feedback

### Comparing Attempts

1. Open Session Debugger
2. See all attempts for each item
3. Green "scoring" badge shows which is counted
4. Compare transcripts and scores

### Resetting for Fresh Test

Click **"New Session"** in admin toolbar:
- Creates fresh session instantly
- Jump to any stage
- No cleanup needed

---

## ⚙️ Configuration

### Admin Emails

**File:** `src/config/admin.ts`

```typescript
export const ADMIN_EMAILS = [
  'your-email@example.com',
  'colleague@example.com',
  // Add as many as needed
];
```

### Environment Detection

Admin mode activates when **EITHER**:
- Running in dev mode (`npm run dev`)
- Logged in with email in `ADMIN_EMAILS`

This means:
- ✅ Admin tools in development for everyone
- ✅ Admin tools in production for specific users only
- ✅ Regular users never see admin tools

---

## 🎯 Use Cases

### 1. Testing Audio Recording

```
1. Jump to Pronunciation
2. Record audio
3. Watch Live Data Viewer for transcript
4. See score immediately
5. Check Session Debugger for full details
```

### 2. Testing Conversation AI

```
1. Jump to Conversation module
2. Have conversation with AI
3. Watch Live Data for each turn
4. See scores per response
5. Review full conversation in Session Debugger
```

### 3. Checking Score Calculations

```
1. Complete multiple recordings
2. Open Session Debugger → Fluency tab
3. See all WPM scores
4. Verify which are counted (green badge)
5. Calculate expected average
6. Go to Results page to verify
```

### 4. Rapid Iteration

```
1. Jump to module you're working on
2. Test feature
3. See results immediately
4. Reset session
5. Try again with changes
```

**No more 20-minute assessment just to test one module!**

---

## 🐛 Troubleshooting

### Admin Tools Not Showing

1. **Check your email** - Must match exactly (case-insensitive)
2. **Check config** - Look at `src/config/admin.ts`
3. **Reload page** - Admin check happens on login
4. **Check console** - Look for errors

### Live Data Not Updating

1. **Check auto-refresh** - Toggle 🟢 Auto / ⚪ Manual
2. **Click refresh** - Manual refresh button
3. **Check session ID** - Must match current session

### Jump Navigation Not Working

1. **Must be logged in** - Sign in first
2. **Check toast messages** - Shows success/error
3. **Reload after jump** - Page reloads automatically

---

## 🎉 Summary

Admin Mode transforms your testing workflow:

**Before:**
- ❌ Fill intake form
- ❌ Accept consent
- ❌ Complete 15-question quiz
- ❌ Skip mic check
- ❌ Finally reach module
- ❌ Can't see scores easily
- ❌ Hard to debug issues

**After:**
- ✅ Click "Jump to Module"
- ✅ Select module
- ✅ You're there instantly
- ✅ See live transcripts
- ✅ See scores immediately
- ✅ Full session data visible
- ✅ Easy debugging

**Time saved:** ~15-20 minutes per test iteration!

---

## 🔐 Security

Admin mode is **safe** because:
- Only specific emails get access
- Check happens on login
- No security bypass
- Just UI convenience tools
- All data still validated server-side

Regular users **never see** admin tools.

---

**Ready to test?**

1. Add your email to `src/config/admin.ts`
2. Sign in
3. See the yellow admin toolbar at top
4. Click "Jump to Module" and start testing!

🎉 **Happy testing!**

