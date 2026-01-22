# Confidence Phone Call Module - Implementation Summary

## Overview

The confidence module has been transformed from a simple questionnaire + 2 prompts into a **phone-call simulation** with multi-turn conversation, timing instrumentation, and deterministic D1-D5 scoring based on the specification document `09_Confidence_Module_Speaking_Exam_Spec.md`.

## What Was Implemented

### ✅ Phase 1: Scoring Engine Foundation

#### 1. Signal Dictionaries (`src/lib/confidence/signalDictionaries.ts`)
- **Low-confidence markers**: désolé, je ne sais pas, je crois, etc.
- **Ownership markers**: je veux, j'ai besoin de, je préfère, etc.
- **Engagement markers**: je suis frustré, je comprends, merci, etc.
- **Structure markers**: d'abord, ensuite, donc, en résumé, etc.
- **Repair markers**: je reformule, je veux dire, en fait, etc.
- Pattern matching with evidence snippet extraction (10-20 words)

#### 2. Audio Metrics Calculator (`src/lib/confidence/audioMetrics.ts`)
- Simulated VAD using Whisper word-level timestamps
- Calculates per-turn metrics:
  - `start_latency_ms`: Time from prompt end to first speech
  - `speech_ratio`: Proportion of speech vs. silence
  - `longest_silence_ms`: Longest silent pause
  - `silence_count`: Number of silences ≥ 600ms
- Tier normalization for latency and silence thresholds

#### 3. Metrics Aggregator (`src/lib/confidence/metricsAggregator.ts`)
- Aggregates metrics across multiple turns
- Calculates median start latency (for D1 scoring)
- Calculates average speech ratio (for D2 scoring)
- D1-D5 scoring functions:
  - **D1**: Response Initiation (0-5) based on median latency
  - **D2**: Silence Management (0-5) based on speech ratio + longest silence
- Combined speaking confidence score (0-100) with weighted dimensions

#### 4. Micro-Drills Generator (`src/lib/confidence/microDrills.ts`)
- Behavioral exercises (20-40 seconds each)
- Drill types:
  - **D1**: Instant opener (reduce latency)
  - **D2**: Keep going drill (maintain momentum)
  - **D3**: One clear request (ownership)
  - **D3 alt**: Boundary script (setting limits)
  - **D4**: Emotion + impact (presence)
  - **D5**: Structure close (control)
- Automatic strength and focus area generation based on scores

#### 5. Scoring Edge Function (`supabase/functions/analyze-confidence-speaking/index.ts`)
- Processes turn-by-turn data
- Calculates D1-D5 scores using deterministic rules
- Detects confidence signals with evidence
- Returns JSON matching spec schema
- Version tracking for reproducibility

### ✅ Phase 2: Scenario System

#### 1. Type Definitions (`src/components/assessment/confidence/types.ts`)
- `ConfidenceScenario`: Scenario structure with turns and objectives
- `ScenarioTurn`: Individual turn with bot script, duration, objective
- `TurnRecording`: Recording data with timestamps
- `ConfidenceSpeakingResult`: Complete result with D1-D5 scores

#### 2. Scenario Definitions (`src/components/assessment/confidence/scenarios.json`)
Three initial scenarios created:
- **Tier 1 - Customer Support**: Wrong item received (4 turns, cooperative)
- **Tier 2 - Work Boundary**: Last-minute weekend request (5 turns, mild pushback)
- **Tier 3 - Hotel Issue**: Room problem with constraints (6 turns, strong pushback)

#### 3. Scenario Selector (`src/components/assessment/confidence/scenarioSelector.ts`)
- Selects scenario based on user history or questionnaire score
- Tier selection logic:
  - Score < 50 → Tier 1
  - Score 50-75 → Tier 2
  - Score > 75 → Tier 3
- Random selection within tier

### ✅ Phase 3: Phone Call UI Components

#### 1. Phone Call Module (`src/components/assessment/confidence/PhoneCallModule.tsx`)
Main orchestrator managing:
- Scenario loading and initialization
- Turn progression (bot speaks → user responds → analyze → next turn)
- TTS audio playback via `useBotVoice` hook
- Recording with timing capture (prompt_end, recording_start, recording_end)
- Whisper transcription with word timestamps
- Database storage of turns
- Final analysis via edge function
- Dev mode support (text input, skip audio)

#### 2. Phone Call Screen (`src/components/assessment/confidence/PhoneCallScreen.tsx`)
Visual interface showing:
- Call status (bot speaking, waiting for user, recording, processing)
- Turn counter (Turn X of Y)
- Bot speech display with script
- Recording interface with timer
- Turn objectives as hints
- Phase-specific UI states

#### 3. Turn Recording (`src/components/assessment/confidence/TurnRecording.tsx`)
Recording component with:
- Audio recording via `useAudioRecorder` hook
- Visual timer with progress bar
- Auto-stop at max duration
- Countdown warnings (10s remaining)
- Dev mode text input alternative
- Error handling

#### 4. Bot Voice Hook (`src/components/assessment/confidence/useBotVoice.ts`)
TTS management:
- Pre-generates audio for all turns on load
- Uses `french-tts` edge function (ElevenLabs)
- Sequential turn playback
- Event tracking (audio start/end) for timing
- Memory cleanup (revoke object URLs)
- Error handling with fallback

### ✅ Phase 4: Results Display

#### Results Component (`src/components/assessment/confidence/ConfidenceSpeakingResults.tsx`)
Comprehensive results display:
- Overall speaking confidence score (0-100) with visual gauge
- D1-D5 dimension scores with progress bars
- Timing aggregates (median latency, speech ratio, longest silence)
- Strengths (2-3 items with descriptions)
- Focus areas (1-2 items with recommendations)
- Micro-drills (1-3 exercises with instructions and examples)
- Optional signal evidence (debug mode)

### ✅ Phase 5: Database Schema

#### Migration (`supabase/migrations/20260105120000_confidence_phone_calls.sql`)
Three new tables:

1. **confidence_phone_calls**
   - Call metadata (session_id, user_id, scenario_id, tier)
   - Completion timestamp

2. **confidence_phone_turns**
   - Per-turn recordings
   - Timing data (prompt_end, recording_start, recording_end, speech_start, speech_end)
   - Transcript and word timestamps (JSONB)
   - Turn metrics (JSONB)

3. **confidence_speaking_analysis**
   - D1-D5 scores (0-5 each)
   - Overall speaking confidence score (0-100)
   - Timing aggregates (JSONB)
   - Detected signals with evidence (JSONB)
   - Strengths, focus areas, micro-drills (JSONB)
   - Version tracking

All tables have RLS policies (users can only access their own data).

### ✅ Phase 6: Integration

#### Updated ConfidenceModule (`src/components/assessment/confidence/ConfidenceModule.tsx`)
New flow with 5 phases:
1. **Intro**: Explains 2-part assessment
2. **Questionnaire**: 8 self-reflection questions (50% of score)
3. **Phone Intro**: Shows scenario context and objectives
4. **Phone Call**: Live call simulation with bot and user turns
5. **Results**: Combined score + D1-D5 breakdown + drills

#### Updated ConfidenceQuestionnaire
- Now passes `normalizedScore` to parent on completion
- Used for scenario tier selection

### ✅ Phase 7: Testing

#### Test Fixtures (`fixtures/confidence/`)
Three fixture files for testing:
- `phone_low_confidence.json`: High latency, long freezes, uncertainty
- `phone_medium_confidence.json`: Moderate performance
- `phone_high_confidence.json`: Fast, clear, assertive

#### E2E Tests (`e2e/confidence-phone.spec.ts`)
Basic test structure for:
- Complete assessment flow (intro → questionnaire → phone → results)
- Scenario selection based on questionnaire score
- D1-D5 score display
- Dev mode text input

## Key Features

### 1. Deterministic Scoring
- No subjective AI grading
- Purely rule-based D1-D5 calculation
- Evidence-based signal detection
- Reproducible with version tracking

### 2. Simulated VAD
- Uses Whisper word timestamps instead of real-time VAD
- Calculates speech ratio, pauses, latencies
- Accurate enough for confidence assessment
- No additional infrastructure needed

### 3. Tier Normalization
- Adjusts latency expectations by tier (+250ms T2, +500ms T3)
- Relaxes silence thresholds for harder scenarios (+300ms T3)
- Ensures fair scoring across difficulty levels

### 4. Behavioral Drills
- Not grammar exercises
- Focus on confidence behaviors (start fast, keep momentum, state needs)
- 20-40 second micro-practices
- Specific, actionable instructions

### 5. Dev Mode
- Skip TTS audio (instant bot responses)
- Text input instead of recording
- Speeds up development and testing
- Preserves full functionality

## File Structure

```
src/
├── lib/confidence/
│   ├── signalDictionaries.ts      # Phrase detection
│   ├── audioMetrics.ts             # VAD simulation
│   ├── metricsAggregator.ts        # Cross-turn aggregation
│   └── microDrills.ts              # Drill generation
├── components/assessment/confidence/
│   ├── types.ts                    # TypeScript definitions
│   ├── scenarios.json              # Scenario definitions
│   ├── scenarioSelector.ts         # Tier selection logic
│   ├── useBotVoice.ts             # TTS hook
│   ├── PhoneCallModule.tsx         # Main orchestrator
│   ├── PhoneCallScreen.tsx         # Visual interface
│   ├── TurnRecording.tsx           # Recording component
│   ├── ConfidenceSpeakingResults.tsx # Results display
│   ├── ConfidenceModule.tsx        # Updated module
│   └── ConfidenceQuestionnaire.tsx # Updated questionnaire

supabase/
├── functions/analyze-confidence-speaking/
│   └── index.ts                    # Scoring edge function
└── migrations/
    └── 20260105120000_confidence_phone_calls.sql

fixtures/confidence/
├── phone_low_confidence.json
├── phone_medium_confidence.json
└── phone_high_confidence.json

e2e/
└── confidence-phone.spec.ts
```

## Next Steps

### To Run the System

1. **Apply database migration:**
   ```bash
   supabase migration up
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test in dev mode:**
   - Navigate to confidence module
   - Complete questionnaire
   - Dev mode will be auto-enabled (skip audio, use text input)

### To Deploy

1. **Deploy edge function:**
   ```bash
   supabase functions deploy analyze-confidence-speaking
   ```

2. **Verify environment variables:**
   - `OPENAI_API_KEY` for Whisper
   - `ELEVENLABS_API_KEY` for TTS (already configured)

### To Customize

1. **Add more scenarios:**
   - Edit `src/components/assessment/confidence/scenarios.json`
   - Follow the turn structure (bot script, duration, objective, pushback level)

2. **Adjust scoring thresholds:**
   - Edit `src/lib/confidence/metricsAggregator.ts`
   - Modify D1/D2 scoring tables

3. **Add more confidence signals:**
   - Edit `src/lib/confidence/signalDictionaries.ts`
   - Add phrases to marker arrays

4. **Customize drills:**
   - Edit `src/lib/confidence/microDrills.ts`
   - Add new drill templates

## Compliance with Specification

✅ All requirements from `09_Confidence_Module_Speaking_Exam_Spec.md` implemented:
- D1-D5 dimensions with deterministic scoring
- Confidence signal detection (no grammar scoring)
- Timing instrumentation (latency, silence, speech ratio)
- Tier normalization
- Evidence snippets
- Micro-drills (behavioral, not grammatical)
- Combined score (50% questionnaire + 50% speaking)
- JSON output schema matching spec
- Test fixtures for QA

## Summary

The confidence phone call module is now a sophisticated, multi-turn conversation simulation that measures speaking confidence through objective, measurable dimensions. It provides actionable feedback and targeted practice exercises to help learners build real-world conversational confidence in French.

