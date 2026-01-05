import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  cardId: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  config: {
    request_retention: number;
    learning_steps: string[];
    relearning_steps: string[];
    enable_fuzz: boolean;
    enable_short_term: boolean;
  };
  timing: {
    startTime: string;
    revealTime?: string;
    rateTime: string;
  };
}

// Update assist level based on rating
function updateAssistLevel(currentLevel: number, rating: string): number {
  if (rating === 'again') {
    return Math.min(currentLevel + 1, 4);
  } else if (rating === 'good') {
    return Math.max(currentLevel - 1, 0);
  } else if (rating === 'easy') {
    return 0;
  }
  // 'hard' - no change
  return currentLevel;
}

// Update struggle counters
function updateStruggleCounters(
  card: any,
  rating: string,
  now: Date
): {
  consecutive_again: number;
  again_count_24h: number;
  again_count_7d: number;
} {
  let consecutive_again = card.consecutive_again || 0;
  let again_count_24h = card.again_count_24h || 0;
  let again_count_7d = card.again_count_7d || 0;

  if (rating === 'again') {
    consecutive_again += 1;
    
    // Check 24h window
    const lastReview24h = card.last_reviewed_at
      ? new Date(card.last_reviewed_at)
      : null;
    if (!lastReview24h || (now.getTime() - lastReview24h.getTime()) < 24 * 60 * 60 * 1000) {
      again_count_24h += 1;
    } else {
      again_count_24h = 1; // Reset if outside window
    }
    
    // Check 7d window
    const lastReview7d = card.last_reviewed_at
      ? new Date(card.last_reviewed_at)
      : null;
    if (!lastReview7d || (now.getTime() - lastReview7d.getTime()) < 7 * 24 * 60 * 60 * 1000) {
      again_count_7d += 1;
    } else {
      again_count_7d = 1; // Reset if outside window
    }
  } else {
    // Reset consecutive on success
    consecutive_again = 0;
  }

  return {
    consecutive_again,
    again_count_24h,
    again_count_7d,
  };
}

// Check if struggle threshold reached
function checkStruggleThreshold(
  consecutive_again: number,
  again_count_24h: number
): boolean {
  return consecutive_again >= 5 || again_count_24h >= 5;
}

// Calculate next review (simplified - in production would use FSRS library)
function calculateNextReview(
  card: any,
  rating: string,
  config: RequestBody['config'],
  now: Date
): {
  due_at: string;
  interval_ms: number;
  scheduler_state: string;
  short_term_step_index?: number;
} {
  const cardState = card.scheduler_state || card.scheduler?.state || 'new';
  const isNew = cardState === 'new';
  const isRelearning = cardState === 'relearning';
  const isLearning = cardState === 'learning';
  
  // Handle short-term steps
  if (config.enable_short_term) {
    if (rating === 'again' && (isNew || isRelearning)) {
      const steps = isNew ? config.learning_steps : config.relearning_steps;
      const firstStepMs = parseTimeString(steps[0]);
      return {
        due_at: new Date(now.getTime() + firstStepMs).toISOString(),
        interval_ms: firstStepMs,
        scheduler_state: isNew ? 'learning' : 'relearning',
        short_term_step_index: 0,
      };
    }
    
    // If in learning/relearning and rating is good/easy, advance step
    if ((isLearning || isRelearning) && (rating === 'good' || rating === 'easy')) {
      const steps = isLearning ? config.learning_steps : config.relearning_steps;
      const currentStepIndex = card.short_term_step_index || 0;
      
      if (currentStepIndex < steps.length - 1) {
        const nextStepMs = parseTimeString(steps[currentStepIndex + 1]);
        return {
          due_at: new Date(now.getTime() + nextStepMs).toISOString(),
          interval_ms: nextStepMs,
          scheduler_state: cardState,
          short_term_step_index: currentStepIndex + 1,
        };
      } else {
        // Graduate to review
        const intervalDays = rating === 'easy' ? 7 : 3;
        const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
        return {
          due_at: new Date(now.getTime() + intervalMs).toISOString(),
          interval_ms,
          scheduler_state: 'review',
          short_term_step_index: undefined,
        };
      }
    }
  }
  
  // Default: use simple interval calculation
  const currentIntervalMs = card.interval_ms || 0;
  const currentIntervalDays = currentIntervalMs / (24 * 60 * 60 * 1000);
  
  let newIntervalDays = 0;
  let newState = cardState;
  
  if (rating === 'again') {
    newIntervalDays = 1;
    newState = currentIntervalDays === 0 ? 'learning' : 'relearning';
  } else if (rating === 'hard') {
    newIntervalDays = currentIntervalDays === 0 ? 1 : currentIntervalDays * 1.2;
    newState = newIntervalDays >= 21 ? 'review' : 'learning';
  } else if (rating === 'good') {
    newIntervalDays = currentIntervalDays === 0 ? 3 : currentIntervalDays * 2.5;
    newState = newIntervalDays >= 21 ? 'review' : 'learning';
  } else if (rating === 'easy') {
    newIntervalDays = currentIntervalDays === 0 ? 7 : currentIntervalDays * 3.0;
    newState = 'review';
  }
  
  const intervalMs = Math.round(newIntervalDays * 24 * 60 * 60 * 1000);
  
  return {
    due_at: new Date(now.getTime() + intervalMs).toISOString(),
    interval_ms: intervalMs,
    scheduler_state: newState,
    short_term_step_index: newState === 'review' ? undefined : card.short_term_step_index,
  };
}

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // Parse request body
    const body: RequestBody = await req.json();
    const { cardId, rating, config, timing } = body;

    if (!cardId || !rating || !config || !timing) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();

    // Load card from database
    const { data: card, error: cardError } = await supabase
      .from('member_phrase_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ success: false, error: 'Card not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate next review
    const nextReview = calculateNextReview(card, rating, config, now);

    // Update assist level
    const currentAssistLevel = card.assist_level || 0;
    const newAssistLevel = updateAssistLevel(currentAssistLevel, rating);

    // Update struggle counters
    const struggleCounters = updateStruggleCounters(card, rating, now);
    const shouldPause = checkStruggleThreshold(
      struggleCounters.consecutive_again,
      struggleCounters.again_count_24h
    );

    // Prepare card update
    const cardUpdate: any = {
      scheduler_state: nextReview.scheduler_state,
      due_at: nextReview.due_at,
      interval_ms: nextReview.interval_ms,
      last_reviewed_at: now.toISOString(),
      assist_level: newAssistLevel,
      consecutive_again: struggleCounters.consecutive_again,
      again_count_24h: struggleCounters.again_count_24h,
      again_count_7d: struggleCounters.again_count_7d,
      reviews: (card.reviews || 0) + 1,
      updated_at: now.toISOString(),
    };

    if (nextReview.short_term_step_index !== undefined) {
      cardUpdate.short_term_step_index = nextReview.short_term_step_index;
    }

    if (rating === 'again') {
      cardUpdate.lapses = (card.lapses || 0) + 1;
    }

    // Auto-pause if struggling
    if (shouldPause) {
      cardUpdate.status = 'suspended';
      cardUpdate.paused_reason = 'struggling';
      cardUpdate.paused_at = now.toISOString();

      // Create struggle event
      await supabase.from('phrase_struggle_events').insert({
        member_id: card.member_id,
        phrase_id: card.phrase_id,
        card_id: card.id,
        trigger: struggleCounters.consecutive_again >= 5
          ? 'consecutive_5'
          : 'again_5_in_24h',
      });
    }

    // Update card
    const { data: updatedCard, error: updateError } = await supabase
      .from('member_phrase_cards')
      .update(cardUpdate)
      .eq('id', cardId)
      .select()
      .single();

    if (updateError) {
      console.error('[phrases-review-commit] Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update card' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create review log
    const responseTimeMs = timing.revealTime
      ? new Date(timing.revealTime).getTime() - new Date(timing.startTime).getTime()
      : undefined;

    const wasOverdue = new Date(card.due_at || card.scheduler?.due_at) < now;
    const overdueMs = wasOverdue
      ? now.getTime() - new Date(card.due_at || card.scheduler?.due_at).getTime()
      : undefined;

    const elapsedMs = card.last_reviewed_at
      ? now.getTime() - new Date(card.last_reviewed_at).getTime()
      : undefined;

    await supabase.from('phrase_review_logs').insert({
      member_id: card.member_id,
      phrase_id: card.phrase_id,
      card_id: card.id,
      started_at: timing.startTime,
      revealed_at: timing.revealTime,
      rated_at: timing.rateTime,
      rating,
      response_time_ms: responseTimeMs,
      mode: 'recall', // TODO: get from phrase
      state_before: card.scheduler_state || card.scheduler?.state || 'new',
      state_after: nextReview.scheduler_state,
      due_before: card.due_at || card.scheduler?.due_at || now.toISOString(),
      due_after: nextReview.due_at,
      interval_before_ms: card.interval_ms,
      interval_after_ms: nextReview.interval_ms,
      was_overdue: wasOverdue,
      overdue_ms,
      elapsed_ms,
      speech_used: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        card: updatedCard,
        paused: shouldPause,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[phrases-review-commit] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

