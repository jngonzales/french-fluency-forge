import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const COMPREHENSION_SCORING_PROMPT = `SCORE LISTENING COMPREHENSION FROM THE LEARNER RESPONSE. OUTPUT ONLY JSON.

BE STRICT ABOUT WHETHER THEY UNDERSTOOD THE KEY FACTS AND INTENT.

DO NOT JUDGE PRONUNCIATION OR GRAMMAR.`;

async function transcribeAudio(audioBase64: string): Promise<string> {
  console.log('Starting transcription...');
  
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const formData = new FormData();
  formData.append('file', new Blob([bytes], { type: 'audio/webm' }), 'audio.webm');
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

interface ComprehensionItem {
  context: string;
  audioScript: string;
  keyFacts: string[];
  acceptableIntents: string[];
}

async function analyzeComprehension(
  transcript: string, 
  item: ComprehensionItem
): Promise<{
  score: number;
  understoodFacts: Array<{ fact: string; ok: boolean; evidence: string }>;
  intentMatch: { ok: boolean; type: string };
  feedbackFr: string;
  confidence: number;
}> {
  console.log('Analyzing comprehension...');
  
  const userPrompt = `Context: ${item.context}

Audio script (ground truth): ${item.audioScript}

Key facts to understand: ${JSON.stringify(item.keyFacts)}

Acceptable intents: ${JSON.stringify(item.acceptableIntents)}

Learner response transcript:

${transcript}

Return:

{
  "score": 0-100,
  "understood_facts": [{"fact":"...","ok":true/false,"evidence":"..."}],
  "intent_match": {"ok":true/false,"type":"answer|question|other"},
  "feedback_fr": "1-2 supportive sentences in French",
  "confidence": 0-1
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      messages: [
        { role: 'system', content: COMPREHENSION_SCORING_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'submit_comprehension_evaluation',
            description: 'Submit the comprehension evaluation',
            parameters: {
              type: 'object',
              properties: {
                score: {
                  type: 'number',
                  description: 'Score from 0-100'
                },
                understood_facts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fact: { type: 'string' },
                      ok: { type: 'boolean' },
                      evidence: { type: 'string' }
                    },
                    required: ['fact', 'ok', 'evidence']
                  }
                },
                intent_match: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    type: { type: 'string' }
                  },
                  required: ['ok', 'type']
                },
                feedback_fr: {
                  type: 'string',
                  description: '1-2 supportive sentences in French'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence 0-1'
                }
              },
              required: ['score', 'understood_facts', 'intent_match', 'feedback_fr', 'confidence']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'submit_comprehension_evaluation' } }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI gateway error:', error);
    throw new Error(`AI analysis failed: ${error}`);
  }

  const result = await response.json();
  console.log('AI analysis result:', JSON.stringify(result).substring(0, 500));
  
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error('No tool call in AI response');
  }
  
  const args = JSON.parse(toolCall.function.arguments);
  
  return {
    score: Math.min(100, Math.max(0, args.score)),
    understoodFacts: args.understood_facts || [],
    intentMatch: args.intent_match || { ok: false, type: 'other' },
    feedbackFr: args.feedback_fr || '',
    confidence: args.confidence || 0
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      audioBase64, 
      transcript: directTranscript, 
      itemId, 
      recordingId,
      itemConfig 
    } = await req.json();

    if ((!audioBase64 && !directTranscript) || !itemId || !recordingId || !itemConfig) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing comprehension recording ${recordingId} for item ${itemId}${directTranscript ? ' (dev mode)' : ''}`);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('comprehension_recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    // Get transcript
    let transcript: string;
    if (directTranscript) {
      console.log('Using direct text input (dev mode)');
      transcript = directTranscript;
    } else {
      transcript = await transcribeAudio(audioBase64);
    }

    // Analyze comprehension
    const analysis = await analyzeComprehension(transcript, itemConfig);

    // Version tracking
    const versions = {
      prompt_version: '2026-01-04',
      scorer_version: '2026-01-04',
      asr_version: 'whisper-1'
    };

    // Update recording with results
    const { error: updateError } = await supabase
      .from('comprehension_recordings')
      .update({
        transcript,
        ai_score: analysis.score,
        ai_feedback_fr: analysis.feedbackFr,
        understood_facts: analysis.understoodFacts,
        intent_match: analysis.intentMatch,
        ai_confidence: analysis.confidence,
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

    console.log(`Successfully processed comprehension recording ${recordingId}`);

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        score: analysis.score,
        feedbackFr: analysis.feedbackFr,
        understoodFacts: analysis.understoodFacts,
        intentMatch: analysis.intentMatch,
        confidence: analysis.confidence,
        versions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-comprehension:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
