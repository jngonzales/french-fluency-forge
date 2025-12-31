/**
 * Syntax/Structure Module Items (A2 French Elicitation)
 * 
 * 5 micro-tasks targeting specific A2 structures:
 * - S1: Passé composé (past story)
 * - S2: Futur proche (plans)
 * - S3: Object pronouns (le/la/les/lui/leur)
 * - S4: Questions (est-ce que/intonation)
 * - S5: Connectors + comparatives
 */

export interface SyntaxMicroTask {
  id: string;
  name: string;
  targetStructures: string[];
  promptFr: string;
  timeSec: number;
  items?: { q: string; ideal: string }[]; // For S3 pronoun mini-questions
}

export const syntaxMicroTasks: SyntaxMicroTask[] = [
  {
    id: 'S1',
    name: 'Past story',
    targetStructures: ['passé composé'],
    promptFr: 'Raconte ton week-end dernier : 3 choses que tu as faites.',
    timeSec: 20
  },
  {
    id: 'S2',
    name: 'Plans',
    targetStructures: ['futur proche'],
    promptFr: 'Ce soir, tu vas faire quoi ? Donne 3 actions.',
    timeSec: 15
  },
  {
    id: 'S3',
    name: 'Object pronouns',
    targetStructures: ['le/la/les/lui/leur'],
    promptFr: 'Réponds vite (4 mini-questions).',
    timeSec: 25,
    items: [
      { q: 'Tu vois Marie ?', ideal: 'Oui, je la vois.' },
      { q: 'Tu prends le bus ?', ideal: 'Oui, je le prends.' },
      { q: 'Tu parles à ton ami ?', ideal: 'Oui, je lui parle.' },
      { q: 'Tu donnes le livre à tes parents ?', ideal: 'Oui, je leur donne le livre.' }
    ]
  },
  {
    id: 'S4',
    name: 'Ask questions',
    targetStructures: ['questions (est-ce que/intonation)'],
    promptFr: 'Tu es dans un magasin. Pose 3 questions au vendeur.',
    timeSec: 20
  },
  {
    id: 'S5',
    name: 'Reasons + comparison',
    targetStructures: ['parce que', 'comparatives'],
    promptFr: "Ville ou campagne : qu'est-ce qui est mieux pour toi ? Pourquoi ?",
    timeSec: 25
  }
];

/**
 * Scoring weights per subscore (total 100)
 */
export const SYNTAX_SCORING = {
  subscores: {
    passe_compose: { max: 25, label: 'Passé composé' },
    futur_proche: { max: 15, label: 'Futur proche' },
    pronouns: { max: 25, label: 'Pronouns' },
    questions: { max: 15, label: 'Questions' },
    connectors_structure: { max: 20, label: 'Connectors & Structure' }
  },
  total: 100
};

/**
 * Pairwise test cases for validation
 */
export const PAIRWISE_TESTS = [
  {
    pairName: 'passe_compose_good_vs_bad',
    A: "Le week-end dernier, j'ai vu mes amis et j'ai mangé au restaurant. Après, je suis rentré chez moi.",
    B: "Le week-end dernier, je voir mes amis et je manger au restaurant. Après je rentrer chez moi.",
    expected: 'A_higher',
    minGap: 20
  },
  {
    pairName: 'pronouns_position',
    A: "Je le prends et je lui parle après. Je leur donne le livre demain.",
    B: "Je prends le et je parle lui après. Je donne leur le livre demain.",
    expected: 'A_higher',
    minGap: 20
  }
];
