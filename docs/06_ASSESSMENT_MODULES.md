# Assessment Modules

## Overview

The assessment consists of 6 dimensions, each testing different aspects of French language proficiency.

## Module Flow

```
User Journey:
Intake → Consent → Personality Quiz → Mic Check → Assessment Modules → Processing → Results
```

## 1. Pronunciation Module

**Location:** `src/components/assessment/pronunciation/`

### Sections

#### A) Reading Aloud (3 items)
- **pos-pronR-1:** /y/ vs /u/ distinction
  - Target: "Tu as vu tout le monde hier soir ?"
  - Expected: 75-100 score
  
- **pos-pronR-2:** Nasal vowels /ɛ̃/ /ɑ̃/ /ɔ̃/
  - Target: "Ce matin, il y a du vent et un verre de vin blanc"
  - Expected: 75-100 score
  
- **pos-pronR-3:** /s/ vs /z/ distinction
  - Target: "Ils ont choisi seize belles cerises roses"
  - Expected: 75-100 score

#### B) Listen & Repeat (2 items)
- **pos-pronE-1:** Position words
  - Target: "Sur la table, sous la chaise, derrière le canapé"
  - Expected: 75-100 score
  
- **pos-pronE-2:** Liaisons
  - Target: "Ils ont un ami, elle est en Italie"
  - Expected: 75-100 score

#### C) Minimal Pairs Game (6 items)
- Audio discrimination between similar sounds
- User hears two words, must identify if same or different

### Scoring

**Azure Speech API Integration:**
- Word-level accuracy scores
- Fallback calculation if top-level score missing
- Formula: `60% accuracy + 20% fluency + 20% completeness`

**Feedback:**
- Immediate feedback after each recording
- Word heatmap showing accuracy per word
- Encouraging messages based on score ranges
- Max 2 attempts per item

**Files:**
- `PronunciationModule.tsx` - Main component
- `pronunciationItems.ts` - Item definitions

---

## 2. Fluency Module

**Location:** `src/components/assessment/fluency/`

### Task

Picture description - user describes 3 pictures in French.

### Pictures
1. **fluPic-01:** Messy room
2. **fluPic-02:** Kitchen scene
3. **fluPic-03:** Argument scene

### Scoring

**WPM (Words Per Minute):**
- Calculated from transcript length and duration
- Converted to 0-100 scale (120 WPM = 100)

**Features:**
- Module locking (prevents retakes)
- Item-level retry
- Full module retry option
- Attempt counter
- Progress tracking

**Files:**
- `FluencyModule.tsx` - Main component
- `FluencyRecordingCard.tsx` - Recording UI
- `FluencyRedoDialog.tsx` - Retry confirmation
- `fluencyPictureCards.ts` - Picture definitions

---

## 3. Confidence Module

**Location:** `src/components/assessment/confidence/`

### Phases

#### A) Introduction
- Explains the confidence assessment

#### B) Questionnaire (8 questions)
- Self-assessment questions
- Likert scale responses
- Honesty flag detection

#### C) Speaking Phase
- User speaks about their confidence
- AI scoring

### Scoring

**Combined Score:**
- 50% from questionnaire
- 50% from speaking assessment
- Honesty flag affects interpretation

**Files:**
- `ConfidenceModule.tsx` - Main component
- `ConfidenceQuestionnaire.tsx` - Questionnaire UI
- `confidenceQuestions.ts` - Question definitions

---

## 4. Syntax Module

**Location:** `src/components/assessment/syntax/`

### Task

Grammar-focused prompts testing:
- Verb conjugation
- Sentence structure
- Agreement rules
- Tense usage

### Scoring

**AI Analysis (OpenAI GPT-4):**
- Grammatical accuracy
- Appropriate tense usage
- Sentence complexity
- Error identification

**Files:**
- `SyntaxModule.tsx` - Main component
- `syntaxItems.ts` - Prompt definitions
- `syntaxEvaluatorPrompt.ts` - AI prompt

---

## 5. Conversation Module

**Location:** `src/components/assessment/conversation/`

### Task

Multi-turn conversation with AI agent.

### Scenarios
- Restaurant ordering
- Doctor's appointment
- Social situations
- Work contexts

### Flow
1. AI agent starts conversation
2. User responds (audio or text)
3. AI responds based on context
4. Continues for multiple turns
5. Final scoring

### Scoring

**AI Analysis:**
- Appropriateness of responses
- Vocabulary usage
- Turn-taking
- Goal completion
- Natural flow

**Files:**
- `ConversationModule.tsx` - Main component
- `conversationScenarios.ts` - Scenario definitions

---

## 6. Comprehension Module

**Location:** `src/components/assessment/comprehension/`

### Task

Listen to French audio passages and answer questions.

### Item Types
- Short dialogues
- Announcements
- Narratives
- Instructions

### Phases per Item
1. **Listen:** Play audio passage
2. **Answer:** User answers questions about content
3. **Score:** AI evaluates understanding

### Scoring

**AI Analysis:**
- Intent matching
- Fact extraction
- Comprehension accuracy
- Confidence score

**Files:**
- `ComprehensionModule.tsx` - Main component
- `comprehensionItems.ts` - Item definitions

---

## Shared Components

**Location:** `src/components/assessment/shared/`

### useSkillModule Hook

Shared logic for skill-based modules:
- Audio recording
- Transcription
- Score processing
- Attempt tracking
- Superseded recording management

### SkillRecordingCard

Reusable recording UI:
- Record button
- Timer display
- Playback controls
- Submit button
- Loading states

**Files:**
- `useSkillModule.ts`
- `SkillRecordingCard.tsx`
- `types.ts`

---

## Processing & Results

### Processing View

**Location:** `src/components/assessment/ProcessingView.tsx`

- Shows progress animation
- Calculates final scores
- Updates session status
- Redirects to results

### Results Page

**Location:** `src/pages/Results.tsx`

**Features:**
- Radar chart (6 dimensions)
- Score breakdown cards
- Skill descriptions
- Archetype display
- Raw metrics sidebar
- Export/share buttons (UI only)
- What's Next section

**Score Calculations:**
- Pronunciation: Azure score → 0-100
- Fluency: WPM → 0-100 scale
- Confidence: 50% questionnaire + 50% speaking
- Syntax: AI score 0-100
- Conversation: AI score 0-100
- Comprehension: AI score 0-100
- Overall: Average of all dimensions

---

## Recording Flow

### Standard Flow
1. User clicks "Record"
2. Browser requests microphone permission
3. MediaRecorder starts
4. User speaks
5. User clicks "Stop"
6. Audio blob created
7. Blob converted to base64
8. Sent to Edge Function
9. Edge Function processes (Whisper + AI/Azure)
10. Results saved to database
11. UI updates with scores

### Error Handling
- Permission denied
- Browser doesn't support MediaRecorder
- Network failures
- Processing timeouts
- Invalid audio format

---

## Module Locking

Some modules support locking to prevent retakes:
- Fluency: Locked after completion
- Confidence: Locked after completion
- Syntax: Locked after completion
- Conversation: Locked after completion
- Comprehension: Locked after completion

Pronunciation: No locking (can retry with 2-attempt limit per item)

**Database Fields:**
- `fluency_locked`, `fluency_locked_at`
- `confidence_locked`, `confidence_locked_at`
- etc.

---

## Attempt Tracking

**Fields:**
- `attempt_number` - Which attempt this is
- `superseded` - If a newer attempt exists
- `used_for_scoring` - If this attempt counts toward final score

**Logic:**
- Only latest non-superseded attempt used for scoring
- Previous attempts marked as `superseded: true`
- Attempt counter increments per item

