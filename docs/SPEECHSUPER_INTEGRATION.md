# SpeechSuper API Integration Guide

**Status:** Awaiting API key  
**Priority:** Primary pronunciation provider  
**Fallback:** Azure Speech Services

## Overview

SpeechSuper provides superior phoneme-level pronunciation assessment with detailed IPA notation and comprehensive feedback. This guide documents the integration.

## API Documentation

**Official Docs:** https://docs.speechsuper.com/

## Setup

### Environment Variables

Add to `.env` and Supabase edge function secrets:

```bash
SPEECHSUPER_API_KEY=your_api_key_here
SPEECHSUPER_API_URL=https://api.speechsuper.com/  # Update with actual endpoint
```

## API Capabilities (To Be Documented)

### Endpoints

**Pronunciation Assessment:**
- Endpoint: TBD (from docs)
- Method: POST
- Content-Type: multipart/form-data or audio/wav

### Request Format

```json
{
  "audio": "base64_or_binary",
  "referenceText": "Tu as vu tout le monde",
  "language": "fr-FR",
  "coreType": "phoneme.score",
  "refText": "reference text",
  "phonemeOutput": true
}
```

### Response Format (Expected)

```json
{
  "result": {
    "overall": 78,
    "accuracy": 75,
    "fluency": 88,
    "completeness": 100,
    "words": [
      {
        "word": "tout",
        "score": 45,
        "phonemes": [
          {
            "phoneme": "/t/",
            "ipa": "t",
            "score": 95,
            "expected": "/t/",
            "actual": "/t/",
            "quality": "good"
          },
          {
            "phoneme": "/u/",
            "ipa": "u",
            "score": 45,
            "expected": "/u/",
            "actual": "/y/",
            "quality": "incorrect"
          }
        ]
      }
    ]
  }
}
```

## Advantages Over Azure

1. **Detailed Phoneme Feedback**
   - Shows expected vs actual phoneme
   - Provides quality ratings
   - IPA notation built-in

2. **Better French Support**
   - Optimized for French phonology
   - Handles French-specific sounds better
   - Better nasal vowel detection

3. **Actionable Feedback**
   - Specific error descriptions
   - Practice recommendations
   - Common mistake detection

## Integration Checklist

- [ ] Get API key from SpeechSuper
- [ ] Test with sample French audio
- [ ] Document exact request format
- [ ] Document exact response format
- [ ] Implement edge function
- [ ] Test phoneme extraction
- [ ] Verify IPA notation accuracy
- [ ] Compare results with Azure
- [ ] Implement fallback logic
- [ ] Add comprehensive logging

## Testing Samples

### Test 1: Perfect Pronunciation
**Text:** "Bonjour"  
**Expected:** High scores across all phonemes

### Test 2: /y/ vs /u/ Confusion
**Text:** "Tu as vu tout"  
**Expected:** Low score on /u/ or /y/ phonemes

### Test 3: Nasal Vowels
**Text:** "Un bon vin blanc"  
**Expected:** Detailed nasal vowel analysis

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify key in environment
   - Check key hasn't expired
   - Test with curl

2. **Audio Format Issues**
   - SpeechSuper may require specific format (WAV recommended)
   - Check sample rate (16kHz typical)
   - Verify mono channel

3. **Language Detection**
   - Ensure `language: "fr-FR"` is set
   - Check if API auto-detects or requires explicit setting

## Next Steps

1. **Obtain API key** - Contact SpeechSuper
2. **Test endpoint** - Verify with curl/Postman
3. **Document response** - Map all fields
4. **Implement integration** - Create edge function
5. **Verify quality** - Compare with Azure results

