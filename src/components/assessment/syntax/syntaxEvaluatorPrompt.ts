/**
 * LLM Feature Extraction Prompt for A2→B1 French Syntax (Layer A)
 * 
 * This prompt extracts features and evidence from transcripts.
 * Scoring is done deterministically in code (Layer B).
 * Focus is on structure, not vocabulary or pronunciation.
 */

export const SYNTAX_FEATURE_EXTRACTION_PROMPT = `You evaluate SPOKEN French syntax from ASR transcripts that may be cleaned.
Score only from POSITIVE evidence. Do not penalize absence of mistakes.
Return STRICT JSON matching the schema. Quotes must be verbatim.
Be conservative if transcript is short, garbled, or mixed-language.
Dropped "ne" is allowed when negation marker is correct.
No accent/vocabulary/pronunciation grading.`;

export const SYNTAX_EXERCISE_CONTEXT = `
## Exercise Context
The learner completed 3 speaking exercises designed to elicit A2→B1 structures:

1. **E1 (15s) - Quick Answer**: Binary choice + 1 reason
   - Targets: connectors (parce que/mais), basic negation, preference verbs

2. **E2 (30s) - Structured Plan**: Plan with 3 actions + sequencing
   - Targets: futur proche, sequencers (d'abord/ensuite/puis), object pronouns

3. **E3 (60s) - Mini-Story/Dilemma**: Past narration + what you do + why
   - Targets: passé composé, pronouns, questions, si-clauses, connector chains

Extract features and evidence from the combined transcript.`;

export const SYNTAX_JSON_SCHEMA = `
Return JSON in this exact format:
{
  "meta": {
    "prompt_version": "YYYY-MM-DD",
    "scorer_version": "YYYY-MM-DD",
    "asr_version": "whisper-1"
  },
  "asr_quality": {
    "confidence": 0.0,
    "flags": ["ok|short|garbled|mixed_language|too_clean"]
  },
  "evidence": {
    "passe_compose": [{"exercise":"E1|E2|E3","quote":"..."}],
    "futur_proche": [{"exercise":"E1|E2|E3","quote":"..."}],
    "connectors": [{"exercise":"E1|E2|E3","quote":"...","type":"because|contrast|sequence|result"}],
    "pronouns": [{"exercise":"E1|E2|E3","quote":"...","type":"le/la/les|lui/leur"}],
    "negation": [{"exercise":"E1|E2|E3","quote":"..."}],
    "questions": [{"exercise":"E1|E2|E3","quote":"...","type":"est-ce que|wh|intonation"}],
    "modality": [{"exercise":"E1|E2|E3","quote":"...","type":"pouvoir|devoir|vouloir"}],
    "si_clause": [{"exercise":"E1|E2|E3","quote":"..."}]
  },
  "features": {
    "clauses": { "estimated_clauses": 0, "multi_clause": false },
    "tenses": { "passe_compose_correct_like": 0, "futur_proche_correct_like": 0, "time_markers": [] },
    "connectors": { "because": 0, "contrast": 0, "sequence": 0, "result": 0, "examples": [] },
    "pronouns": { "le_la_les_correct_like": 0, "lui_leur_correct_like": 0, "issues": [] },
    "negation": { "count": 0, "types": ["pas|jamais|rien|plus|personne"], "issues": [] },
    "questions": { "clear_questions": 0, "types": ["est-ce que|why|how|where|intonation"], "issues": [] },
    "modality": { "count": 0, "types": ["pouvoir|devoir|vouloir"], "issues": [] },
    "si_clause": { "count": 0 }
  },
  "top_errors": [
    { "category": "word_order|pronouns|tense|questions|connectors", "example": "...", "fix_hint_fr": "..." }
  ],
  "feedback_fr": "1–2 encouraging sentences in French.",
  "confidence": 0.0
}`;
