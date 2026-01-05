# Pronunciation Debug Mode Documentation

## Overview

The pronunciation assessment now includes a comprehensive debug panel that shows exactly what happens at each stage of the process. This helps you understand:
- ✅ Whether audio was recorded correctly
- ✅ What the API received and understood
- ✅ Every phoneme with detailed scores
- ✅ Why something passed or failed
- ✅ Which provider was used (SpeechSuper or Azure)

## Debug Panel Sections

### 1. 🎤 Audio Recording

Shows the recording stage status:
- **Status:** Success or Failed
- **Size:** Number of bytes recorded
- **Format:** MIME type (e.g., audio/webm, audio/wav)
- **Duration:** Recording length in seconds

**What it means:**
- If recording failed → Check microphone permissions
- If size is 0 → Recording didn't capture audio
- If format is unexpected → Browser compatibility issue

### 2. 📤 Upload to Server

Shows whether audio was uploaded successfully:
- **Status:** Success or Failed
- **Payload size:** Size of base64-encoded audio

**What it means:**
- If upload failed → Network issue or file too large
- If payload size much larger than audio → Normal (base64 overhead)

### 3. 🌐 API Call

Shows which provider was used and call status:
- **Provider:** SpeechSuper (primary) or Azure (fallback)
- **Status:** Success or Failed
- **HTTP Status:** 200 OK, 401 Unauthorized, 500 Error, etc.
- **Response time:** Milliseconds taken

**What it means:**
- If SpeechSuper shown → Primary provider worked
- If Azure shown → Fallback to Azure (SpeechSuper unavailable)
- If 401 error → API key missing or invalid
- If 500 error → API service issue
- High response time → Network slow or audio processing intensive

### 4. 📝 Speech Recognition

Shows what the API understood:
- **What API Understood:** Exact transcript from speech recognition
- **Expected Text:** The reference text you were supposed to say
- **Text Match:** Percentage of words that match
- **Language:** Language detected by API (should be fr-FR)
- **Confidence:** API's confidence in recognition (0-100%)

**What it means:**
- If recognized text is very different → Poor recording quality or mispronunciation
- If text match is low → Many words were wrong or skipped
- If language is wrong → API detected wrong language (rare)
- Low confidence → API unsure about what was said

### 5. 📊 Score Calculation

Shows detailed score breakdown:
- **Accuracy:** Phoneme-level correctness (0-100)
- **Fluency:** Rhythm and timing (0-100)
- **Completeness:** All words spoken (0-100)
- **Formula:** How overall score is calculated

**Formula:**
```
Overall = (Accuracy × 0.6) + (Fluency × 0.2) + (Completeness × 0.2)
```

**What it means:**
- Low accuracy → Pronunciation issues with specific sounds
- Low fluency → Too many pauses or unnatural rhythm
- Low completeness → Some words were skipped
- Overall weighs accuracy most heavily (60%)

### 6. 🔤 Phonemes

Lists every phoneme detected with:
- **Phoneme:** IPA notation (e.g., /u/, /y/, /ʁ/)
- **Score:** 0-100 for that specific sound
- **Expected:** What phoneme should have been
- **You said:** What was detected (if different)
- **Status:** ✅ Correct or ❌ Incorrect

**What it means:**
- Each phoneme is individually scored
- Can see exactly which sounds need work
- Can identify patterns (e.g., always confusing /u/ and /y/)

### 7. ⏱️ Processing Timeline

Shows each processing step with timing:
- prepare_request → API call → parse_response → etc.
- Duration for each step
- Success/failure for each step

**What it means:**
- Can see where process slowed down or failed
- Useful for diagnosing performance issues

### 8. 📦 Raw API Response

The complete, unfiltered JSON response from the API.

**What it means:**
- For advanced debugging
- Can manually inspect any field
- Useful for reporting issues to support

## How to Use Debug Panel

### Accessing Debug Panel

The debug panel is automatically shown below the feedback after each attempt. You can also:
- Click "🐛 Show Debug Information" button
- Panel shows by default when feedback is displayed

### Understanding Pass/Fail

**PASS (≥75%):**
- Most phonemes scored well (90%+)
- Minor issues only
- Green indicators

**OK (50-74%):**
- Some phonemes need work
- Several sounds were off
- Yellow indicators

**FAIL (<50%):**
- Many phonemes scored poorly
- Significant pronunciation issues
- Red indicators

### Common Scenarios

#### Scenario 1: "I recorded but got 0 score"

Check debug panel:
1. Recording section → Was audio captured?
2. Upload section → Did it reach the server?
3. API Call section → Did the API call succeed?
4. Recognition section → What did API understand?

**Fix:**
- If recording failed → Check mic permissions
- If upload failed → Check internet connection
- If API failed → Check API keys configured
- If recognized text is empty → Re-record with better audio

#### Scenario 2: "All words show red"

Check debug panel:
1. Recognition section → What text was recognized?
2. Compare to expected text
3. Check phoneme details

**Possible causes:**
- Wrong language detected (should be fr-FR)
- Very poor audio quality
- Speaking wrong text
- API returning unexpected format

#### Scenario 3: "Score seems wrong"

Check debug panel:
1. Score Calculation section → See formula breakdown
2. Phoneme section → Check individual phoneme scores
3. Compare phoneme scores to word scores

**Understanding:**
- Overall = Accuracy×60% + Fluency×20% + Completeness×20%
- Even if fluency is high, low accuracy will pull score down
- Missing words drastically reduce completeness

## Exporting Debug Info

Click the copy icon (📋) in debug panel header to copy all debug information to clipboard. Useful for:
- Reporting issues to support
- Sharing with teachers
- Analyzing patterns across attempts

## Developer Notes

### Debug Data Structure

```typescript
{
  provider: "speechsuper" | "azure",
  recognizedText: "what API understood",
  expectedText: "reference text",
  textMatch: 90,
  scores: {
    overall: 78,
    accuracy: 75,
    fluency: 88,
    completeness: 100
  },
  words: [...],
  allPhonemes: [...],
  debug: {
    recordingStatus: "success",
    audioSize: 45231,
    apiCallStatus: "success",
    ...
  }
}
```

### Adding Custom Debug Info

To add more debug information:
1. Update `UnifiedPronunciationResult` type in `_shared/unified-result.ts`
2. Add field to result in edge function
3. Display in `PronunciationDebugPanel.tsx`

## Troubleshooting Guide

| Issue | Check | Solution |
|-------|-------|----------|
| No audio recorded | Recording section | Grant mic permissions |
| Audio size is 0 | Recording section | Browser doesn't support MediaRecorder |
| API call failed | API Call section | Check API keys in env |
| Wrong language | Recognition section | Verify language setting in API call |
| No phonemes shown | Phonemes section | API didn't return phoneme data |
| All scores are 0 | Score Calculation | API parsing failed |

## Next Steps

- Review phoneme details for specific practice areas
- Use practice suggestions to improve weak sounds
- Compare attempts to track improvement
- Export debug info for pattern analysis

