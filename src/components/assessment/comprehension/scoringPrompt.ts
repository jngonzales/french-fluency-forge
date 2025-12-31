export const COMPREHENSION_SCORING_PROMPT = `SCORE LISTENING COMPREHENSION FROM THE LEARNER RESPONSE. OUTPUT ONLY JSON.

BE STRICT ABOUT WHETHER THEY UNDERSTOOD THE KEY FACTS AND INTENT.

DO NOT JUDGE PRONUNCIATION OR GRAMMAR.

USER:

Context: <<<CONTEXT>>>

Audio script (ground truth): <<<AUDIO_SCRIPT>>>

Key facts to understand: <<<FACTS_JSON>>>

Acceptable intents: <<<INTENTS_JSON>>>

Learner response transcript:

<<<LEARNER>>>

Return:

{
  "score": 0-100,
  "understood_facts": [{"fact":"...","ok":true/false,"evidence":"..."}],
  "intent_match": {"ok":true/false,"type":"answer|question|other"},
  "feedback_fr": "1-2 supportive sentences in French",
  "confidence": 0-1
}`;

export const buildScoringPrompt = (
  context: string,
  audioScript: string,
  keyFacts: string[],
  acceptableIntents: string[],
  learnerTranscript: string
): string => {
  return COMPREHENSION_SCORING_PROMPT
    .replace("<<<CONTEXT>>>", context)
    .replace("<<<AUDIO_SCRIPT>>>", audioScript)
    .replace("<<<FACTS_JSON>>>", JSON.stringify(keyFacts))
    .replace("<<<INTENTS_JSON>>>", JSON.stringify(acceptableIntents))
    .replace("<<<LEARNER>>>", learnerTranscript);
};
