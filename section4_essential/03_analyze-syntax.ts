import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Layer A: Feature Extraction Prompt
const SYNTAX_FEATURE_EXTRACTION_PROMPT = `You evaluate SPOKEN French syntax from ASR transcripts that may be cleaned.
Score only from POSITIVE evidence. Do not penalize absence of mistakes.
Return STRICT JSON matching the schema. Quotes must be verbatim.
Be conservative if transcript is short, garbled, or mixed-language.
Dropped "ne" is allowed when negation marker is correct.
No accent/vocabulary/pronunciation grading.`;

interface ExerciseTranscript {
  exerciseType: 'E1' | 'E2' | 'E3';
  transcript: string;
}

interface EvidenceItem {
  exercise: 'E1' | 'E2' | 'E3';
  quote: string;
  type?: string;
}

interface SyntaxFeatures {
  clauses: { estimated_clauses: number; multi_clause: boolean };
  tenses: { passe_compose_correct_like: number; futur_proche_correct_like: number; time_markers: string[] };
  connectors: { because: number; contrast: number; sequence: number; result: number; examples: string[] };
  pronouns: { le_la_les_correct_like: number; lui_leur_correct_like: number; issues: string[] };
  negation: { count: number; types: string[]; issues: string[] };
  questions: { clear_questions: number; types: string[]; issues: string[] };
  modality: { count: number; types: string[]; issues: string[] };
  si_clause: { count: number };
}

interface SyntaxFeatureExtraction {
  meta: {
    prompt_version: string;
    scorer_version: string;
    asr_version: string;
  };
  asr_quality: {
    confidence: number;
    flags: string[];
  };
  evidence: {
    passe_compose: EvidenceItem[];
    futur_proche: EvidenceItem[];
    connectors: EvidenceItem[];
    pronouns: EvidenceItem[];
    negation: EvidenceItem[];
    questions: EvidenceItem[];
    modality: EvidenceItem[];
    si_clause: EvidenceItem[];
  };
  features: SyntaxFeatures;
  top_errors: Array<{ category: string; example: string; fix_hint_fr: string }>;
  feedback_fr: string;
  confidence: number;
}

interface SyntaxScores {
  structure_connectors: number;
  tenses_time: number;
  pronouns: number;
  questions_modality_negation: number;
  overall: number;
}

async function transcribeAudio(audioBase64: string, audioMimeType?: string): Promise<string> {
  console.log('Starting transcription...');
  console.log('Audio MIME type:', audioMimeType || 'not provided, defaulting to audio/webm');
  
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const mimeType = audioMimeType || 'audio/webm';
  let extension = 'webm';
  
  if (mimeType.includes('wav')) extension = 'wav';
  else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) extension = 'mp3';
  else if (mimeType.includes('mp4') || mimeType.includes('m4a')) extension = 'm4a';
  else if (mimeType.includes('ogg')) extension = 'ogg';
  else if (mimeType.includes('flac')) extension = 'flac';
  else if (mimeType.includes('webm')) extension = 'webm';
  
  console.log(`Using file extension: ${extension}, MIME type: ${mimeType}`);
  
  const formData = new FormData();
  formData.append('file', new Blob([bytes], { type: mimeType }), `audio.${extension}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'fr');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Whisper API error:', error);
    throw new Error(`Transcription failed: ${error}`);
  }

  const result = await response.json();
  console.log('Transcription complete:', result.text?.substring(0, 100));
  return result.text || '';
}

async function extractSyntaxFeatures(combinedTranscript: string): Promise<SyntaxFeatureExtraction> {
  console.log('Extracting syntax features with LLM (Layer A)...');
  
  const userPrompt = `## Exercise Context
The learner completed 3 speaking exercises designed to elicit A2→B1 structures:

1. **E1 (15s) - Quick Answer**: Binary choice + 1 reason
   - Targets: connectors (parce que/mais), basic negation, preference verbs

2. **E2 (30s) - Structured Plan**: Plan with 3 actions + sequencing
   - Targets: futur proche, sequencers (d'abord/ensuite/puis), object pronouns

3. **E3 (60s) - Mini-Story/Dilemma**: Past narration + what you do + why
   - Targets: passé composé, pronouns, questions, si-clauses, connector chains

Extract features and evidence from the combined transcript.

Transcript:
<<<
${combinedTranscript}
>>>

Return JSON in this exact format:
{
  "meta": {
    "prompt_version": "2026-01-15",
    "scorer_version": "2026-01-15",
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
    "negation": { "count": 0, "types": [], "issues": [] },
    "questions": { "clear_questions": 0, "types": [], "issues": [] },
    "modality": { "count": 0, "types": [], "issues": [] },
    "si_clause": { "count": 0 }
  },
  "top_errors": [
    { "category": "word_order|pronouns|tense|questions|connectors", "example": "...", "fix_hint_fr": "..." }
  ],
  "feedback_fr": "1–2 encouraging sentences in French.",
  "confidence": 0.0
}

Remember: only reward structures you explicitly see. If transcript looks suspiciously perfect, set asr_quality.flags includes "too_clean" and lower confidence.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYNTAX_FEATURE_EXTRACTION_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`LLM feature extraction failed: ${error}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in LLM response');
  }

  console.log('LLM feature extraction result:', content.substring(0, 500));
  
  const extraction = JSON.parse(content) as SyntaxFeatureExtraction;
  
  // Validate required fields
  if (!extraction.features || !extraction.evidence) {
    throw new Error('Invalid feature extraction response: missing features or evidence');
  }
  
  return extraction;
}

function computeSyntaxScores(features: SyntaxFeatures, asrQuality: { flags: string[] }): SyntaxScores {
  console.log('Computing scores deterministically (Layer B)...');
  
  const f = features;
  
  // A) Structure & Connectors (0-30)
  let structureConnectors = 0;
  if (f.clauses.multi_clause) structureConnectors += 10;
  const connectorVariety = (f.connectors.because > 0 ? 1 : 0) + 
                           (f.connectors.contrast > 0 ? 1 : 0) + 
                           (f.connectors.sequence > 0 ? 1 : 0) + 
                           (f.connectors.result > 0 ? 1 : 0);
  structureConnectors += Math.min(20, connectorVariety * 5);
  structureConnectors = Math.min(30, structureConnectors);
  
  // B) Tenses & Time (0-25)
  let tensesTime = 0;
  if (f.tenses.passe_compose_correct_like > 0) {
    tensesTime += Math.min(15, f.tenses.passe_compose_correct_like * 5);
  }
  if (f.tenses.futur_proche_correct_like > 0) {
    tensesTime += Math.min(10, f.tenses.futur_proche_correct_like * 5);
  }
  if (f.tenses.time_markers.length > 0) {
    tensesTime += Math.min(5, f.tenses.time_markers.length * 2);
  }
  tensesTime = Math.min(25, tensesTime);
  
  // C) Pronouns (0-25)
  let pronouns = 0;
  if (f.pronouns.le_la_les_correct_like > 0) {
    pronouns += Math.min(15, f.pronouns.le_la_les_correct_like * 5);
  }
  if (f.pronouns.lui_leur_correct_like > 0) {
    pronouns += Math.min(10, f.pronouns.lui_leur_correct_like * 5);
  }
  pronouns = Math.min(25, pronouns);
  
  // D) Questions + Modality + Negation (0-20)
  let questionsModalityNegation = 0;
  if (f.questions.clear_questions > 0) {
    questionsModalityNegation += Math.min(10, f.questions.clear_questions * 5);
  }
  if (f.modality.count > 0) {
    questionsModalityNegation += Math.min(5, f.modality.count * 2.5);
  }
  if (f.negation.count > 0) {
    questionsModalityNegation += Math.min(5, f.negation.count * 2.5);
  }
  questionsModalityNegation = Math.min(20, questionsModalityNegation);
  
  // Apply ASR quality adjustments
  const hasQualityIssue = asrQuality.flags.some(flag => flag === 'short' || flag === 'garbled');
  if (hasQualityIssue) {
    // Cap overall score at 85 if quality issues
    const overall = structureConnectors + tensesTime + pronouns + questionsModalityNegation;
    if (overall > 85) {
      const reduction = (overall - 85) * 0.5;
      structureConnectors = Math.max(0, structureConnectors - reduction * 0.3);
      tensesTime = Math.max(0, tensesTime - reduction * 0.3);
      pronouns = Math.max(0, pronouns - reduction * 0.2);
      questionsModalityNegation = Math.max(0, questionsModalityNegation - reduction * 0.2);
    }
  }
  
  const overall = structureConnectors + tensesTime + pronouns + questionsModalityNegation;
  
  return {
    structure_connectors: Math.round(structureConnectors),
    tenses_time: Math.round(tensesTime),
    pronouns: Math.round(pronouns),
    questions_modality_negation: Math.round(questionsModalityNegation),
    overall: Math.min(100, Math.max(0, Math.round(overall)))
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sessionId, 
      exerciseTranscripts, // Array of { exerciseType, audioBase64?, transcript? }
      recordingId 
    } = await req.json();

    if (!sessionId || !exerciseTranscripts || !Array.isArray(exerciseTranscripts) || !recordingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, exerciseTranscripts[], recordingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing syntax evaluation for session ${sessionId}, recording ${recordingId}`);
    console.log(`Received ${exerciseTranscripts.length} exercise transcripts`);

    // Get auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('skill_recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    // Process each exercise - transcribe if needed
    const processedTranscripts: ExerciseTranscript[] = [];
    
    for (const exercise of exerciseTranscripts) {
      let transcript = exercise.transcript;
      
      if (!transcript && exercise.audioBase64) {
        console.log(`Transcribing audio for exercise ${exercise.exerciseType}...`);
        transcript = await transcribeAudio(exercise.audioBase64, exercise.audioMimeType);
      }
      
      if (transcript) {
        processedTranscripts.push({
          exerciseType: exercise.exerciseType,
          transcript
        });
      }
    }

    // Combine all transcripts with exercise markers
    const combinedTranscript = processedTranscripts
      .map(t => `[${t.exerciseType}]\n${t.transcript}`)
      .join('\n\n');

    console.log('Combined transcript length:', combinedTranscript.length);

    // Layer A: Extract features
    const featureExtraction = await extractSyntaxFeatures(combinedTranscript);

    // Layer B: Compute scores deterministically
    const scores = computeSyntaxScores(featureExtraction.features, featureExtraction.asr_quality);

    // Calculate word count
    const wordCount = combinedTranscript.split(/\s+/).filter(w => w.length > 0).length;

    // Version tracking
    const versions = {
      prompt_version: '2026-01-15',
      scorer_version: '2026-01-15',
      asr_version: 'whisper-1'
    };

    // Update recording with results
    const { error: updateError } = await supabase
      .from('skill_recordings')
      .update({
        transcript: combinedTranscript,
        word_count: wordCount,
        ai_score: scores.overall,
        ai_feedback: featureExtraction.feedback_fr,
        ai_breakdown: {
          meta: featureExtraction.meta,
          asr_quality: featureExtraction.asr_quality,
          evidence: featureExtraction.evidence,
          features: featureExtraction.features,
          scores: scores,
          top_errors: featureExtraction.top_errors,
          feedback_fr: featureExtraction.feedback_fr,
          confidence: featureExtraction.confidence,
          exerciseTranscripts: processedTranscripts,
          versions
        },
        prompt_version: versions.prompt_version,
        scorer_version: versions.scorer_version,
        asr_version: versions.asr_version,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Failed to update recording:', updateError);
      throw updateError;
    }

    console.log(`Successfully processed syntax evaluation. Score: ${scores.overall}`);

    return new Response(
      JSON.stringify({
        success: true,
        overall: scores.overall,
        subscores: {
          structure_connectors: { score: scores.structure_connectors },
          tenses_time: { score: scores.tenses_time },
          pronouns: { score: scores.pronouns },
          questions_modality_negation: { score: scores.questions_modality_negation }
        },
        errors: featureExtraction.top_errors,
        feedback: featureExtraction.feedback_fr,
        confidence: featureExtraction.confidence,
        wordCount,
        exerciseTranscripts: processedTranscripts,
        versions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-syntax:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
