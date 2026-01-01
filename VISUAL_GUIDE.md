# Visual Guide: Your New Admin Tools

## Where Everything Is

```
┌──────────────────────────────────────────────────────────────┐
│  🟡 ADMIN TOOLBAR (Top - Yellow Background)                  │
│  ⚡ ADMIN MODE | tom@example.com                             │
│  [Jump to Stage ▼] [Jump to Module ▼] [New Session]         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    YOUR APP CONTENT                          │
│                   (Assessment Modules)                       │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

   🔵 Session Debugger              📊 Live Data Viewer      🐛 Dev Nav
   (Bottom Left)                    (Bottom Right)          (Bottom Right)
   Click to open panel              Auto-refreshing data    Bug icon menu
```

---

## 🟡 Admin Toolbar (Top)

### What It Looks Like:

```
╔════════════════════════════════════════════════════╗
║ ⚡ ADMIN MODE | tom@example.com                    ║
║ [Jump to Stage ▼] [Jump to Module ▼] [New Session]║
╚════════════════════════════════════════════════════╝
```

### Click "Jump to Module" →

```
┌─ Jump to Module ────────┐
│ Assessment Modules      │
├─────────────────────────┤
│ 🗣️ Pronunciation        │
│ 💬 Fluency              │
│ 🧠 Confidence           │
│ 📝 Syntax               │
│ 🎭 Conversation         │
│ 👂 Comprehension        │
└─────────────────────────┘
```

**Click any one → You're there in 5 seconds!**

---

## 📊 Live Data Viewer (Bottom Right)

### What It Shows:

```
┌─ LIVE DATA ───────────────────┐
│ 🟢 Auto | ↻                   │
├───────────────────────────────┤
│ ┌─ Fluency ─────────────────┐ │
│ │ ✅ 85/100 • 120 WPM       │ │
│ │ 📝 Transcript:            │ │
│ │ "Bonjour, je m'appelle..." │ │
│ │ 10:23:45 AM               │ │
│ └───────────────────────────┘ │
│                               │
│ ┌─ Confidence ──────────────┐ │
│ │ ✅ 75/100                 │ │
│ │ 📝 Transcript:            │ │
│ │ "Je pense que..."         │ │
│ │ 10:22:15 AM               │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

**Updates every 3 seconds automatically!**

---

## 🔵 Session Debugger (Bottom Left)

### Click the Database Icon →

```
┌─ Session Debugger ─────────────┐
│ 🗄️ Session Debugger | ↻ ✕    │
├────────────────────────────────┤
│ [Session: abc123...]           │
├────────────────────────────────┤
│ [Fluency] [Skills] [Listening] │
│ [Events] [Session]             │
├────────────────────────────────┤
│ ┌─ Fluency Recording ─────────┐│
│ │ pic-01 | completed | ✅     ││
│ │ WPM: 120 | Words: 45        ││
│ │ Transcript: "Je vois..."    ││
│ │ Attempt #1                  ││
│ └─────────────────────────────┘│
│                                │
│ ┌─ Confidence Recording ──────┐│
│ │ confidence-1 | ✅ scoring   ││
│ │ Score: 85/100               ││
│ │ Transcript: "Je crois..."   ││
│ │ AI Feedback: {...}          ││
│ └─────────────────────────────┘│
└────────────────────────────────┘
```

**See ALL your data in one place!**

---

## 🐛 Dev Nav (Bottom Right)

### Click the Bug Icon →

```
┌─ Menu ──────────────────┐
│ [Show Dimension Sidebar]│
├─────────────────────────┤
│ → Home                  │
│ → Login                 │
│ → Assessment            │
│ → Results               │
├─────────────────────────┤
│ → Assessment Flow ▼     │
│   • Intake Form         │
│   • Consent Form        │
│   • Quiz                │
│   • Assessment          │
└─────────────────────────┘
```

---

## 🎬 Example Workflow

### Testing Pronunciation Module

**Old Way: 15-20 minutes**
```
1. Go to app
2. Sign in
3. Start assessment
4. Fill intake form (gender, age, languages, track, goals)
5. Check 3 consent boxes
6. Answer 15 personality quiz questions
7. Skip mic check
8. FINALLY reach pronunciation
9. Test
10. No easy way to see detailed results
```

**New Way: 5 seconds**
```
1. Go to app (you're already signed in)
2. Click "Jump to Module" in yellow toolbar
3. Click "Pronunciation"
4. BOOM! You're there
5. Test
6. Watch Live Data Viewer for results in real-time
```

### Seeing Processing Data

```
1. Record audio in any module
2. Click Submit
3. Look at Live Data Viewer (bottom right):
   ↓
   [Processing...]
   ↓
   [Transcript appears: "Bonjour, je m'appelle Tom..."]
   ↓
   [Score appears: 85/100]
   ↓
   [Click expand for AI feedback]
```

**You see everything as it happens!**

---

## 🔧 Setup Instructions

### 1. Configure Your Admin Email

**File:** `src/config/admin.ts`

```typescript
export const ADMIN_EMAILS = [
  'tom@example.com',           // ← Replace with YOUR email
  'tomgauthier@gmail.com',     // ← Or add your Gmail
];
```

### 2. Sign In

```
1. Go to http://localhost:8080
2. Sign up or log in with email from step 1
3. Yellow toolbar appears at top!
```

### 3. Start Testing

```
Click "Jump to Module" → Select any module → Test!
```

---

## 🎯 What Each Tool Does

### Admin Toolbar (Always Visible)
**Purpose:** Quick navigation  
**Use:** Skip forms, jump to modules, reset session  
**Location:** Top of screen, yellow bar

### Live Data Viewer (During Modules)
**Purpose:** See processing in real-time  
**Use:** Watch transcripts/scores appear  
**Location:** Bottom right, auto-refreshing

### Session Debugger (Anytime)
**Purpose:** Deep dive into data  
**Use:** See all recordings, all attempts, all scores  
**Location:** Bottom left, blue icon

### Dev Nav (Anytime)
**Purpose:** Page navigation  
**Use:** Jump between pages and phases  
**Location:** Bottom right, bug icon

---

## 💡 Pro Tips

### 1. Keep Live Data Viewer Open

While testing modules, watch the Live Data Viewer to see:
- If transcript is accurate
- What score you got
- Any issues immediately

### 2. Use Session Debugger After Each Module

Check all attempts, verify scoring badges, compare results.

### 3. Jump Between Modules Freely

Test one module, jump to another, compare approaches. No waiting!

### 4. Reset Often

Testing a change? Click "New Session" and try again fresh.

---

## 🎉 You're All Set!

**Just:**
1. Add your email to `src/config/admin.ts`
2. Sign in
3. See the magic happen!

**Enjoy your new superpowers!** ⚡🚀

---

**Questions? Check:**
- `ADMIN_MODE_SETUP.md` - Full setup guide
- `WHATS_NEW_ADMIN_MODE.md` - Feature details
- `ADMIN_QUICKSTART.txt` - Quick reference


