/**
 * Micro-Drills Generator
 * 
 * Generates behavioral (not grammatical) confidence drills
 * based on focus areas from D1-D5 scoring.
 * Spec §9 - 20-40 second exercises
 */

export interface MicroDrill {
  dimension: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  title: string;
  instruction: string;
  duration: string; // "20-30 seconds", "30-40 seconds"
  example?: string;
}

/**
 * Get micro-drill for D1 (Response Initiation)
 * Focus: Reduce latency with instant openers
 */
export function getD1Drill(): MicroDrill {
  const openers = [
    "Bonjour, je vous appelle parce que...",
    "Oui, allô, c'est à propos de...",
    "Merci de prendre mon appel, je...",
    "Bonjour, j'ai besoin de..."
  ];
  
  const randomOpener = openers[Math.floor(Math.random() * openers.length)];
  
  return {
    dimension: 'D1',
    title: 'Instant Opener',
    instruction: `Start your response immediately with a prepared opener. Practice saying: "${randomOpener}" and then continue with your point. Goal: Begin speaking within 1 second of the prompt ending.`,
    duration: '20-30 seconds',
    example: `${randomOpener} j'ai reçu le mauvais article et je voudrais une solution.`
  };
}

/**
 * Get micro-drill for D2 (Silence Management)
 * Focus: Keep talking, use fillers, avoid long freezes
 */
export function getD2Drill(): MicroDrill {
  return {
    dimension: 'D2',
    title: 'Keep Going Drill',
    instruction: 'Practice speaking for 30 seconds without stopping for more than 2 seconds. If you forget a word, use "euh", "comment dire", or paraphrase. The goal is continuous speech, not perfect French.',
    duration: '30-40 seconds',
    example: 'Use phrases like: "comment je peux expliquer ça...", "en d\'autres mots...", "ce que je veux dire c\'est..."'
  };
}

/**
 * Get micro-drill for D3 (Ownership/Assertiveness)
 * Focus: Clear requests with ownership
 */
export function getD3Drill(): MicroDrill {
  const templates = [
    {
      structure: 'Je voudrais [X] + parce que + question',
      example: 'Je voudrais un remboursement parce que l\'article est cassé. Quand est-ce que je peux l\'obtenir?'
    },
    {
      structure: 'Je ne peux pas [X] + je propose [Y]',
      example: 'Je ne peux pas accepter cette solution. Je propose qu\'on trouve un compromis.'
    },
    {
      structure: 'J\'ai besoin de [X] + pour + question',
      example: 'J\'ai besoin d\'une réponse claire pour planifier la suite. C\'est possible aujourd\'hui?'
    }
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    dimension: 'D3',
    title: 'One Clear Request',
    instruction: `Make one direct request using this structure: ${randomTemplate.structure}. No apologies, no "peut-être", just state what you want.`,
    duration: '20-30 seconds',
    example: randomTemplate.example
  };
}

/**
 * Get micro-drill for D3 (Boundary Setting variant)
 */
export function getD3BoundaryDrill(): MicroDrill {
  return {
    dimension: 'D3',
    title: 'Boundary Script',
    instruction: 'Practice setting a clear boundary. Use: "Je ne peux pas [X]" followed by "Je propose [alternative]". State your limit clearly without over-apologizing.',
    duration: '20-30 seconds',
    example: 'Je ne peux pas travailler ce weekend. Je propose qu\'on en parle lundi et qu\'on trouve une autre solution.'
  };
}

/**
 * Get micro-drill for D4 (Emotional Engagement)
 * Focus: Express feelings and impact
 */
export function getD4Drill(): MicroDrill {
  return {
    dimension: 'D4',
    title: 'Emotion + Impact',
    instruction: 'Express how you feel and what you want. Use this structure: "Je suis [feeling] parce que [reason] + ce que je veux, c\'est [goal]". Be honest and direct about your emotional state.',
    duration: '30-40 seconds',
    example: 'Je suis vraiment frustré parce que c\'est la deuxième fois que ça arrive. Ce que je veux, c\'est une garantie que ça ne se reproduira pas.'
  };
}

/**
 * Get micro-drill for D5 (Clarity/Control)
 * Focus: Structured communication
 */
export function getD5Drill(): MicroDrill {
  return {
    dimension: 'D5',
    title: 'Structure Close',
    instruction: 'Close your response with clear structure. Use "Donc" to introduce your summary, recap your main point in one sentence, then ask for confirmation: "Ça vous convient?" or "C\'est clair?"',
    duration: '20-30 seconds',
    example: 'Donc, si je résume: je veux un remboursement complet d\'ici vendredi. Ça vous convient?'
  };
}

/**
 * Generate drills based on low-scoring dimensions
 * @param scores D1-D5 scores (0-5 each)
 * @returns Array of 1-3 micro-drills targeting weak areas
 */
export function generateDrillsForScores(scores: {
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
}): MicroDrill[] {
  const drills: MicroDrill[] = [];
  const threshold = 3; // Scores <= 3 need drills
  
  // Prioritize by importance (based on weights)
  if (scores.d2 <= threshold) {
    drills.push(getD2Drill()); // 25% weight - highest priority
  }
  
  if (scores.d3 <= threshold) {
    // For D3, use boundary drill if score is very low (0-1), otherwise use request drill
    drills.push(scores.d3 <= 1 ? getD3BoundaryDrill() : getD3Drill()); // 25% weight
  }
  
  if (scores.d1 <= threshold && drills.length < 3) {
    drills.push(getD1Drill()); // 20% weight
  }
  
  if (scores.d4 <= threshold && drills.length < 3) {
    drills.push(getD4Drill()); // 15% weight
  }
  
  if (scores.d5 <= threshold && drills.length < 3) {
    drills.push(getD5Drill()); // 15% weight
  }
  
  // Ensure at least one drill (if all scores are good, give a general one)
  if (drills.length === 0) {
    drills.push(getD3Drill()); // Default to ownership drill
  }
  
  // Limit to 3 drills max
  return drills.slice(0, 3);
}

/**
 * Generate strengths based on high-scoring dimensions
 * @param scores D1-D5 scores (0-5 each)
 * @returns Array of 1-3 strength messages
 */
export function generateStrengths(scores: {
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
}): Array<{ dimension: string; label: string }> {
  const strengths: Array<{ dimension: string; label: string }> = [];
  const threshold = 4; // Scores >= 4 are strengths
  
  if (scores.d1 >= threshold) {
    strengths.push({
      dimension: 'D1',
      label: 'You start speaking quickly and confidently — no hesitation at the beginning of your responses.'
    });
  }
  
  if (scores.d2 >= threshold) {
    strengths.push({
      dimension: 'D2',
      label: 'You keep speaking with minimal long silences. You maintain momentum even when searching for words.'
    });
  }
  
  if (scores.d3 >= threshold) {
    strengths.push({
      dimension: 'D3',
      label: 'You express your needs and opinions with ownership. Your requests are clear and direct.'
    });
  }
  
  if (scores.d4 >= threshold) {
    strengths.push({
      dimension: 'D4',
      label: 'You bring emotional presence and engagement to the conversation. You\'re not afraid to show how you feel.'
    });
  }
  
  if (scores.d5 >= threshold) {
    strengths.push({
      dimension: 'D5',
      label: 'Your responses are well-structured and controlled. You communicate with clarity and purpose.'
    });
  }
  
  // If no clear strengths, acknowledge participation
  if (strengths.length === 0) {
    strengths.push({
      dimension: 'General',
      label: 'You completed the phone call and communicated in French — that takes courage.'
    });
  }
  
  return strengths.slice(0, 3); // Limit to top 3
}

/**
 * Generate focus areas based on low-scoring dimensions
 * @param scores D1-D5 scores (0-5 each)
 * @returns Array of 1-2 focus area messages
 */
export function generateFocusAreas(scores: {
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
}): Array<{ dimension: string; label: string }> {
  const focusAreas: Array<{ dimension: string; label: string }> = [];
  const threshold = 2; // Scores <= 2 are focus areas
  
  // Prioritize by weight
  if (scores.d2 <= threshold) {
    focusAreas.push({
      dimension: 'D2',
      label: 'Reduce long silent pauses. Practice keeping momentum with "euh", paraphrasing, or simple connecting words.'
    });
  }
  
  if (scores.d3 <= threshold) {
    focusAreas.push({
      dimension: 'D3',
      label: 'Make one clear request earlier in the conversation. Use "je veux", "j\'ai besoin de", or "je voudrais".'
    });
  }
  
  if (scores.d1 <= threshold && focusAreas.length < 2) {
    focusAreas.push({
      dimension: 'D1',
      label: 'Start your answer faster. Prepare a one-sentence opener so you can begin immediately.'
    });
  }
  
  if (scores.d4 <= threshold && focusAreas.length < 2) {
    focusAreas.push({
      dimension: 'D4',
      label: 'Express how you feel. Use "je suis [emotion]" to add personal presence to your responses.'
    });
  }
  
  if (scores.d5 <= threshold && focusAreas.length < 2) {
    focusAreas.push({
      dimension: 'D5',
      label: 'Add structure to your response. Use "d\'abord", "ensuite", "donc" to organize your thoughts.'
    });
  }
  
  return focusAreas.slice(0, 2); // Limit to top 2 focus areas
}

