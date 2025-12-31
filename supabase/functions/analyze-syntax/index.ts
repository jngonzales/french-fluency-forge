import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYNTAX_EVALUATOR_PROMPT = `You are a strict but fair evaluator of French A2 structures. Output ONLY valid JSON.

Score the learner transcript for A2 structures. Focus on structure, not vocabulary or pronunciation.

## Important Rules
- Dropped "ne" is allowed if "pas/jamais/rien" is used correctly (common in spoken French)
- Be conservative if ASR seems uncertain
- Focus on PRACTICAL communication - minor errors that don't impede understanding are penalized less

## Subscores (Total: 100 points)

### Passé Composé (0-25 points)
- 0: No attempt at passé composé
- 10: Attempts but mostly wrong forms (wrong auxiliary, wrong agreement)
- 20: Mostly correct usage (a few minor errors acceptable)
- 25: Consistent and correct usage with proper auxiliaries and agreements

### Futur Proche (0-15 points)
- 0: No use of futur proche
- 7: 1 correct instance of "aller + infinitif"
- 12: 2+ correct instances
- 15: Consistent and natural use in context

### Pronouns - le/la/les/lui/leur (0-25 points)
- 0: No object pronouns used
- 10: Uses pronouns but often in wrong position or form
- 20: Mostly correct le/la/les + some lui/leur usage
- 25: Consistently correct pronoun choice and positioning

### Questions (0-15 points)
- 0: No questions formed
- 8: 1-2 clear questions (any method: intonation, est-ce que, inversion)
- 15: 3+ clear questions with good structure

### Connectors & Structure (0-20 points)
Award points for: et, mais, parce que, puis, donc, d'abord, ensuite, enfin
- 0-5: Single clauses only, no connectors
- 10-15: Simple chaining with basic connectors (et, mais)
- 16-20: Structured mini-argument with cause/sequence markers`;

interface TaskTranscript {
  taskId: string;
  transcript: string;
}

interface SyntaxSubscore {
  score: number;
  evidence: string[];
}

interface SyntaxError {
  type: string;
  example: string;
  fix_hint_fr: string;
}

interface SyntaxEvaluation {
  overall: number;
  subs: {
    passe_compose: SyntaxSubscore;
    futur_proche: SyntaxSubscore;
    pronouns: SyntaxSubscore;
    questions: SyntaxSubscore;
    connectors_structure: SyntaxSubscore;
  };
  errors_top3: SyntaxError[];
  confidence: number;
}

async function transcribeAudio(audioBase64: string, audioMimeType?: string): Promise<string> {
  console.log('Starting transcription...');
  console.log('Audio MIME type:', audioMimeType || 'not provided, defaulting to audio/webm');
  
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Detect format from MIME type or default to webm
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

async function evaluateSyntax(combinedTranscript: string): Promise<SyntaxEvaluation> {
  console.log('Evaluating syntax with LLM...');
  
  const userPrompt = `## Task Context
The learner completed 5 micro-tasks designed to elicit specific A2 structures:

1. **S1 - Past Story**: Asked to describe 3 things they did last weekend (targets: passé composé)
2. **S2 - Plans**: Asked about tonight's plans with 3 actions (targets: futur proche)  
3. **S3 - Object Pronouns**: Rapid-fire questions requiring le/la/les/lui/leur responses
4. **S4 - Ask Questions**: Role-play asking 3 questions to a shopkeeper
5. **S5 - Reasons + Comparison**: Compare city vs countryside with reasons (targets: parce que, comparatives)

Evaluate the combined transcript from all tasks. Each subscore maps to specific task(s):
- passé_composé → mainly S1
- futur_proche → mainly S2
- pronouns → mainly S3
- questions → mainly S4
- connectors_structure → mainly S5, but can appear anywhere

Transcript:
${combinedTranscript}

Return JSON in this exact format:
{
  "overall": <0-100 total score>,
  "subs": {
    "passe_compose": {"score": <0-25>, "evidence": ["<quote1>", "<quote2>"]},
    "futur_proche": {"score": <0-15>, "evidence": ["<quote1>"]},
    "pronouns": {"score": <0-25>, "evidence": ["<quote1>"]},
    "questions": {"score": <0-15>, "evidence": ["<quote1>"]},
    "connectors_structure": {"score": <0-20>, "evidence": ["<quote1>"]}
  },
  "errors_top3": [
    {"type": "<error category>", "example": "<from transcript>", "fix_hint_fr": "<correction in French>"}
  ],
  "confidence": <0-1 your confidence in this evaluation>
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYNTAX_EVALUATOR_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`LLM evaluation failed: ${error}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in LLM response');
  }

  console.log('LLM evaluation result:', content.substring(0, 500));
  
  const evaluation = JSON.parse(content) as SyntaxEvaluation;
  
  // Validate and clamp scores
  evaluation.overall = Math.min(100, Math.max(0, evaluation.overall));
  if (evaluation.subs) {
    evaluation.subs.passe_compose.score = Math.min(25, Math.max(0, evaluation.subs.passe_compose.score));
    evaluation.subs.futur_proche.score = Math.min(15, Math.max(0, evaluation.subs.futur_proche.score));
    evaluation.subs.pronouns.score = Math.min(25, Math.max(0, evaluation.subs.pronouns.score));
    evaluation.subs.questions.score = Math.min(15, Math.max(0, evaluation.subs.questions.score));
    evaluation.subs.connectors_structure.score = Math.min(20, Math.max(0, evaluation.subs.connectors_structure.score));
  }
  
  return evaluation;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sessionId, 
      taskTranscripts, // Array of { taskId, audioBase64?, transcript? }
      recordingId 
    } = await req.json();

    if (!sessionId || !taskTranscripts || !Array.isArray(taskTranscripts) || !recordingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, taskTranscripts[], recordingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing syntax evaluation for session ${sessionId}, recording ${recordingId}`);
    console.log(`Received ${taskTranscripts.length} task transcripts`);

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

    // Process each task - transcribe if needed
    const processedTranscripts: TaskTranscript[] = [];
    
    for (const task of taskTranscripts) {
      let transcript = task.transcript;
      
      if (!transcript && task.audioBase64) {
        console.log(`Transcribing audio for task ${task.taskId}...`);
        transcript = await transcribeAudio(task.audioBase64, task.audioMimeType);
      }
      
      if (transcript) {
        processedTranscripts.push({
          taskId: task.taskId,
          transcript
        });
      }
    }

    // Combine all transcripts with task labels
    const combinedTranscript = processedTranscripts
      .map(t => `[Task ${t.taskId}]\n${t.transcript}`)
      .join('\n\n');

    console.log('Combined transcript length:', combinedTranscript.length);

    // Evaluate with LLM
    const evaluation = await evaluateSyntax(combinedTranscript);

    // Calculate word count
    const wordCount = combinedTranscript.split(/\s+/).filter(w => w.length > 0).length;

    // Generate feedback summary
    const feedbackParts: string[] = [];
    
    if (evaluation.subs.passe_compose.score >= 20) {
      feedbackParts.push('Good use of passé composé.');
    } else if (evaluation.subs.passe_compose.score < 10) {
      feedbackParts.push('Practice passé composé formation.');
    }
    
    if (evaluation.subs.pronouns.score >= 20) {
      feedbackParts.push('Strong pronoun usage.');
    } else if (evaluation.subs.pronouns.score < 10) {
      feedbackParts.push('Work on object pronoun placement.');
    }
    
    if (evaluation.errors_top3 && evaluation.errors_top3.length > 0) {
      feedbackParts.push(`Top error: ${evaluation.errors_top3[0].type}`);
    }

    const feedback = feedbackParts.join(' ') || 'Keep practicing A2 structures!';

    // Update recording with results
    const { error: updateError } = await supabase
      .from('skill_recordings')
      .update({
        transcript: combinedTranscript,
        word_count: wordCount,
        ai_score: evaluation.overall,
        ai_feedback: feedback,
        ai_breakdown: {
          subscores: evaluation.subs,
          errors: evaluation.errors_top3,
          confidence: evaluation.confidence,
          taskTranscripts: processedTranscripts
        },
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Failed to update recording:', updateError);
      throw updateError;
    }

    console.log(`Successfully processed syntax evaluation. Score: ${evaluation.overall}`);

    return new Response(
      JSON.stringify({
        success: true,
        overall: evaluation.overall,
        subscores: evaluation.subs,
        errors: evaluation.errors_top3,
        confidence: evaluation.confidence,
        feedback,
        wordCount,
        taskTranscripts: processedTranscripts
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
