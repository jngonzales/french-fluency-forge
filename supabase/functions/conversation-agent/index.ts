import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const AGENT_SYSTEM_PROMPT = `You are a friendly French conversation partner for an A2 learner.
Constraints:
- Use short sentences, A2 vocabulary, and clear questions.
- Speak naturally but not fast.
- Ask ONE question per turn.
- Include exactly one moment of mild misunderstanding so the learner can repair.
- Never correct grammar explicitly. Keep conversation going.`;

const SCORING_SYSTEM_PROMPT = `You are scoring an A2-level French conversation. Output ONLY JSON.
Do not reward fancy vocabulary. Reward understanding, repair, and staying on topic.
False starts/repetitions are NOT penalized.`;

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

interface ConversationMessage {
  role: 'agent' | 'user';
  content: string;
}

interface ScenarioConfig {
  title: string;
  goal: string;
  slots: Record<string, string | null>;
}

async function getAgentResponse(
  conversationHistory: ConversationMessage[],
  scenario: ScenarioConfig,
  turnNumber: number
): Promise<string> {
  console.log(`Getting agent response for turn ${turnNumber}...`);
  
  const scenarioBrief = `${scenario.title}\nGoal: ${scenario.goal}`;
  const systemPrompt = AGENT_SYSTEM_PROMPT + `\n\nScenario:\n${scenarioBrief}\n\nState to track (slots JSON):\n${JSON.stringify(scenario.slots)}\n\nThis is turn ${turnNumber}. Keep the conversation moving naturally.`;
  
  // Convert to OpenAI format
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.content
    }))
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 150,
      temperature: 0.8
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI gateway error:', error);
    throw new Error(`Agent response failed: ${error}`);
  }

  const result = await response.json();
  const agentMessage = result.choices?.[0]?.message?.content || '';
  console.log('Agent response:', agentMessage.substring(0, 100));
  return agentMessage;
}

async function scoreConversation(
  conversationHistory: ConversationMessage[],
  goal: string
): Promise<{
  overall: number;
  subs: {
    comprehension_task: { score: number; evidence: string[] };
    repair: { score: number; evidence: string[] };
    flow: { score: number; evidence: string[] };
  };
  flags: string[];
  confidence: number;
}> {
  console.log('Scoring conversation...');
  
  const turnByTurn = conversationHistory
    .map(t => `${t.role === 'agent' ? 'Agent' : 'User'}: ${t.content}`)
    .join('\n');
  
  const userPrompt = `Score:
- comprehension_task (0-45)
- repair (0-30)
- flow (0-25)

Return JSON:
{
  "overall": 0-100,
  "subs": {
    "comprehension_task": {"score":0-45,"evidence":[]},
    "repair": {"score":0-30,"evidence":[]},
    "flow": {"score":0-25,"evidence":[]}
  },
  "flags": [],
  "confidence": 0-1
}

Scenario goal:
${goal}

Conversation (turn by turn):
${turnByTurn}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'submit_conversation_score',
            description: 'Submit the conversation scoring results',
            parameters: {
              type: 'object',
              properties: {
                overall: { type: 'number', description: 'Overall score 0-100' },
                subs: {
                  type: 'object',
                  properties: {
                    comprehension_task: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                        evidence: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['score', 'evidence']
                    },
                    repair: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                        evidence: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['score', 'evidence']
                    },
                    flow: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                        evidence: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['score', 'evidence']
                    }
                  },
                  required: ['comprehension_task', 'repair', 'flow']
                },
                flags: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number' }
              },
              required: ['overall', 'subs', 'flags', 'confidence']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'submit_conversation_score' } }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Scoring error:', error);
    throw new Error(`Scoring failed: ${error}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error('No tool call in scoring response');
  }
  
  const args = JSON.parse(toolCall.function.arguments);
  console.log('Scoring complete:', args.overall);
  return args;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      audioBase64, 
      transcript: directTranscript,
      conversationHistory,
      scenario,
      turnNumber,
      recordingId 
    } = await req.json();

    console.log(`Conversation action: ${action}`);

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

    if (action === 'transcribe') {
      // Just transcribe user audio
      let transcript: string;
      if (directTranscript) {
        transcript = directTranscript;
      } else if (audioBase64) {
        transcript = await transcribeAudio(audioBase64);
      } else {
        return new Response(
          JSON.stringify({ error: 'No audio or transcript provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, transcript }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'agent_turn') {
      // Get AI agent's next response
      if (!conversationHistory || !scenario) {
        return new Response(
          JSON.stringify({ error: 'Missing conversation history or scenario' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const agentResponse = await getAgentResponse(
        conversationHistory,
        scenario,
        turnNumber || conversationHistory.length
      );
      
      return new Response(
        JSON.stringify({ success: true, agentResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'score') {
      // Score the full conversation
      if (!conversationHistory || !scenario || !recordingId) {
        return new Response(
          JSON.stringify({ error: 'Missing conversation history, scenario, or recordingId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scoring = await scoreConversation(conversationHistory, scenario.goal);
      
      // Update the recording in the database
      const { error: updateError } = await supabase
        .from('skill_recordings')
        .update({
          transcript: conversationHistory.map((m: ConversationMessage) => `${m.role}: ${m.content}`).join('\n'),
          ai_score: scoring.overall,
          ai_feedback: JSON.stringify(scoring.subs),
          ai_breakdown: scoring.subs,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', recordingId);

      if (updateError) {
        console.error('Failed to update recording:', updateError);
        throw updateError;
      }
      
      return new Response(
        JSON.stringify({ success: true, scoring }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in conversation-agent:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
