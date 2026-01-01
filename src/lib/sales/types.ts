/**
 * Sales Copilot Types
 * Type definitions for leads, calls, playbook, and decision engine
 */

export type CallStage = 'rapport' | 'diagnose' | 'qualify' | 'present' | 'objections' | 'close' | 'next_steps';
export type CallOutcome = 'won' | 'lost' | 'follow_up' | 'refer_out';

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  linked_user_id?: string;
  timezone?: string;
  country?: string;
  current_level?: string;
  goal?: string;
  deadline_urgency?: string;
  motivation?: string;
  biggest_blockers?: string[];
  past_methods_tried?: string[];
  time_available_per_week?: number;
  willingness_to_speak?: number; // 1-5
  budget_comfort?: number; // 1-5
  decision_maker?: 'yes' | 'no' | 'unsure';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Call {
  id: string;
  lead_id: string;
  stage: CallStage;
  transcript_notes?: string;
  tags: string[];
  answers: Answer[];
  outcome?: CallOutcome;
  follow_up_email?: string;
  summary?: string;
  qualification_score: number; // 0-100
  qualification_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  selectedOption?: string;
  freeText?: string;
  timestamp: string;
}

export interface Playbook {
  id: string;
  version: string;
  name: string;
  playbook_data: PlaybookData;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PlaybookData {
  meta: {
    playbookId: string;
    version: string;
    name: string;
    updatedAt: string;
    offer: {
      offerName: string;
      oneLiner: string;
      pricing: {
        payInFull: number;
        payInFullCurrency: string;
        paymentPlan: Array<{ amount: number; currency: string; count: number; label: string }>;
      };
      checkoutUrl: string;
    };
    notes: string[];
  };
  tags: {
    qualification: string[];
    blockers: string[];
    objections: string[];
    outcomes: string[];
  };
  stages: Stage[];
  checkpoints: Checkpoint[];
  questionBank: Question[];
  qualification: QualificationRules;
  objectionLibrary: Objection[];
  scripts: {
    positioning: {
      oneSentence: string;
      whatWeDontDo: string[];
    };
    presentPlanTemplate: string[];
    closeNow: {
      ask: string;
      paymentOptionPrompt: string;
      checkoutInstruction: string;
    };
    disqualify: {
      kindNo: string;
      redirectQuestion: string;
      referOutGeneric: string;
    };
    followUpIfNotToday: {
      clarify: string;
      setDeadline: string;
      emailSummaryTemplate: string;
    };
  };
  proofPlaceholders: {
    testimonials: Array<{
      id: string;
      label: string;
      snippet: string;
      useWhenTagsAny: string[];
    }>;
    processProof: string[];
  };
  decisionEngineHints: {
    stageProgression: Array<{
      fromStageId: string;
      toStageId: string;
      when: { checkpointIdsComplete: string[] };
    }>;
    nextQuestionPriorityRules: Array<{
      id: string;
      if: { tagsAny: string[] };
      then: {
        suggestStageId?: string;
        suggestQuestionId?: string;
        reason: string;
      };
    }>;
  };
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  goal: string;
  requiredCheckpoints: string[];
}

export interface Checkpoint {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  stageId: string;
  checkpointId: string;
  type: 'script' | 'free_text' | 'single_choice' | 'multi_prompt' | 'number' | 'scale';
  text: string;
  options?: QuestionOption[];
  listenFor?: string[];
  tagsOnAnswers?: Array<{
    when: { containsAny?: string[]; op?: string; value?: number };
    addTags: string[];
    scoreDelta: number;
  }>;
  scoringRules?: Array<{
    when: { op: string; value: number };
    addTags: string[];
    scoreDelta: number;
  }>;
  constraints?: { min?: number; max?: number; unit?: string };
  defaultNext?: string[];
  followUp?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  tags: string[];
  scoreDelta: number;
}

export interface QualificationRules {
  score: {
    start: number;
    clampMin: number;
    clampMax: number;
    bands: Array<{
      min: number;
      max: number;
      label: string;
      suggestedOutcome: string;
    }>;
  };
  hardDisqualifyRules: Array<{
    id: string;
    if: { tagsAny: string[]; tagsNone?: string[] };
    then: {
      action: string;
      reason: string;
      script: string;
    };
  }>;
  closeRule: {
    when: { scoreGte: number; tagsNone?: string[]; checkpointIdsComplete: string[] };
    then: { action: string };
  };
  paymentRecommendation: Array<{
    id: string;
    if: { tagsAny: string[] };
    then: {
      recommend: 'payment_plan' | 'pay_in_full';
      label: string;
      reason: string;
    };
  }>;
}

export interface Objection {
  id: string;
  label: string;
  empathy: string[];
  diagnosticQuestions: string[];
  reframes: string[];
  proofAngles: string[];
  closeQuestions: string[];
}

export interface NextQuestionResult {
  question: Question;
  whyThisQuestion: string;
  listenFor: string[];
  canAdvance: boolean;
}

export interface QualificationResult {
  score: number;
  band: 'Low' | 'Medium' | 'High';
  reason: string;
  hardDisqualify?: {
    action: string;
    reason: string;
    script: string;
  };
  shouldClose: boolean;
  paymentRecommendation?: 'payment_plan' | 'pay_in_full';
}

export interface AssessmentData {
  latestSession?: {
    id: string;
    status: string;
    goals?: string;
    completed_at?: string;
  };
  scores?: {
    pronunciation?: number;
    fluency?: number;
    confidence?: number;
    syntax?: number;
    conversation?: number;
    comprehension?: number;
  };
  archetype?: string;
  intakeData?: {
    goals?: string;
    primary_track?: string;
    age_band?: string;
    gender?: string;
  };
}

