# Section 4 (Fluency + Syntax + Conversation) - Essential Summary

## Overview
Section 4 evaluates three skills from a single audio recording:
1. **Fluency** - Words per minute (WPM) calculation
2. **Syntax** - Grammatical structures analysis  
3. **Conversation** - Conversational skills and clarity

## Data Flow

```
User records → useAudioRecorder → audioBlob (webm)
  ↓
Convert to base64 → Insert fluency_recordings (status: 'processing')
  ↓
POST /analyze-fluency → Whisper API (word timestamps) → Calculate WPM
  ↓
Update fluency_recordings (status: 'completed', wpm, transcript)
  ↓
Extract transcript → Parallel Promise.all():
  ├─ analyzeSkillWithTranscript('syntax', transcript)
  │   └─ Insert skill_recordings → POST /analyze-skill → GPT-4o-mini
  └─ analyzeSkillWithTranscript('conversation', transcript)
      └─ Insert skill_recordings → POST /analyze-skill → GPT-4o-mini
```

## Key Files

1. **01_french-tts.ts** - French text-to-speech (ElevenLabs)
2. **02_analyze-fluency.ts** - Transcribes audio, calculates WPM and pause metrics
3. **03_analyze-syntax.ts** - Analyzes syntax from transcript (GPT-4o-mini)
4. **04_ConversationModule.tsx** - Main Section 4 component with recording UI
5. **05_comprehension-prompts.json** - Comprehension prompt bank
6. **06_SECTION_4_SUMMARY.md** - This document

## Database Tables

- **`fluency_recordings`**: Stores WPM, pause_count, transcript
  - Status: `pending` → `processing` → `completed`
- **`skill_recordings`**: Stores ai_score (0-100) for syntax and conversation
  - Status: `pending` → `processing` → `completed`

## Score Conversion (Results Page)

- **Fluency**: WPM (integer) → `wpmToScore()` → 1-10 scale
- **Syntax**: ai_score (0-100) → `aiScoreToScale()` → 1-10 scale  
- **Conversation**: ai_score (0-100) → `aiScoreToScale()` → 1-10 scale
- **Radar Chart**: Expects domain={[0, 10]}

## Important Notes

1. **Transcript Reuse**: Same transcript from `analyze-fluency` is used for both `analyze-skill` calls
2. **Parallel Processing**: Syntax and conversation analysis happen simultaneously via `Promise.all()`
3. **Status Machine**: All recordings follow `pending` → `processing` → `completed` (or `error`)
4. **Audio Format**: WebM from browser, converted to base64 for edge functions

## ConversationModule Key Functions

- `handleSubmit()`: Main submission handler
  - Converts audioBlob to base64
  - Calls `analyze-fluency` edge function
  - Extracts transcript
  - Calls `analyzeSkillWithTranscript()` twice (syntax + conversation)

- `analyzeSkillWithTranscript()`: Helper function
  - Inserts skill_recordings with transcript
  - Calls `analyze-skill` edge function
  - Updates status to 'completed' on success

## Edge Function Details

### analyze-fluency
- Input: base64 audio, itemId, recordingDuration
- Process: Whisper API with word-level timestamps
- Output: transcript, WPM, pause metrics, scores (0-100)

### analyze-skill  
- Input: transcript, moduleType ('syntax' or 'conversation'), promptText
- Process: GPT-4o-mini with module-specific prompts
- Output: score (0-100), feedback, breakdown, evidence

### analyze-syntax (separate function)
- Input: exerciseTranscripts array (E1, E2, E3)
- Process: LLM feature extraction + deterministic scoring
- Output: overall score, subscores, errors, feedback

