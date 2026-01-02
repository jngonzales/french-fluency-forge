# API Reference

## Supabase Edge Functions

All Edge Functions are located in `supabase/functions/` and deployed to Supabase.

### Base URL
```
https://[project-ref].supabase.co/functions/v1/[function-name]
```

### Authentication
All functions require Supabase JWT token in Authorization header:
```
Authorization: Bearer [supabase_jwt_token]
```

---

## Assessment Functions

### `analyze-pronunciation`

Analyzes pronunciation using Azure Speech API.

**Endpoint:** `POST /functions/v1/analyze-pronunciation`

**Request Body:**
```json
{
  "audioBase64": "string (base64 encoded audio)",
  "referenceText": "string",
  "recordingId": "uuid",
  "itemId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "pronScore": 85,
  "accuracyScore": 90,
  "fluencyScore": 80,
  "completenessScore": 95,
  "wordLevelScores": [
    {
      "word": "bonjour",
      "accuracyScore": 95,
      "errorType": "None"
    }
  ]
}
```

**Features:**
- Fallback scoring from word-level data if top-level score missing
- Word-level accuracy breakdown
- Fluency estimation from timing
- Completeness calculation

---

### `analyze-fluency`

Analyzes fluency (WPM calculation) from picture descriptions.

**Endpoint:** `POST /functions/v1/analyze-fluency`

**Request Body:**
```json
{
  "audioBase64": "string",
  "recordingId": "uuid",
  "itemId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "wpm": 120.5,
  "transcript": "string",
  "aiFeedback": "string"
}
```

**Features:**
- Words per minute calculation
- Transcript generation (Whisper)
- AI feedback generation

---

### `analyze-skill`

Analyzes skill-based modules (confidence, syntax, conversation).

**Endpoint:** `POST /functions/v1/analyze-skill`

**Request Body:**
```json
{
  "transcript": "string",
  "moduleType": "confidence" | "syntax" | "conversation",
  "itemId": "string",
  "promptText": "string",
  "recordingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "score": 85,
  "feedback": "string",
  "breakdown": {
    "grammar": 90,
    "vocabulary": 80
  }
}
```

**Features:**
- OpenAI GPT-4 scoring
- Module-specific prompts
- Detailed breakdown

---

### `analyze-comprehension`

Analyzes listening comprehension.

**Endpoint:** `POST /functions/v1/analyze-comprehension`

**Request Body:**
```json
{
  "transcript": "string",
  "itemId": "string",
  "recordingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "score": 85,
  "confidence": 0.9,
  "feedbackFr": "string",
  "intentMatch": {},
  "understoodFacts": {}
}
```

---

### `analyze-syntax`

Analyzes syntax/grammar accuracy.

**Endpoint:** `POST /functions/v1/analyze-syntax`

**Request Body:**
```json
{
  "transcript": "string",
  "itemId": "string",
  "promptText": "string",
  "recordingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "score": 85,
  "feedback": "string",
  "breakdown": {}
}
```

---

### `conversation-agent`

AI agent for conversation module.

**Endpoint:** `POST /functions/v1/conversation-agent`

**Request Body:**
```json
{
  "action": "agent_turn" | "score",
  "conversationHistory": [
    { "role": "user" | "agent", "content": "string" }
  ],
  "scenario": {
    "title": "string",
    "goal": "string",
    "slots": {}
  },
  "turnNumber": 1,
  "recordingId": "uuid"
}
```

**Response (agent_turn):**
```json
{
  "success": true,
  "agentResponse": "string"
}
```

**Response (score):**
```json
{
  "success": true,
  "scoring": {
    "overall": 85,
    "subs": {}
  }
}
```

---

### `french-tts`

Text-to-speech for French audio.

**Endpoint:** `POST /functions/v1/french-tts`

**Request Body:**
```json
{
  "text": "string",
  "voice": "fr-FR-DeniseNeural" | "fr-FR-HenriNeural"
}
```

**Response:**
```json
{
  "success": true,
  "audioBase64": "string"
}
```

---

### `transcribe-pronunciation`

Transcribes audio for pronunciation module.

**Endpoint:** `POST /functions/v1/transcribe-pronunciation`

**Request Body:**
```json
{
  "audioBase64": "string"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": "string"
}
```

---

## System Integration

### `systemeio-webhook`

Handles Systeme.io purchase webhooks.

**Endpoint:** `POST /functions/v1/systemeio-webhook`

**Request Body:** (Systeme.io webhook payload)

**Response:**
```json
{
  "success": true,
  "message": "Processed"
}
```

**Features:**
- Purchase event processing
- Account creation
- Access status updates
- Credits tracking

---

## Database API (Supabase Client)

### Authentication

```typescript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

### Assessment Sessions

```typescript
// Create session
await supabase.from('assessment_sessions').insert({
  user_id: userId,
  status: 'intake'
})

// Update session
await supabase.from('assessment_sessions')
  .update({ status: 'consent' })
  .eq('id', sessionId)

// Get session
await supabase.from('assessment_sessions')
  .select('*')
  .eq('id', sessionId)
  .single()
```

### Recordings

```typescript
// Create recording
await supabase.from('skill_recordings').insert({
  session_id: sessionId,
  user_id: userId,
  module_type: 'pronunciation',
  item_id: itemId,
  attempt_number: 1,
  status: 'processing'
})

// Update recording
await supabase.from('skill_recordings')
  .update({
    transcript: transcript,
    ai_score: score,
    status: 'completed'
  })
  .eq('id', recordingId)
```

### Sales Copilot

```typescript
// Create lead
await supabase.from('sales_leads').insert({
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
})

// Create call
await supabase.from('sales_calls').insert({
  lead_id: leadId,
  stage: 'rapport',
  tags: [],
  answers: []
})

// Get active playbook
await supabase.from('sales_playbook')
  .select('playbook_data')
  .eq('is_active', true)
  .single()
```

---

## Error Handling

All Edge Functions return errors in this format:

```json
{
  "error": "Error message",
  "details": {}
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `500` - Server Error

---

## Rate Limiting

- Edge Functions: Supabase default limits
- Database: RLS policies enforce access control
- No explicit rate limiting implemented

---

## CORS

All Edge Functions include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

