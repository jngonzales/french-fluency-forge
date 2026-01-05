# Fluency Analyzer & 6 Skills Assessment Documentation

## Overview

This document provides a comprehensive technical description of the Fluency Analyzer system and how all 6 language skills are assessed in the French Fluency Forge application. This documentation is intended for developers who will design QA processes and improvements for the assessment features.

---

## Table of Contents

1. [Fluency Analyzer - Technical Deep Dive](#fluency-analyzer-technical-deep-dive)
2. [The 6 Skills Assessment Modules](#the-6-skills-assessment-modules)
   - [1. Pronunciation](#1-pronunciation)
   - [2. Fluency](#2-fluency)
   - [3. Confidence](#3-confidence)
   - [4. Syntax](#4-syntax)
   - [5. Conversation](#5-conversation)
   - [6. Comprehension](#6-comprehension)
3. [Common Technical Patterns](#common-technical-patterns)
4. [Data Flow & Architecture](#data-flow--architecture)
5. [Scoring Systems](#scoring-systems)
6. [QA Considerations](#qa-considerations)

---

## Fluency Analyzer - Technical Deep Dive

### Purpose

The Fluency Analyzer is a specialized assessment module that evaluates a user's speaking fluency by analyzing speech rate (speed) and pause control. It is distinct from other modules in that it uses **word-level timestamps** from OpenAI Whisper to calculate precise temporal metrics.

### Location

- **Edge Function:** `supabase/functions/analyze-fluency/index.ts`
- **Frontend Hook:** `src/components/assessment/fluency/useFluencyModule.ts`
- **Scoring Logic:** `src/components/assessment/fluency/fluencyScoring.ts`

### Technical Architecture

#### 1. Audio Processing Pipeline

```
User Recording (WebM) 
  → Base64 Encoding (Client)
  → Base64 Chunk Processing (Edge Function)
  → Binary Audio Array
  → OpenAI Whisper API (with word-level timestamps)
  → Word Timestamps + Transcript
  → Metric Calculation
  → Score Calculation
  → Database Storage
```

#### 2. Key Components

**A. Base64 Chunk Processing**
- Processes large base64 strings in 32KB chunks to prevent memory issues
- Converts base64 to binary `Uint8Array` for API consumption
- Handles audio format: `audio/webm` (default)

**B. Whisper API Integration**
- **Model:** `whisper-1`
- **Language:** `fr` (French)
- **Format:** `verbose_json` with `timestamp_granularities[]: word`
- **Output:** Full transcript + word-level timestamps (start/end times in seconds)

**C. Filler Word Detection**
- **French Fillers:** `["euh", "heu", "hum", "hmm", "mh", "bah", "ben", "genre", "euuuh", "heuuu", "euhh", "um", "uh", "hm"]`
- Fillers are **excluded** from word count and WPM calculations**
- Fillers are **tracked** for `fillerRatio` metric (informational only)

### Metrics Calculation

#### Input Data Structure

```typescript
interface WordTimestamp {
  word: string;
  start: number;  // seconds
  end: number;    // seconds
}
```

#### Calculated Metrics

**1. Word Count (`wordCount`)**
- Count of non-filler words only
- Used as the numerator for WPM calculation

**2. Speaking Time (`speakingTime`)**
- Time from first non-filler word start to last non-filler word end
- Measured in seconds (rounded to 2 decimals)
- **Excludes** leading/trailing silence and fillers

**3. Articulation WPM (`articulationWpm`)**
- Formula: `wordCount / (speakingTime / 60)`
- Rounded to nearest integer
- This is the **primary speed metric** (not raw WPM including pauses)

**4. Pause Analysis**
- **Pause Detection:** Gaps > 0.3 seconds between consecutive non-filler words
- **Long Pause Threshold:** 1.2 seconds
- **Long Pause Count:** Number of pauses > 1.2 seconds
- **Max Pause:** Longest single pause duration (seconds)
- **Total Pause Duration:** Sum of all pauses > 0.3s
- **Pause Ratio:** `totalPauseDuration / totalDuration` (0-1 scale)

**5. Filler Ratio (`fillerRatio`)**
- `fillerCount / totalWords`
- Tracked for informational purposes, **not used in scoring**

**6. Pause Array**
- Detailed list of all pauses with:
  - `start`: When pause begins (seconds)
  - `end`: When pause ends (seconds)
  - `duration`: Pause length (seconds, rounded to 2 decimals)

### Scoring Algorithm

The Fluency Analyzer uses a **two-component scoring system**:

#### Component 1: Speed Subscore (0-60 points)

**Formula:** Based on articulation WPM with interpolation between bands

**Speed Bands:**
```
0-45 WPM:    0-10 points
45-65 WPM:   10-25 points
65-85 WPM:   25-40 points
85-110 WPM:  40-55 points
110-140 WPM: 55-60 points
140+ WPM:    60 points (max)
```

**Interpolation:** Within each band, scores are linearly interpolated based on position in the band.

**Example:**
- 50 WPM → Band: 45-65 → Position: (50-45)/(65-45) = 0.25 → Score: 10 + 0.25 × (25-10) = **13.75 points**

#### Component 2: Pause Control Subscore (0-40 points)

**Starting Score:** 40 points

**Penalties:**
1. **Long Pause Penalty:** -5 points per long pause (>1.2s), **capped at -20 points**
   - Example: 3 long pauses = -15 points, 5 long pauses = -20 points (not -25)
2. **Max Pause Penalty:** -10 points if `maxPause > 2.5 seconds`
3. **Pause Ratio Penalty:** -10 points if `pauseRatio > 0.35` (35% of time is silence)

**Final Score:** `Math.max(0, 40 - penalties)` (cannot go below 0)

**Example:**
- 2 long pauses, max pause 3.0s, pause ratio 0.40
- Score: 40 - 10 (long pauses) - 10 (max pause) - 10 (ratio) = **10 points**

#### Total Fluency Score

```
Total Score = Speed Subscore (0-60) + Pause Subscore (0-40)
Final Range: 0-100
```

### Design Philosophy

**Key Principles:**
1. **Speed + Control:** Evaluates both how fast someone speaks AND how well they control pauses
2. **False Starts NOT Penalized:** Repetitions and false starts are not explicitly tracked or penalized
3. **Filler Tolerance:** Fillers are excluded from calculations but don't directly reduce scores
4. **Natural Speech:** Focuses on articulation rate (actual speaking time) rather than raw WPM including all pauses

### Edge Cases & Error Handling

**Empty/No Speech:**
- If `nonFillerWords.length === 0`:
  - All metrics return 0 or default values
  - `pauseRatio = 1` (100% silence)
  - `fillerRatio = 1` (100% fillers)

**Very Short Speech:**
- Minimum speaking time is calculated from first to last word
- If speaking time < 0.1 seconds, WPM may be artificially high (handled by speed band limits)

**API Failures:**
- Whisper API errors return 500 status with error message
- Database recording marked as `status: "error"` with `error_message` field

### Database Schema

**Table:** `fluency_recordings`

**Key Fields:**
- `word_count`: Number of non-filler words
- `wpm`: Articulation WPM (calculated)
- `pause_count`: Long pause count (>1.2s)
- `total_pause_duration`: Sum of pauses (seconds)
- `transcript`: Full transcript from Whisper
- `status`: `"processing" | "completed" | "error"`
- `attempt_number`: Which attempt this is
- `superseded`: Boolean (true if newer attempt exists)
- `used_for_scoring`: Boolean (only latest non-superseded = true)

---

## The 6 Skills Assessment Modules

### 1. Pronunciation

**Module Type:** Pronunciation Assessment  
**Location:** `src/components/assessment/pronunciation/`  
**Edge Function:** `supabase/functions/analyze-pronunciation/index.ts`

#### Task Structure

**A. Reading Aloud (3 items)**
- User reads French sentences displayed on screen
- Targets specific phoneme distinctions:
  - **pos-pronR-1:** `/y/` vs `/u/` distinction
    - Target: "Tu as vu tout le monde hier soir ?"
  - **pos-pronR-2:** Nasal vowels `/ɛ̃/` `/ɑ̃/` `/ɔ̃/`
    - Target: "Ce matin, il y a du vent et un verre de vin blanc"
  - **pos-pronR-3:** `/s/` vs `/z/` distinction
    - Target: "Ils ont choisi seize belles cerises roses"

**B. Listen & Repeat (2 items)**
- User listens to audio and repeats
- **pos-pronE-1:** Position words
  - Target: "Sur la table, sous la chaise, derrière le canapé"
- **pos-pronE-2:** Liaisons
  - Target: "Ils ont un ami, elle est en Italie"

**C. Minimal Pairs Game (6 items)**
- Audio discrimination task
- User hears two words, identifies if same or different
- Not scored (informational only)

#### Scoring System

**API:** Azure Speech Services - Pronunciation Assessment

**Configuration:**
- `gradingSystem: "HundredMark"` (0-100 scale)
- `granularity: "Phoneme"` (phoneme-level analysis)
- `enableMiscue: true` (detects omissions, insertions, mispronunciations)
- `phonemeAlphabet: "IPA"` (International Phonetic Alphabet)

**Score Components:**

1. **Accuracy Score (0-100)**
   - Phoneme-level accuracy
   - Word-level accuracy scores available
   - Measures how correctly sounds are pronounced

2. **Fluency Score (0-100)**
   - Calculated from word timing data
   - Based on pause ratio: `100 - (pauseRatio × 100)`
   - Pauses > 300ms (in 100ns units) are counted
   - Lower pause ratio = higher fluency

3. **Completeness Score (0-100)**
   - `(spokenWords / referenceWords) × 100`
   - Words with `errorType: "Omission"` are excluded

4. **Overall PronScore (0-100)**
   - **Formula:** `60% accuracy + 20% fluency + 20% completeness`
   - **Fallback:** If top-level score is 0, calculated from word-level data

**Word-Level Analysis:**
- Each word gets:
  - `accuracyScore`: 0-100
  - `errorType`: `"None" | "Omission" | "Insertion" | "Mispronunciation"`
- Phoneme-level scores also available

**Feedback:**
- Immediate feedback after each recording
- Word heatmap showing accuracy per word
- Encouraging messages based on score ranges
- Max 2 attempts per item

#### Technical Details

**Audio Format Handling:**
- Supports: WebM, WAV, OGG, MP3, M4A, FLAC
- WAV format preferred for best accuracy
- Content-Type header adjusted based on format

**Error Handling:**
- Fallback calculation if Azure top-level scores missing
- Word-level aggregation when needed
- Detailed logging for debugging

---

### 2. Fluency

**Module Type:** Fluency Assessment  
**Location:** `src/components/assessment/fluency/`  
**Edge Function:** `supabase/functions/analyze-fluency/index.ts`

#### Task Structure

**Picture Description (3 items)**
- User describes pictures in French
- Pictures selected randomly from pool:
  - **fluPic-01:** Messy room scene
  - **fluPic-02:** Kitchen scene
  - **fluPic-03:** Argument scene

**No time limit, no word count requirement**

#### Scoring System

**See [Fluency Analyzer - Technical Deep Dive](#fluency-analyzer-technical-deep-dive) for complete details**

**Summary:**
- **Speed Subscore (0-60):** Based on articulation WPM (110-140 WPM = max)
- **Pause Subscore (0-40):** Penalties for long pauses (>1.2s), very long pauses (>2.5s), high pause ratio (>35%)
- **Total Score (0-100):** Sum of both subscores

**Key Metrics:**
- `articulationWpm`: Words per minute during actual speaking time
- `longPauseCount`: Number of pauses > 1.2 seconds
- `maxPause`: Longest pause duration
- `pauseRatio`: Percentage of time spent in silence

#### Features

- **Module Locking:** Prevents retakes after completion
- **Item-Level Retry:** Can redo individual pictures
- **Full Module Retry:** Can restart entire module (gets new random pictures)
- **Attempt Tracking:** Tracks attempt numbers, marks superseded recordings

---

### 3. Confidence

**Module Type:** Confidence Assessment  
**Location:** `src/components/assessment/confidence/`  
**Edge Function:** `supabase/functions/analyze-skill/index.ts` (moduleType: "confidence")

#### Task Structure

**Phase A: Introduction**
- Explains what confidence means in French communication
- Sets expectations

**Phase B: Questionnaire (8 questions)**
- Self-assessment questions
- Mix of question types:
  - **Slider questions:** 0-10 scale
  - **Likert scale:** 5-point scale (Strongly Disagree to Strongly Agree)
  - **Scenario questions:** Multiple choice scenarios
  - **Tradeoff questions:** Choice between options

**Phase C: Speaking Phase**
- User speaks about their confidence in French
- AI evaluates the spoken response
- Uses same `analyze-skill` edge function as Syntax/Conversation

#### Scoring System

**Combined Score Calculation:**
```
Final Score = (Questionnaire Score × 0.5) + (Speaking Score × 0.5)
```

**Questionnaire Scoring:**
- Each question scored individually (0-10 scale)
- Total raw score: Sum of all 8 questions (max 80)
- **Normalized Score:** `(rawScore / 80) × 100` (0-100 scale)
- **Honesty Flag:** Detects contradictory responses
  - Triggered if Q2 (high "keep going") AND Q4 (low "avoid mistakes" - reverse scored)
  - Used for interpretation, not scoring

**Speaking Assessment (AI-Powered):**

**Scoring Criteria (Total: 100 points):**

1. **Length & Development (0-25 points)**
   - 0 pts: Very short, hesitant (< 50 words)
   - 10 pts: Some development (50-100 words)
   - 20 pts: Fully developed (100-200 words)
   - 25 pts: Very expressive (>200 words with elaboration)

2. **Assertiveness & Ownership (0-25 points)**
   - Looks for confident expressions:
     - "Moi je pense…"
     - "Franchement…"
     - "Je vais te dire…"
     - "Ce que j'adore…"
   - Direct opinions, first-person perspective
   - Speaker leads exchange vs. passive reaction

3. **Emotional Engagement (0-20 points)**
   - 0-5: Neutral, factual, mechanical
   - 10: Some feeling or anecdote
   - 20: Vulnerability, humor, personal stories, expressive tone

4. **Clarity & Control (0-15 points)**
   - Clear progression of ideas
   - Speaker in control, not rambling
   - Smooth communication

5. **Linguistic Confidence Signals (0-15 points)**
   - 3 points each for confident expressions:
     - "Franchement…"
     - "Je vais être honnête…"
     - "Le truc, c'est que…"
     - "Moi, je pense que…"
     - "Ce que j'adore, c'est…"

**Important:** Grammar mistakes, hesitation words ("euh"), and accent are **NOT penalized**.

**AI Model:** GPT-4o-mini with structured function calling

#### Database Schema

**Tables:**
- `confidence_questionnaire_responses`: Questionnaire answers and scores
- `skill_recordings`: Speaking phase recordings (moduleType: "confidence")

---

### 4. Syntax

**Module Type:** Syntax/Grammar Assessment  
**Location:** `src/components/assessment/syntax/`  
**Edge Function:** `supabase/functions/analyze-syntax/index.ts`

#### Task Structure

**5 Micro-Tasks (Elicit Specific Structures):**

1. **S1 - Past Story**
   - Prompt: Describe 3 things you did last weekend
   - **Target:** Passé composé usage

2. **S2 - Plans**
   - Prompt: What are your plans for tonight? (3 actions)
   - **Target:** Futur proche (aller + infinitif)

3. **S3 - Object Pronouns**
   - Rapid-fire questions requiring le/la/les/lui/leur responses
   - **Target:** Object pronoun usage and placement

4. **S4 - Ask Questions**
   - Role-play: Ask 3 questions to a shopkeeper
   - **Target:** Question formation

5. **S5 - Reasons + Comparison**
   - Compare city vs countryside with reasons
   - **Target:** Connectors (parce que), comparatives

**All tasks combined into single transcript for evaluation**

#### Scoring System

**AI-Powered Evaluation (GPT-4o-mini)**

**Subscores (Total: 100 points):**

1. **Passé Composé (0-25 points)**
   - 0: No attempt
   - 10: Attempts but mostly wrong (wrong auxiliary, agreement)
   - 20: Mostly correct (few minor errors acceptable)
   - 25: Consistent and correct with proper auxiliaries and agreements
   - **Primary Source:** S1 task

2. **Futur Proche (0-15 points)**
   - 0: No use
   - 7: 1 correct instance of "aller + infinitif"
   - 12: 2+ correct instances
   - 15: Consistent and natural use
   - **Primary Source:** S2 task

3. **Pronouns - le/la/les/lui/leur (0-25 points)**
   - 0: No object pronouns used
   - 10: Uses pronouns but wrong position/form
   - 20: Mostly correct le/la/les + some lui/leur
   - 25: Consistently correct choice and positioning
   - **Primary Source:** S3 task

4. **Questions (0-15 points)**
   - 0: No questions formed
   - 8: 1-2 clear questions (any method: intonation, est-ce que, inversion)
   - 15: 3+ clear questions with good structure
   - **Primary Source:** S4 task

5. **Connectors & Structure (0-20 points)**
   - Award points for: et, mais, parce que, puis, donc, d'abord, ensuite, enfin
   - 0-5: Single clauses only, no connectors
   - 10-15: Simple chaining with basic connectors (et, mais)
   - 16-20: Structured mini-argument with cause/sequence markers
   - **Primary Source:** S5 task, but can appear anywhere

**Overall Score:** Sum of all subscores (0-100)

**Additional Outputs:**
- **Evidence:** Quotes from transcript supporting each subscore
- **Top 3 Errors:** Error categories with examples and fix hints (in French)
- **Confidence:** AI confidence in evaluation (0-1)

**Important Rules:**
- Dropped "ne" is allowed if "pas/jamais/rien" is used correctly (common in spoken French)
- Focus on PRACTICAL communication - minor errors that don't impede understanding penalized less
- Conservative scoring if ASR (Automatic Speech Recognition) seems uncertain

**AI Model:** GPT-4o-mini with JSON response format

#### Technical Details

**Transcription:**
- Each task can have audio or direct transcript
- Audio transcribed via Whisper API if needed
- All transcripts combined with task labels: `[Task S1]\n...\n[Task S2]\n...`

**Evaluation:**
- Combined transcript sent to LLM with task context
- LLM evaluates all structures together
- Returns structured JSON with subscores and evidence

---

### 5. Conversation

**Module Type:** Conversational Skills Assessment  
**Location:** `src/components/assessment/conversation/`  
**Edge Function:** `supabase/functions/analyze-skill/index.ts` (moduleType: "conversation")

#### Task Structure

**Multi-Turn Conversation with AI Agent**

**Scenarios:**
- Restaurant ordering
- Doctor's appointment
- Social situations
- Work contexts

**Flow:**
1. AI agent starts conversation (text-to-speech)
2. User responds (audio or text input)
3. AI responds based on context
4. Continues for multiple turns
5. Final scoring after conversation ends

**No fixed number of turns - conversation-based**

#### Scoring System

**AI-Powered Evaluation (GPT-4o-mini)**

**Scoring Criteria (Total: 100 points):**

1. **Comprehension Assessment (0-50 points)**
   - How well student understood and responded to prompts
   - **45-50 pts:** Understood correctly, relevant on-topic response
   - **35-44 pts:** Got the gist but slightly off, broadly on-topic
   - **25-34 pts:** Didn't fully understand but used good repair strategies
   - **15-24 pts:** Short unhelpful response like "je ne comprends pas" without elaboration
   - **0-14 pts:** Didn't understand, said nothing, or completely off-topic

2. **Misunderstanding Handling (0-30 points)**
   - **INCREASE score for repair strategies:**
     - "Pardon, vous voulez dire que… ?"
     - "Je crois que j'ai compris la première partie, mais pas la suite."
     - "Je ne suis pas sûr de ce que vous entendez par X… vous pouvez expliquer ?"
     - "Vous pouvez reformuler ça ?"
     - "J'ai compris jusqu'à X, mais après j'ai décroché."
   - **DECREASE score for:**
     - "Hein ?"
     - "Je sais pas."
     - No response after complex question
     - Answering completely off-topic
     - Ignoring confusion and changing subject

3. **Conversational Flow (0-20 points)**
   - Natural turn-taking signals
   - Appropriate length of response
   - Engagement with topic
   - Use of discourse markers (bon, alors, enfin, bref, etc.)

**AI Model:** GPT-4o-mini with structured function calling

**Input:** Full conversation transcript with turn markers

---

### 6. Comprehension

**Module Type:** Listening Comprehension Assessment  
**Location:** `src/components/assessment/comprehension/`  
**Edge Function:** `supabase/functions/analyze-comprehension/index.ts`

#### Task Structure

**Listen to French Audio Passages and Answer Questions**

**Item Types:**
- Short dialogues
- Announcements
- Narratives
- Instructions

**Phases per Item:**
1. **Listen:** Play audio passage (user-controlled playback)
2. **Answer:** User answers questions about content (audio or text)
3. **Score:** AI evaluates understanding

#### Scoring System

**AI-Powered Evaluation (GPT-4o-mini)**

**Input Data:**
- **Context:** What the audio is about
- **Audio Script:** Ground truth transcript of audio
- **Key Facts:** Array of facts that should be understood
- **Acceptable Intents:** Array of acceptable response types

**Evaluation Output:**

1. **Score (0-100)**
   - Overall comprehension score
   - Based on fact understanding and intent matching

2. **Understood Facts**
   - Array of `{ fact: string, ok: boolean, evidence: string }`
   - For each key fact, whether it was understood and evidence from response

3. **Intent Match**
   - `{ ok: boolean, type: "answer" | "question" | "other" }`
   - Whether response type matches expected intent

4. **Feedback (French)**
   - 1-2 supportive sentences in French
   - Provided to user

5. **Confidence (0-1)**
   - AI confidence in evaluation

**Important:** Does NOT judge pronunciation or grammar - only comprehension.

**AI Model:** GPT-4o-mini with structured function calling

---

## Common Technical Patterns

### Audio Processing

**All modules follow similar patterns:**

1. **Client-Side Recording:**
   - Uses browser `MediaRecorder` API
   - Format: WebM (default), can vary by browser
   - Converted to base64 for transmission

2. **Edge Function Processing:**
   - Base64 → Binary conversion
   - Sent to external API (Whisper, Azure Speech)
   - Results stored in database

3. **Transcription:**
   - Most modules use OpenAI Whisper API
   - Model: `whisper-1`
   - Language: `fr` (French)
   - Format: JSON or verbose JSON

### Database Patterns

**Common Tables:**

1. **`skill_recordings`** (Confidence, Syntax, Conversation)
   - `module_type`: "confidence" | "syntax" | "conversation"
   - `transcript`: Full transcript
   - `word_count`: Number of words
   - `ai_score`: 0-100 score
   - `ai_feedback`: Text feedback
   - `ai_breakdown`: JSON with detailed breakdown
   - `status`: "processing" | "completed" | "error"
   - `attempt_number`: Which attempt
   - `superseded`: Boolean
   - `used_for_scoring`: Boolean

2. **`fluency_recordings`** (Fluency-specific)
   - Similar structure but with fluency-specific metrics
   - `wpm`: Articulation WPM
   - `pause_count`: Long pause count
   - `total_pause_duration`: Sum of pauses

3. **`pronunciation_recordings`** (Pronunciation-specific)
   - `pron_score`: Overall score
   - `accuracy_score`, `fluency_score`, `completeness_score`
   - `words`: JSON array with word-level scores
   - `phonemes`: JSON array with phoneme-level scores

4. **`comprehension_recordings`** (Comprehension-specific)
   - `understood_facts`: JSON array
   - `intent_match`: JSON object
   - `ai_feedback_fr`: Feedback in French
   - `ai_confidence`: Confidence score

### Attempt Management

**Pattern:**
1. New recording created with `attempt_number`
2. Previous attempts marked as `superseded: true`, `used_for_scoring: false`
3. Only latest non-superseded recording has `used_for_scoring: true`
4. Final scores calculated from `used_for_scoring: true` recordings only

### Error Handling

**Common Patterns:**
1. **API Failures:**
   - Recording marked as `status: "error"`
   - `error_message` field populated
   - User sees error message in UI

2. **Timeout Handling:**
   - Edge functions have timeout limits
   - Long audio may fail - should warn users

3. **Network Issues:**
   - Retry logic in frontend
   - Graceful degradation

---

## Data Flow & Architecture

### High-Level Flow

```
User Interface (React)
  ↓
Recording Component (MediaRecorder)
  ↓
Base64 Encoding
  ↓
Edge Function (Supabase Functions)
  ↓
External API (Whisper/Azure/OpenAI)
  ↓
Analysis & Scoring
  ↓
Database (Supabase PostgreSQL)
  ↓
Results Display
```

### Edge Function Architecture

**Location:** `supabase/functions/`

**Functions:**
1. **`analyze-fluency`**: Fluency-specific analysis
2. **`analyze-pronunciation`**: Azure Speech integration
3. **`analyze-skill`**: Multi-purpose (Confidence, Syntax, Conversation)
4. **`analyze-syntax`**: Syntax-specific (handles multiple tasks)
5. **`analyze-comprehension`**: Comprehension-specific

**Common Patterns:**
- CORS headers for browser requests
- Environment variables for API keys
- Error handling with proper HTTP status codes
- Database updates with status tracking

### Frontend Architecture

**Component Structure:**
- Each module has its own directory: `src/components/assessment/{module}/`
- Shared components: `src/components/assessment/shared/`
- Custom hooks for module logic
- Recording cards for UI consistency

**State Management:**
- React hooks (`useState`, `useCallback`, `useEffect`)
- Supabase client for database operations
- Context API for authentication

---

## Scoring Systems

### Score Normalization

**All scores normalized to 0-100 scale for display**

**Final Results Calculation:**
- **Pronunciation:** Azure `pronScore` (already 0-100)
- **Fluency:** Speed (0-60) + Pause (0-40) = 0-100
- **Confidence:** (Questionnaire × 0.5) + (Speaking × 0.5) = 0-100
- **Syntax:** Sum of subscores = 0-100
- **Conversation:** AI score = 0-100
- **Comprehension:** AI score = 0-100

**Overall Score:**
- Average of all 6 dimension scores
- Only includes completed modules

### Score Storage

**Database:**
- Scores stored in module-specific tables
- `ai_score` field (0-100) for AI-evaluated modules
- `pron_score` for pronunciation
- Breakdowns stored in JSON fields (`ai_breakdown`, etc.)

**Results Page:**
- Fetches all scores
- Calculates averages
- Displays in radar chart and score cards

---

## QA Considerations

### Testing Scenarios

**1. Fluency Analyzer:**
- ✅ Test with various WPM rates (slow, medium, fast)
- ✅ Test with many pauses vs. few pauses
- ✅ Test with fillers (should not affect score)
- ✅ Test with very short recordings
- ✅ Test with empty/silent recordings
- ✅ Test with background noise
- ✅ Verify filler detection works correctly
- ✅ Verify pause detection thresholds (0.3s, 1.2s, 2.5s)
- ✅ Test edge cases: single word, very long pause, no pauses

**2. Pronunciation:**
- ✅ Test with correct pronunciation (should score high)
- ✅ Test with incorrect sounds (should score lower)
- ✅ Test with missing words (completeness score)
- ✅ Test with different audio formats
- ✅ Verify word-level scores are accurate
- ✅ Test fallback calculation when top-level scores missing

**3. Confidence:**
- ✅ Test questionnaire scoring (all question types)
- ✅ Test honesty flag detection
- ✅ Test speaking assessment with various response lengths
- ✅ Test with confident vs. hesitant language
- ✅ Verify grammar mistakes don't affect score
- ✅ Test combined score calculation (50/50 split)

**4. Syntax:**
- ✅ Test each structure separately (passé composé, futur proche, etc.)
- ✅ Test with correct vs. incorrect grammar
- ✅ Test with dropped "ne" (should be allowed)
- ✅ Verify evidence quotes are accurate
- ✅ Test with very short responses
- ✅ Test with multiple tasks combined

**5. Conversation:**
- ✅ Test comprehension scoring (understood vs. misunderstood)
- ✅ Test repair strategy detection
- ✅ Test conversational flow scoring
- ✅ Test with off-topic responses
- ✅ Test with multiple conversation turns

**6. Comprehension:**
- ✅ Test fact extraction accuracy
- ✅ Test intent matching
- ✅ Test with correct vs. incorrect answers
- ✅ Test with partial understanding
- ✅ Verify feedback is in French

### Common Issues to Watch For

**1. API Rate Limits:**
- Whisper API has rate limits
- Azure Speech has quotas
- OpenAI API has rate limits
- Need proper error handling and user messaging

**2. Audio Quality:**
- Poor microphone quality affects all modules
- Background noise affects transcription
- Browser compatibility (MediaRecorder support)

**3. Transcription Accuracy:**
- Whisper may mis-transcribe (affects all AI evaluations)
- Accent affects transcription
- Fast speech affects transcription
- Need confidence scores where available

**4. Scoring Consistency:**
- AI models may have variability
- Temperature settings affect consistency
- Need to verify scoring is fair and consistent

**5. Edge Cases:**
- Very short recordings
- Very long recordings
- Silent recordings
- Non-French speech
- Multiple languages mixed

**6. Performance:**
- Large audio files take time to process
- Multiple API calls add latency
- Database queries should be optimized
- UI should show loading states

### Validation Checks

**Before Production:**
- ✅ All edge functions have proper error handling
- ✅ All scores are within 0-100 range
- ✅ Database constraints prevent invalid data
- ✅ User-facing error messages are clear
- ✅ Loading states prevent double-submission
- ✅ Attempt tracking works correctly
- ✅ Superseded recordings don't affect scores

**Monitoring:**
- Track API success/failure rates
- Monitor processing times
- Track score distributions
- Monitor error rates by module
- User feedback on score accuracy

---

## Conclusion

This documentation provides a comprehensive overview of the Fluency Analyzer and all 6 skills assessment modules. Each module has its own scoring algorithm, technical implementation, and QA considerations. The system is designed to provide accurate, fair, and consistent assessments of French language proficiency across multiple dimensions.

For developers working on QA and improvements, focus on:
1. **Accuracy:** Verify scores match expected outcomes
2. **Consistency:** Ensure similar inputs produce similar scores
3. **Edge Cases:** Handle unusual inputs gracefully
4. **Performance:** Optimize processing times
5. **User Experience:** Provide clear feedback and error messages

---

**Last Updated:** 2025-01-02  
**Version:** 1.0  
**Author:** French Fluency Forge Development Team

