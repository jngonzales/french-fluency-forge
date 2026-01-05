import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntervalPreview {
  due_at: string;
  interval_ms: number;
  label: string;
}

interface RequestBody {
  card: {
    id: string;
    scheduler: {
      state: string;
      due_at: string;
      stability?: number;
      difficulty?: number;
      interval_ms?: number;
      scheduler_state_jsonb?: any;
    };
    reviews: number;
    lapses: number;
  };
  now: string;
  config: {
    request_retention: number;
    learning_steps: string[];
    relearning_steps: string[];
    enable_fuzz: boolean;
    enable_short_term: boolean;
  };
}

// Parse time string to milliseconds
function parseTimeString(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time string: ${timeStr}`);
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown time unit: ${unit}`);
  }
}

// Format interval for display
function formatInterval(intervalMs: number): string {
  if (intervalMs < 0) return 'overdue';
  if (intervalMs < 1000) return 'now';
  if (intervalMs < 60 * 1000) return `${Math.round(intervalMs / 1000)}s`;
  if (intervalMs < 60 * 60 * 1000) return `${Math.round(intervalMs / (60 * 1000))}m`;
  if (intervalMs < 24 * 60 * 60 * 1000) return `${Math.round(intervalMs / (60 * 60 * 1000))}h`;
  const days = Math.round(intervalMs / (24 * 60 * 60 * 1000));
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

// Calculate preview for a rating
function calculatePreview(
  card: RequestBody['card'],
  rating: 'again' | 'hard' | 'good' | 'easy',
  config: RequestBody['config'],
  now: Date
): IntervalPreview {
  const cardState = card.scheduler.state;
  const isNew = cardState === 'new';
  const isRelearning = cardState === 'relearning';
  const isLearning = cardState === 'learning';
  
  // Handle short-term steps
  if (config.enable_short_term) {
    if (rating === 'again' && (isNew || isRelearning)) {
      const steps = isNew ? config.learning_steps : config.relearning_steps;
      const firstStepMs = parseTimeString(steps[0]);
      const dueAt = new Date(now.getTime() + firstStepMs);
      return {
        due_at: dueAt.toISOString(),
        interval_ms: firstStepMs,
        label: formatInterval(firstStepMs),
      };
    }
    
    // If in learning/relearning and rating is good/easy, advance step
    if ((isLearning || isRelearning) && (rating === 'good' || rating === 'easy')) {
      const steps = isLearning ? config.learning_steps : config.relearning_steps;
      const currentStepIndex = (card.scheduler as any).short_term_step_index || 0;
      
      if (currentStepIndex < steps.length - 1) {
        const nextStepMs = parseTimeString(steps[currentStepIndex + 1]);
        const dueAt = new Date(now.getTime() + nextStepMs);
        return {
          due_at: dueAt.toISOString(),
          interval_ms: nextStepMs,
          label: formatInterval(nextStepMs),
        };
      }
    }
  }
  
  // Default: use FSRS-like calculation (simplified for preview)
  // In production, this would use the actual FSRS library
  const currentIntervalMs = card.scheduler.interval_ms || 0;
  const currentIntervalDays = currentIntervalMs / (24 * 60 * 60 * 1000);
  
  let newIntervalDays = 0;
  
  if (rating === 'again') {
    newIntervalDays = 1;
  } else if (rating === 'hard') {
    newIntervalDays = currentIntervalDays === 0 ? 1 : currentIntervalDays * 1.2;
  } else if (rating === 'good') {
    newIntervalDays = currentIntervalDays === 0 ? 3 : currentIntervalDays * 2.5;
  } else if (rating === 'easy') {
    newIntervalDays = currentIntervalDays === 0 ? 7 : currentIntervalDays * 3.0;
  }
  
  const intervalMs = Math.round(newIntervalDays * 24 * 60 * 60 * 1000);
  const dueAt = new Date(now.getTime() + intervalMs);
  
  return {
    due_at: dueAt.toISOString(),
    interval_ms: intervalMs,
    label: formatInterval(intervalMs),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { card, now: nowStr, config } = body;

    if (!card || !nowStr || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date(nowStr);

    // Calculate previews for all ratings
    const intervals = {
      again: calculatePreview(card, 'again', config, now),
      hard: calculatePreview(card, 'hard', config, now),
      good: calculatePreview(card, 'good', config, now),
      easy: calculatePreview(card, 'easy', config, now),
    };

    return new Response(
      JSON.stringify({
        success: true,
        intervals,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('[phrases-schedule-preview] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

