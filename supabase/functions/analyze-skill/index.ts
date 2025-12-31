import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const CONFIDENCE_PROMPT = `You are a French language evaluator. Your task is to assess how confidently the student communicates in informal spoken French.

You are NOT judging grammar or accuracy. You are evaluating confidence: how much the speaker asserts their views, expresses emotion or vulnerability, and carries the conversation with clarity and energy.

Use the criteria below. Assign a score for each section, compute a total score (out of 100).

# Scoring Criteria

## 1. Length & Development (0–25 points)
- 0 pts: Very short, hesitant, or clipped replies (under 50 words)
- 10 pts: Some development (1–2 short paragraphs, 50–100 words)
- 20 pts: Fully developed (100–200 words)
- 25 pts: Very expressive, >200 words with expansion, examples, and elaboration

## 2. Assertiveness & Ownership (0–25 points)
Look for strong personal positioning. Award points for use of:
- "Moi je pense…"
- "Franchement…"
- "Je vais te dire…"
- "Ce que j'adore…"
- Confident tone, opinions stated directly
- First-person perspective without hedging or apology
- High score if the speaker leads the exchange instead of reacting passively

## 3. Emotional Engagement (0–20 points)
How openly does the speaker express emotion, vulnerability, humor, or personal experience?
- 0–5: Neutral, purely factual, or mechanical
- 10: Some feeling or anecdote
- 20: Vulnerability, humor, personal stories, or expressive emotional tone

## 4. Clarity & Control (0–15 points)
- Clear progression of ideas
- Speaker seems in control, not rambling or self-doubting
- Knows what they want to say and communicates it smoothly

## 5. Linguistic Confidence Signals (0–15 points)
Award 3 points each for confident expressions like:
- "Franchement…"
- "Je vais être honnête…"
- "Le truc, c'est que…"
- "Moi, je pense que…"
- "Ce que j'adore, c'est…"

Do NOT subtract points for grammar mistakes, hesitation words (euh…), or accent.`;

const SYNTAX_PROMPT = `You are a French language evaluator. Your task is to assess the grammatical accuracy and syntactic complexity of the student's spoken French.

Evaluate based on:

## 1. Verb Conjugation Accuracy (0–25 points)
- Correct tense usage (present, passé composé, imparfait, conditional, future)
- Subject-verb agreement
- Proper auxiliary selection (être vs avoir)

## 2. Sentence Structure Complexity (0–25 points)
- Simple sentences only: 0-10 pts
- Compound sentences with connectors (et, mais, parce que): 10-18 pts
- Complex sentences with subordinate clauses (qui, que, dont, où): 18-25 pts

## 3. Gender & Agreement (0–20 points)
- Noun-adjective agreement
- Article accuracy (le, la, les, un, une, des)
- Pronoun usage

## 4. Preposition & Article Contraction (0–15 points)
- Correct preposition choice (à, de, pour, avec, etc.)
- Proper contractions (au, aux, du, des)

## 5. Word Order & Negation (0–15 points)
- Proper French word order (especially with pronouns)
- Correct negation structure (ne...pas, ne...jamais, ne...rien)

Focus on PRACTICAL communication. Minor errors that don't impede understanding should be penalized less than errors that cause confusion.`;

const CONVERSATION_PROMPT = `You are a French language evaluator. Your task is to assess the student's conversational skills, including comprehension and how they handle misunderstanding.

## Comprehension Assessment (0-50 points)

Evaluate how well the student understood and responded to the prompt:

- 45-50 pts: Understood correctly and answered sensibly with relevant, on-topic response
- 35-44 pts: Got the gist but slightly off, answered broadly in line with the topic
- 25-34 pts: Didn't fully understand but used good repair strategies (see below)
- 15-24 pts: Said something short and not useful like "je ne comprends pas" without elaboration
- 0-14 pts: Didn't understand and said nothing, or answered completely off-topic

## Misunderstanding Handling (0-30 points)

If the student showed signs of not understanding, assess their repair strategies:

INCREASE score for phrases like:
- "Pardon, vous voulez dire que… ?"
- "Je crois que j'ai compris la première partie, mais pas la suite."
- "Je ne suis pas sûr de ce que vous entendez par X… vous pouvez expliquer ?"
- "Vous pouvez reformuler ça ?"
- "J'ai compris jusqu'à X, mais après j'ai décroché."

DECREASE score for:
- "Hein ?"
- "Je sais pas."
- No response after a complex question
- Answering completely off-topic
- Ignoring the confusion and changing subject

## Conversational Flow (0-20 points)
- Natural turn-taking signals
- Appropriate length of response
- Engagement with the topic
- Use of discourse markers (bon, alors, enfin, bref, etc.)`;

async function transcribeAudio(audioBase64: string): Promise<string> {
  console.log('Starting transcription...');
  
  // Convert base64 to blob
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

async function analyzeWithAI(transcript: string, moduleType: string, promptText: string): Promise<{
  score: number;
  feedback: string;
  breakdown: Record<string, number>;
}> {
  console.log(`Analyzing ${moduleType} with AI...`);
  
  let systemPrompt = '';
  switch (moduleType) {
    case 'confidence':
      systemPrompt = CONFIDENCE_PROMPT;
      break;
    case 'syntax':
      systemPrompt = SYNTAX_PROMPT;
      break;
    case 'conversation':
      systemPrompt = CONVERSATION_PROMPT;
      break;
    default:
      throw new Error(`Unknown module type: ${moduleType}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `The prompt given to the student was: "${promptText}"

The student's response (transcribed from audio):
"${transcript}"

Analyze this response and provide your evaluation.`
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'submit_evaluation',
            description: 'Submit the evaluation scores and feedback',
            parameters: {
              type: 'object',
              properties: {
                total_score: {
                  type: 'number',
                  description: 'Total score out of 100'
                },
                feedback: {
                  type: 'string',
                  description: '2-3 sentences of feedback in English explaining what the student did well and what could be improved'
                },
                breakdown: {
                  type: 'object',
                  description: 'Score breakdown by category',
                  additionalProperties: {
                    type: 'number'
                  }
                }
              },
              required: ['total_score', 'feedback', 'breakdown']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'submit_evaluation' } }
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
    score: Math.min(100, Math.max(0, args.total_score)),
    feedback: args.feedback,
    breakdown: args.breakdown
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, transcript: directTranscript, moduleType, itemId, promptText, recordingId } = await req.json();

    // Either audioBase64 or directTranscript is required
    if ((!audioBase64 && !directTranscript) || !moduleType || !itemId || !promptText || !recordingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${moduleType} recording ${recordingId}${directTranscript ? ' (dev mode - text input)' : ''}`);

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

    // Use direct transcript if provided (dev mode), otherwise transcribe audio
    let transcript: string;
    if (directTranscript) {
      console.log('Using direct text input (dev mode)');
      transcript = directTranscript;
    } else {
      transcript = await transcribeAudio(audioBase64);
    }
    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

    // Analyze with AI
    const analysis = await analyzeWithAI(transcript, moduleType, promptText);

    // Update recording with results
    const { error: updateError } = await supabase
      .from('skill_recordings')
      .update({
        transcript,
        word_count: wordCount,
        ai_score: analysis.score,
        ai_feedback: analysis.feedback,
        ai_breakdown: analysis.breakdown,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Failed to update recording:', updateError);
      throw updateError;
    }

    console.log(`Successfully processed ${moduleType} recording ${recordingId}`);

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        wordCount,
        score: analysis.score,
        feedback: analysis.feedback,
        breakdown: analysis.breakdown
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-skill:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
