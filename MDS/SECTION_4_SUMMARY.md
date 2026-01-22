# Section 4 Summary: Confidence, Conversation, and Fluency

## Overview
Section 4 (Conversation Module) evaluates three skills from a single recording:
1. **Fluency** - Words per minute (WPM) calculation
2. **Syntax** - Grammatical structures analysis  
3. **Conversation** - Conversational skills and clarity

## Key Files for Section 4

### Main Component
- **`src/components/assessment/conversation/ConversationModule.tsx`**
  - Displays prompt from `speaking` prompt bank
  - Uses `useAudioRecorder` hook for recording
  - Handles submission: calls `analyze-fluency`, then `analyze-skill` (twice) for syntax and conversation
  - Status flow: `pending` → `processing` → `completed`

### Audio Recording
- **`src/hooks/useAudioRecorder.ts`**
  - Core recording logic using MediaRecorder API
  - Returns `audioBlob` (webm format)
  - Supports max duration, pause/resume, WAV conversion

### Edge Functions
- **`supabase/functions/analyze-fluency/index.ts`**
  - Transcribes audio via Whisper API (word-level timestamps)
  - Calculates WPM, pause metrics
  - Returns transcript for reuse in syntax/conversation analysis
  
- **`supabase/functions/analyze-skill/index.ts`**
  - Analyzes transcript with GPT-4o-mini
  - Used for both syntax and conversation (different prompts)
  - Returns score (0-100), feedback, breakdown

### Database Tables
- **`fluency_recordings`**: Stores WPM, pause_count, transcript
- **`skill_recordings`**: Stores ai_score (0-100) for syntax and conversation

### Results Display
- **`src/pages/Results.tsx`**
  - Fetches scores from both tables
  - Converts to 1-10 scale for radar chart
  - Radar chart expects domain={[0, 10]}

## Data Flow

```
User records → useAudioRecorder → audioBlob
  ↓
Convert to base64 → Insert fluency_recordings (status: 'processing')
  ↓
POST /analyze-fluency → Whisper transcription → Calculate WPM
  ↓
Update fluency_recordings (status: 'completed', wpm, transcript)
  ↓
Extract transcript → Parallel Promise.all():
  ├─ analyzeSkillWithTranscript('syntax', transcript)
  │   └─ Insert skill_recordings → POST /analyze-skill → GPT-4o-mini
  └─ analyzeSkillWithTranscript('conversation', transcript)
      └─ Insert skill_recordings → POST /analyze-skill → GPT-4o-mini
```

## Score Conversion

- **Fluency**: WPM (integer) → `wpmToScore()` → 1-10 scale
- **Syntax**: ai_score (0-100) → `aiScoreToScale()` → 1-10 scale  
- **Conversation**: ai_score (0-100) → `aiScoreToScale()` → 1-10 scale

## Status Machine

All recordings follow: `pending` → `processing` → `completed` (or `error`)

## Important Notes

1. **Transcript Reuse**: Same transcript from fluency analysis is used for both syntax and conversation
2. **Parallel Processing**: Syntax and conversation analysis happen simultaneously via `Promise.all()`
3. **Score Scales**: Database stores different formats (WPM vs 0-100), Results page normalizes to 1-10
4. **Prompt Bank**: Prompts loaded from `src/components/assessment/promptBank/promptBanks/speaking.json`

