-- Migration: Confidence Phone Call System
-- Adds tables for phone-call style confidence assessment with turn-by-turn tracking

-- Store phone call scenario attempts
CREATE TABLE IF NOT EXISTS confidence_phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_confidence_phone_calls_session ON confidence_phone_calls(session_id);
CREATE INDEX idx_confidence_phone_calls_user ON confidence_phone_calls(user_id);
CREATE INDEX idx_confidence_phone_calls_scenario ON confidence_phone_calls(scenario_id);

-- Store per-turn recordings with timing
CREATE TABLE IF NOT EXISTS confidence_phone_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES confidence_phone_calls(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  prompt_end_ts TIMESTAMPTZ NOT NULL, -- When bot finished speaking
  user_speech_start_ts TIMESTAMPTZ, -- When user started speaking (recording start + first word)
  user_speech_end_ts TIMESTAMPTZ, -- When user finished speaking (recording end)
  recording_start_ts TIMESTAMPTZ NOT NULL, -- Actual recording start time
  recording_end_ts TIMESTAMPTZ NOT NULL, -- Actual recording end time
  transcript TEXT,
  word_timestamps JSONB, -- Whisper word-level data: [{word: "hello", start: 0.1, end: 0.5}, ...]
  metrics JSONB, -- Turn-level metrics: {start_latency_ms, speech_ms, silence_ms, speech_ratio, longest_silence_ms, silence_count, pauses}
  audio_blob_url TEXT, -- Optional: URL to stored audio blob
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(call_id, turn_number)
);

-- Add index for turn retrieval
CREATE INDEX idx_confidence_phone_turns_call ON confidence_phone_turns(call_id);

-- Store final analysis results
CREATE TABLE IF NOT EXISTS confidence_speaking_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES confidence_phone_calls(id) ON DELETE CASCADE UNIQUE,
  -- D1-D5 scores (0-5)
  d1_score INTEGER CHECK (d1_score >= 0 AND d1_score <= 5),
  d2_score INTEGER CHECK (d2_score >= 0 AND d2_score <= 5),
  d3_score INTEGER CHECK (d3_score >= 0 AND d3_score <= 5),
  d4_score INTEGER CHECK (d4_score >= 0 AND d4_score <= 5),
  d5_score INTEGER CHECK (d5_score >= 0 AND d5_score <= 5),
  -- Overall score (0-100)
  speaking_confidence_score INTEGER CHECK (speaking_confidence_score >= 0 AND speaking_confidence_score <= 100),
  -- Aggregate timing metrics
  timing_aggregates JSONB, -- {start_latency_ms_median, speech_ratio_avg, longest_silence_ms, etc.}
  -- Detected confidence signals with evidence
  signals JSONB, -- {ownership_markers: [{phrase, snippet, turn}], low_confidence_markers: [...], ...}
  -- Strengths (2-3 items)
  strengths JSONB, -- [{dimension: "D2", label: "You kept speaking with limited long silences."}]
  -- Focus areas (1-2 items)
  focus_areas JSONB, -- [{dimension: "D3", label: "Make one clear request earlier.", micro_drill: "..."}]
  -- Micro-drills
  micro_drills JSONB, -- [{dimension: "D1", title: "Instant Opener", instruction: "...", duration: "20-30s", example: "..."}]
  -- Learner message (optional summary)
  learner_message TEXT,
  -- Version tracking
  versions JSONB, -- {prompt_version, scorer_version, asr_version}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for analysis retrieval
CREATE INDEX idx_confidence_speaking_analysis_call ON confidence_speaking_analysis(call_id);

-- Enable Row Level Security
ALTER TABLE confidence_phone_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_phone_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_speaking_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- confidence_phone_calls policies
CREATE POLICY "Users can view own phone calls"
  ON confidence_phone_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone calls"
  ON confidence_phone_calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone calls"
  ON confidence_phone_calls FOR UPDATE
  USING (auth.uid() = user_id);

-- confidence_phone_turns policies
CREATE POLICY "Users can view own turns"
  ON confidence_phone_turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM confidence_phone_calls
      WHERE confidence_phone_calls.id = confidence_phone_turns.call_id
      AND confidence_phone_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own turns"
  ON confidence_phone_turns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM confidence_phone_calls
      WHERE confidence_phone_calls.id = confidence_phone_turns.call_id
      AND confidence_phone_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own turns"
  ON confidence_phone_turns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM confidence_phone_calls
      WHERE confidence_phone_calls.id = confidence_phone_turns.call_id
      AND confidence_phone_calls.user_id = auth.uid()
    )
  );

-- confidence_speaking_analysis policies
CREATE POLICY "Users can view own analysis"
  ON confidence_speaking_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM confidence_phone_calls
      WHERE confidence_phone_calls.id = confidence_speaking_analysis.call_id
      AND confidence_phone_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analysis"
  ON confidence_speaking_analysis FOR INSERT
  WITH CHECK (true); -- Service role can insert

CREATE POLICY "Users can view their analysis"
  ON confidence_speaking_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM confidence_phone_calls
      WHERE confidence_phone_calls.id = confidence_speaking_analysis.call_id
      AND confidence_phone_calls.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE confidence_phone_calls IS 'Phone call scenario attempts for confidence assessment';
COMMENT ON TABLE confidence_phone_turns IS 'Individual turn recordings with timing data';
COMMENT ON TABLE confidence_speaking_analysis IS 'Final D1-D5 analysis results with drills and feedback';

