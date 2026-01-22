# Speaking Assessment Section 4 (Fluency + Syntax + Conversation) - Code Gathering

## A) Ranked List of File Paths (Most Critical First)

### Core Component & UI
1. **`src/components/assessment/conversation/ConversationModule.tsx`** - Main Section 4 component with prompt display, recording UI, and submission logic
2. **`src/hooks/useAudioRecorder.ts`** - Audio recording hook used by ConversationModule for record/stop functionality
3. **`src/pages/Assessment.tsx`** - Main assessment page that routes to ConversationModule (Section 4) when `assessmentPhase === "conversation"`

### Analysis & Edge Functions
4. **`supabase/functions/analyze-fluency/index.ts`** - Edge function that transcribes audio via Whisper and calculates WPM, pause metrics, and fluency scores
5. **`supabase/functions/analyze-skill/index.ts`** - Edge function that analyzes syntax and conversation skills from transcript using GPT-4o-mini

### Data Persistence & Database
6. **`src/pages/Results.tsx`** - Results page that displays radar chart and fetches scores from `fluency_recordings` and `skill_recordings` tables
7. **`supabase/migrations/20251231005752_27f67131-4335-44bb-a28c-51f0e4f8569c.sql`** - Database schema for `fluency_recordings` table
8. **`supabase/migrations/20251231030934_50a34ff6-3db6-45c8-acb5-3831e9bd0c13.sql`** - Database schema for `skill_recordings` table (contains syntax and conversation results)

### Prompt Management
9. **`src/components/assessment/promptBank/loadPromptBank.ts`** - Loads speaking prompts from JSON files for Section 4

### Supporting Files
10. **`src/integrations/supabase/types.ts`** - TypeScript types for database tables (fluency_recordings, skill_recordings)
11. **`docs/06_ASSESSMENT_MODULES.md`** - Documentation describing Section 4 structure and flow
12. **`docs/02_DATABASE_SCHEMA.md`** - Database schema documentation

---

## B) File Snippets Showing Relevance

### 1. ConversationModule.tsx (Main Component)
```tsx
// Lines 21-51: Component setup with audio recorder
export function ConversationModule({ sessionId, onComplete }: ConversationModuleProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const prompt = useMemo(() => {
    const prompts = getPrompts('speaking') as SpeakingPrompt[];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, []);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ maxDuration: MAX_DURATION_SECONDS });

// Lines 168-265: Submission handler - records audio, calls analyze-fluency, then analyze-skill
  const handleSubmit = async () => {
    const base64Audio = await convertBlobToBase64(audioBlob);
    
    // Insert fluency recording
    const { data: fluencyRecording } = await supabase
      .from('fluency_recordings')
      .insert({ session_id: sessionId, status: 'processing', ... })
      .select('id')
      .single();

    // Call analyze-fluency edge function
    const fluencyResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-fluency`,
      { method: 'POST', body: JSON.stringify({ audio: base64Audio, ... }) }
    );
    
    const fluencyResult = await fluencyResponse.json();
    const transcript = fluencyResult.transcript || '';

    // Analyze syntax and conversation from same transcript
    await Promise.all([
      analyzeSkillWithTranscript('syntax', transcript),
      analyzeSkillWithTranscript('conversation', transcript),
    ]);
  };
```

### 2. useAudioRecorder.ts (Recording Hook)
```tsx
// Lines 27-143: Core recording logic
export const useAudioRecorder = (options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, ... }
    });
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm",
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };
    
    mediaRecorder.start(100);
    setIsRecording(true);
  }, []);
};
```

### 3. analyze-fluency/index.ts (Fluency Analysis)
```typescript
// Lines 187-316: Main handler - transcribes audio and calculates WPM
serve(async (req) => {
  const { audio, itemId, recordingDuration } = await req.json();
  
  // Convert base64 to binary
  const binaryAudio = processBase64Chunks(audio);
  
  // Call Whisper API with word-level timestamps
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  
  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIApiKey}` },
    body: formData,
  });
  
  const whisperResult = await whisperResponse.json();
  const transcript = whisperResult.text || '';
  const words: WordTimestamp[] = whisperResult.words || [];
  
  // Calculate metrics (WPM, pauses, etc.)
  const metrics = calculateMetrics(words, audioDuration);
  const speedSubscore = calculateSpeedSubscore(metrics.articulationWpm);
  const pauseSubscore = calculatePauseSubscore(...);
  
  return new Response(JSON.stringify({
    transcript,
    wordCount: metrics.wordCount,
    articulationWpm: metrics.articulationWpm,
    speedSubscore,
    pauseSubscore,
    totalScore: speedSubscore + pauseSubscore,
  }));
});
```

### 4. analyze-skill/index.ts (Syntax & Conversation Analysis)
```typescript
// Lines 332-445: Main handler - analyzes transcript with GPT-4o-mini
serve(async (req) => {
  const { transcript: directTranscript, moduleType, itemId, promptText, recordingId } = await req.json();
  
  // Update status to processing
  await supabase
    .from('skill_recordings')
    .update({ status: 'processing' })
    .eq('id', recordingId);
  
  // Analyze with AI (GPT-4o-mini)
  const analysis = await analyzeWithDeterminismGuard(transcript, moduleType, promptText);
  
  // Update recording with results
  await supabase
    .from('skill_recordings')
    .update({
      transcript,
      ai_score: analysis.score,  // 0-100 scale
      ai_feedback: analysis.feedback,
      ai_breakdown: { ...analysis.breakdown, evidence: analysis.evidence },
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', recordingId);
});

// Lines 172-282: AI analysis function
async function analyzeWithAI(transcript: string, moduleType: string, promptText: string) {
  let systemPrompt = '';
  switch (moduleType) {
    case 'syntax': systemPrompt = SYNTAX_PROMPT; break;
    case 'conversation': systemPrompt = CONVERSATION_PROMPT; break;
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Prompt: "${promptText}"\nResponse: "${transcript}"` }
      ],
      tools: [{ type: 'function', function: { name: 'submit_evaluation', ... } }]
    })
  });
  
  // Returns score (0-100), feedback, breakdown, evidence
}
```

### 5. Results.tsx (Results Display)
```tsx
// Lines 122-202: Fetching scores from database
const { data: fluencyRecordings } = await supabase
  .from("fluency_recordings")
  .select("wpm")
  .eq("session_id", sessionId)
  .eq("used_for_scoring", true)
  .not("wpm", "is", null);

const { data: skillRecordings } = await supabase
  .from("skill_recordings")
  .select("module_type, ai_score")
  .eq("session_id", sessionId)
  .eq("used_for_scoring", true)
  .not("ai_score", "is", null);

// Lines 214-263: Building radar chart data (0-10 scale)
const skillData: SkillScore[] = [
  { skill: "Fluency", score: wpmToScore(sessionData.fluencyWpm), ... },  // WPM -> 1-10
  { skill: "Syntax", score: aiScoreToScale(sessionData.syntaxScore), ... },  // 0-100 -> 1-10
  { skill: "Conversation", score: aiScoreToScale(sessionData.conversationScore), ... },  // 0-100 -> 1-10
];

// Lines 327-359: Radar chart rendering
<RadarChart data={skillData} cx="50%" cy="50%" outerRadius="80%">
  <PolarRadiusAxis domain={[0, 10]} />  {/* Expects 0-10 scale */}
  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
</RadarChart>
```

### 6. Assessment.tsx (Routing)
```tsx
// Lines 178-201: Routes to ConversationModule when phase is "conversation"
case "assessment":
  const renderModule = () => {
    switch (assessmentPhase) {
      case "conversation":
        // Conversation-agent evaluates: fluency, confidence, conversation, and syntax
        return <ConversationModule {...moduleProps} />;
    }
  };
```

### 7. Database Schema (fluency_recordings)
```sql
-- Lines 1-32: Table structure
CREATE TABLE public.fluency_recordings (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES assessment_sessions(id),
  user_id UUID REFERENCES profiles(id),
  item_id TEXT,
  attempt_number INTEGER,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  transcript TEXT,
  wpm INTEGER,  -- Words per minute
  pause_count INTEGER,
  total_pause_duration NUMERIC,
  used_for_scoring BOOLEAN,
  superseded BOOLEAN,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### 8. Database Schema (skill_recordings)
```sql
-- Table structure for syntax and conversation results
CREATE TABLE public.skill_recordings (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES assessment_sessions(id),
  module_type TEXT,  -- 'syntax' or 'conversation'
  item_id TEXT,
  attempt_number INTEGER,
  transcript TEXT,
  ai_score NUMERIC,  -- 0-100 scale
  ai_feedback TEXT,
  ai_breakdown JSONB,
  status TEXT,  -- 'processing', 'completed', 'error'
  used_for_scoring BOOLEAN,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

## C) Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECTION 4: CONVERSATION MODULE                │
│                    (Fluency + Syntax + Conversation)             │
└─────────────────────────────────────────────────────────────────┘

1. USER INTERACTION
   ┌─────────────────────────────────────┐
   │ ConversationModule.tsx               │
   │ - Displays prompt from promptBank    │
   │ - Shows record/stop button           │
   │ - Uses useAudioRecorder hook         │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ useAudioRecorder.ts                  │
   │ - getUserMedia() → MediaRecorder      │
   │ - Records audio/webm blob            │
   │ - Returns audioBlob on stop          │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ User clicks "Submit recording"       │
   │ handleSubmit() called                │
   └──────────────┬──────────────────────┘
                  │
                  ▼
2. AUDIO PROCESSING
   ┌─────────────────────────────────────┐
   │ Convert audioBlob → base64          │
   │ Insert into fluency_recordings       │
   │ status: 'processing'                 │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ POST /functions/v1/analyze-fluency   │
   │ Body: { audio: base64, itemId, ... } │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ analyze-fluency/index.ts            │
   │ 1. Process base64 → binary audio      │
   │ 2. Call Whisper API (word timestamps)│
   │ 3. Calculate metrics:               │
   │    - articulationWpm                  │
   │    - pause_count, pause_ratio        │
   │    - speedSubscore (0-60)            │
   │    - pauseSubscore (0-40)            │
   │ 4. Return: { transcript, wpm, ... } │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ Update fluency_recordings           │
   │ - transcript                         │
   │ - wpm                                │
   │ - pause_count, total_pause_duration  │
   │ - status: 'completed'               │
   └──────────────┬──────────────────────┘
                  │
                  ▼
3. TRANSCRIPT ANALYSIS (Parallel)
   ┌─────────────────────────────────────┐
   │ analyzeSkillWithTranscript()        │
   │ Called twice in Promise.all():      │
   │ - 'syntax'                           │
   │ - 'conversation'                     │
   └──────────────┬──────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌──────────┐      ┌──────────────┐
   │ SYNTAX   │      │ CONVERSATION │
   └────┬─────┘      └──────┬──────┘
        │                   │
        ▼                   ▼
   ┌─────────────────────────────────────┐
   │ Insert into skill_recordings        │
   │ - module_type: 'syntax' or 'conversation'│
   │ - transcript (from fluency analysis)│
   │ - status: 'processing'               │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ POST /functions/v1/analyze-skill    │
   │ Body: { transcript, moduleType, ... }│
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ analyze-skill/index.ts              │
   │ 1. Update status: 'processing'      │
   │ 2. Call analyzeWithDeterminismGuard()│
   │    - Uses GPT-4o-mini               │
   │    - System prompt (SYNTAX_PROMPT   │
   │      or CONVERSATION_PROMPT)         │
   │    - Returns score (0-100)          │
   │ 3. Update skill_recordings:          │
   │    - ai_score (0-100)                │
   │    - ai_feedback                     │
   │    - ai_breakdown (JSONB)            │
   │    - status: 'completed'             │
   └──────────────┬──────────────────────┘
                  │
                  ▼
4. RESULTS DISPLAY
   ┌─────────────────────────────────────┐
   │ Results.tsx                         │
   │ 1. Fetch fluency_recordings         │
   │    - Calculate avg WPM              │
   │ 2. Fetch skill_recordings           │
   │    - Filter by module_type          │
   │    - Calculate avg ai_score         │
   │ 3. Convert to 1-10 scale:           │
   │    - WPM → wpmToScore()             │
   │    - ai_score (0-100) → aiScoreToScale()│
   │ 4. Render RadarChart (0-10 domain)  │
   └─────────────────────────────────────┘

STATE MACHINE:
  ┌─────────┐
  │ pending │  (initial insert)
  └────┬────┘
       │
       ▼
  ┌────────────┐
  │ processing │  (after edge function called)
  └────┬───────┘
       │
       ├──► ┌─────────┐
       │    │ error   │  (if analysis fails)
       │    └─────────┘
       │
       ▼
  ┌───────────┐
  │ completed │  (after successful analysis)
  └───────────┘

SCORE SCALES:
  - Fluency: WPM (words per minute) → converted to 1-10
  - Syntax: 0-100 (from GPT-4o-mini) → converted to 1-10
  - Conversation: 0-100 (from GPT-4o-mini) → converted to 1-10
  - Radar Chart: Expects 0-10 scale (domain={[0, 10]})
```

---

## Key Points for Stability

1. **Status Flow**: `pending` → `processing` → `completed` (or `error`)
2. **Score Conversion**: Results page expects 0-10 scale, but database stores:
   - Fluency: WPM (integer)
   - Syntax/Conversation: 0-100 (ai_score)
3. **Transcript Reuse**: Same transcript from `analyze-fluency` is used for both `analyze-skill` calls
4. **Parallel Processing**: Syntax and conversation analysis happen in parallel via `Promise.all()`
5. **Database Tables**:
   - `fluency_recordings`: Stores WPM and pause metrics
   - `skill_recordings`: Stores AI scores (0-100) for syntax and conversation
6. **Edge Functions**:
   - `analyze-fluency`: Transcribes audio, calculates WPM
   - `analyze-skill`: Analyzes transcript with GPT-4o-mini for syntax/conversation

