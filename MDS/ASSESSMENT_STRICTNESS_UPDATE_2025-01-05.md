# Assessment Strictness & UX Improvements - January 5, 2025

## Overview

This document details the changes made to improve the assessment modules' scoring accuracy, prevent exploits with empty/short recordings, and fix UX issues related to tab-switching.

---

## 1. Problem Statement

### Original Issues:
1. **Empty/short recordings getting high scores**: Users could submit empty or very short recordings (< 3 seconds) and receive artificially high scores from the AI.
2. **Tab-switch resets assessment**: When using dev tools to skip to a specific module (e.g., Conversation), switching tabs would reset the user back to the Pronunciation module.
3. **Recording duration too long**: The 120-second max recording was excessive for the conversation prompts.

---

## 2. Solution Summary

### Changes Implemented:

| Component | Change | Old Value | New Value |
|-----------|--------|-----------|-----------|
| **ConversationModule.tsx** | MIN_DURATION_SECONDS | 10 | **3** |
| **ConversationModule.tsx** | MIN_RECOMMENDED_DURATION | 20 | **10** |
| **ConversationModule.tsx** | MAX_DURATION_SECONDS | 120 | **60** |
| **analyze-fluency** | MIN_DURATION_SECONDS | 5 | **3** |
| **analyze-fluency** | MIN_WORD_COUNT | 5 | **3** |
| **analyze-skill** | MIN_WORD_COUNT | 5 | **3** |
| **analyze-skill** | SHORT_RESPONSE_THRESHOLD | 20 | **10** |
| **Assessment.tsx** | Dev phase persistence | Not saved to DB | **Saved to DB** |

---

## 3. Detailed Implementation

### 3.1 Frontend Changes

#### `src/components/assessment/conversation/ConversationModule.tsx`

**Constants updated:**
```typescript
const MAX_DURATION_SECONDS = 60;  // Was 120
const MIN_DURATION_SECONDS = 3;   // Was 10 - Minimum to submit
const MIN_RECOMMENDED_DURATION = 10; // Was 20 - Tip for best scoring
```

**Behavior:**
- Submit button is disabled if recording is < 3 seconds
- User sees red error text if < 3 seconds: "Recording too short"
- User sees amber tip if 3-10 seconds: "For better results, try recording for at least 10 seconds"
- Auto-stops at 60 seconds

---

#### `src/pages/Assessment.tsx`

**Tab-switch reset fix:**

When using dev tools to skip to a specific module via `sessionStorage.setItem("dev_assessment_phase", phase)`, the phase is now **persisted to the database** immediately after the session loads.

```typescript
// If dev override was used, save it to database so tab switches don't reset
if (devPhase) {
  await supabase
    .from("assessment_sessions")
    .update({ current_module: devPhase, current_item_index: 0 } as any)
    .eq("id", sessionData.id);
}
```

**Effect:** Tab switches no longer reset the user's module position.

---

### 3.2 Backend Edge Functions

#### `supabase/functions/analyze-fluency/index.ts`

**Duration check (lines ~207-240):**
```typescript
const MIN_DURATION_SECONDS = 3;  // Was 5
if (recordingDuration && recordingDuration < MIN_DURATION_SECONDS) {
  return {
    totalScore: 0,
    fluencyScore: 0,
    flags: ['too_short'],
    feedback: `Your recording was too short (${recordingDuration.toFixed(1)} seconds). Please speak for at least 5-10 seconds...`
  };
}
```

**Word count check (lines ~283-320):**
```typescript
const MIN_WORD_COUNT = 3;  // Was 5
if (metrics.wordCount < MIN_WORD_COUNT) {
  return {
    totalScore: 0,
    fluencyScore: 0,
    flags: ['insufficient_words'],
    feedback: 'Only X words were detected. Please provide a longer response...'
  };
}
```

---

#### `supabase/functions/analyze-skill/index.ts`

**Word count check (lines ~430-480):**
```typescript
const MIN_WORD_COUNT = 3;  // Was 5
const SHORT_RESPONSE_THRESHOLD = 10;  // Was 20

if (wordCount < MIN_WORD_COUNT) {
  // Returns 0 score with appropriate feedback
  // Updates skill_recordings table with 0 score
}
```

**AI prompts (lines 13-103):**

Enhanced prompts for CONFIDENCE, SYNTAX, and CONVERSATION with explicit scoring bands:

| Score Range | Criteria |
|-------------|----------|
| 0-20 | Empty, incoherent, or < 10 words |
| 20-40 | Many errors, basic structures, < 30 words |
| 40-60 | Some errors, limited variety, 30-60 words |
| 60-80 | Few errors, good variety, 60+ words |
| 80-100 | Near-perfect, complex structures, 80+ words |

---

## 4. Module-Specific Behavior

### Pronunciation Module
- **No duration check** (phrases are short: 2-5 seconds typical)
- Uses Azure Speech API which handles "no speech" detection automatically
- Returns 0% for `InitialSilenceTimeout` or `NoMatch`
- **No changes made**

### Comprehension Module
- **Listening comprehension** (no speaking/recording)
- Users listen to audio and select answers
- **No changes made**

### Confidence Module
- **Self-reflection questionnaire** (no speaking/recording)
- 8 questions about speaking habits
- **No changes made**

### Conversation Module
- **Open-ended speaking** with 60-second max
- Min 3 seconds to submit
- Min 3 words for scoring
- Recommended 10+ seconds for best results
- **All strictness changes apply here**

---

## 5. Deployment

### Edge Functions Deployed:
```bash
npx supabase functions deploy analyze-fluency --no-verify-jwt
npx supabase functions deploy analyze-skill --no-verify-jwt
```

### Build Verification:
```
✓ 3233 modules transformed
✓ built in 9.21s
```

---

## 6. Testing Checklist

- [ ] Record 2 seconds in Conversation → Should show "Recording too short" and block submit
- [ ] Record 3-9 seconds → Should allow submit but show tip for longer recording
- [ ] Record 10+ seconds → Normal flow, no warnings
- [ ] Say only 2 words → Should return 0 score with feedback
- [ ] Say 3+ words → Should get actual AI scoring
- [ ] Use dev tools to skip to Conversation → Switch tabs → Should stay on Conversation
- [ ] Recording should auto-stop at 60 seconds

---

## 7. Related Files

### Modified:
- `src/components/assessment/conversation/ConversationModule.tsx`
- `src/pages/Assessment.tsx`
- `supabase/functions/analyze-fluency/index.ts`
- `supabase/functions/analyze-skill/index.ts`

### Not Modified (already strict):
- `src/components/assessment/pronunciation/PronunciationModule.tsx`
- `supabase/functions/analyze-pronunciation/index.ts`
- `src/components/assessment/comprehension/ComprehensionModule.tsx`
- `src/components/assessment/confidence/ConfidenceModule.tsx`

---

## 8. Rationale

### Why 3 seconds/words instead of 5?
The speaking prompts in `speaking.json` are open-ended questions that users might answer quickly if they speak fast. Examples:
- "Parlez d'un objectif important pour vous cette année."
- "Racontez un moment récent où vous étiez fier/fière de vous."

A fluent speaker could give a valid short response in 3-5 seconds. The threshold of 3 prevents abuse (empty submissions) while allowing natural variation in response length.

### Why 60 seconds max?
60 seconds is sufficient for a thoughtful response to an open-ended question. 120 seconds was excessive and could lead to user fatigue.

### Why persist dev phase to database?
The dev phase override was only stored in sessionStorage, which is cleared/ignored on re-render. By saving to the database, the module position persists across tab switches, page refreshes, and browser restarts.

---

*Document created: January 5, 2025*
*Related to: Opt.txt optimization recommendations*
