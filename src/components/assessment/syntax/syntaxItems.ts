/**
 * Syntax/Structure Module Items (A2→B1 French Elicitation)
 * 
 * 3 exercises targeting A2→B1 structures:
 * - E1 (15s): Quick answer - binary choice + reason
 * - E2 (30s): Structured plan - 3 actions with sequencing
 * - E3 (60s): Mini-story/dilemma - past narration + reasoning
 */

export const syntaxExercises = {
  E1: { duration: 15, name: 'Quick Answer' },
  E2: { duration: 30, name: 'Structured Plan' },
  E3: { duration: 60, name: 'Mini-Story' }
};

/**
 * Scoring weights per subscore (total 100)
 * 4-bucket system for ASR-resilient scoring
 */
export const SYNTAX_SCORING = {
  subscores: {
    structure_connectors: { max: 30, label: 'Structure & Connectors' },
    tenses_time: { max: 25, label: 'Tenses & Time' },
    pronouns: { max: 25, label: 'Pronouns' },
    questions_modality_negation: { max: 20, label: 'Questions + Modality + Negation' }
  },
  total: 100
};
