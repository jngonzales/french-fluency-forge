/**
 * Type definitions for phone-call confidence module
 */

export interface ScenarioTurn {
  turnNumber: number;
  botScript: string; // What the bot says
  expectedDuration: number; // Expected user response duration in seconds (15, 30, 45, 60)
  objective: string; // What the user should accomplish ("Express initial reaction", "Ask clarifying question")
  pushbackLevel: 'none' | 'mild' | 'strong';
}

export interface ConfidenceScenario {
  id: string;
  tier: 1 | 2 | 3;
  title: string;
  context: string; // Initial narrative/setup (user reads before call starts)
  turns: ScenarioTurn[];
  objectives: string[]; // Overall objectives for the call
}

export interface PhoneCallState {
  callId: string;
  scenarioId: string;
  currentTurnIndex: number;
  turnRecordings: TurnRecording[];
  status: 'intro' | 'in-progress' | 'completed';
}

export interface TurnRecording {
  turnNumber: number;
  transcript: string;
  wordTimestamps?: Array<{ word: string; start: number; end: number }>;
  promptEndTs: Date; // When bot finished speaking
  recordingStartTs: Date; // When user started recording
  recordingEndTs: Date; // When user stopped recording
  audioBlob?: Blob;
}

export interface ConfidenceSpeakingResult {
  callId: string;
  scenarioId: string;
  tier: number;
  scores: {
    d1_response_initiation: { score_0_5: number; confidence_0_1: number };
    d2_silence_management: { score_0_5: number; confidence_0_1: number };
    d3_ownership_assertiveness: { score_0_5: number; confidence_0_1: number };
    d4_emotional_engagement: { score_0_5: number; confidence_0_1: number };
    d5_clarity_control: { score_0_5: number; confidence_0_1: number };
    speaking_confidence_score_0_100: number;
  };
  timing_aggregates: {
    start_latency_ms_median: number;
    speech_ratio_avg: number;
    longest_silence_ms: number;
  };
  signals: {
    ownership_markers: Array<{ phrase: string; snippet: string; turn: number }>;
    low_confidence_markers: Array<{ phrase: string; snippet: string; turn: number }>;
    engagement_markers: Array<{ phrase: string; snippet: string; turn: number }>;
    structure_markers: Array<{ phrase: string; snippet: string; turn: number }>;
    repair_markers: Array<{ phrase: string; snippet: string; turn: number }>;
  };
  strengths?: Array<{ dimension: string; label: string }>;
  focus_areas?: Array<{ dimension: string; label: string }>;
  micro_drills?: Array<{
    dimension: string;
    title: string;
    instruction: string;
    duration: string;
    example?: string;
  }>;
}

