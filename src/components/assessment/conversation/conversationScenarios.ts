export interface ConversationScenario {
  id: string;
  title: string;
  goal: string;
  slots: Record<string, string | null>;
  starterAgentTurn: string;
}

export const conversationScenarios: ConversationScenario[] = [
  {
    id: "C1",
    title: "Restaurant order wrong",
    goal: "User politely explains the order is wrong, asks for a solution, and confirms what will happen next.",
    slots: {
      dish_ordered: null,
      dish_received: null,
      resolution: null
    },
    starterAgentTurn: "Bonjour ! Vous avez commandé quoi ?"
  },
  {
    id: "C2",
    title: "Neighbor noise",
    goal: "User complains politely about noise, proposes a compromise, and confirms a time.",
    slots: {
      noise_time: null,
      compromise: null,
      agreement: null
    },
    starterAgentTurn: "Salut… Ça va ? Tu voulais me parler ?"
  },
  {
    id: "C3",
    title: "Work schedule change",
    goal: "User asks clarifying questions about a meeting change and confirms time/place/action.",
    slots: {
      meeting_time: null,
      meeting_place: null,
      action_items: null
    },
    starterAgentTurn: "Bonjour. On doit changer l'horaire de la réunion."
  }
];

export const agentConstraints = [
  "Use short A2 sentences and clear questions.",
  "Ask ONE question per turn.",
  "Include exactly one mild misunderstanding for repair.",
  "Never explicitly correct grammar."
];

export const AGENT_SYSTEM_PROMPT = `You are a friendly French conversation partner for an A2 learner.
Constraints:
- Use short sentences, A2 vocabulary, and clear questions.
- Speak naturally but not fast.
- Ask ONE question per turn.
- Include exactly one moment of mild misunderstanding so the learner can repair.
- Never correct grammar explicitly. Keep conversation going.

Scenario:
<<<SCENARIO_BRIEF>>>

State to track (slots JSON):
<<<SLOTS_JSON>>>`;

export const SCORING_SYSTEM_PROMPT = `You are scoring an A2-level French conversation. Output ONLY JSON.
Do not reward fancy vocabulary. Reward understanding, repair, and staying on topic.
False starts/repetitions are NOT penalized.`;

export const buildAgentPrompt = (scenario: ConversationScenario, currentSlots: Record<string, string | null>): string => {
  const scenarioBrief = `${scenario.title}\nGoal: ${scenario.goal}`;
  return AGENT_SYSTEM_PROMPT
    .replace("<<<SCENARIO_BRIEF>>>", scenarioBrief)
    .replace("<<<SLOTS_JSON>>>", JSON.stringify(currentSlots));
};

export const buildScoringPrompt = (goal: string, transcript: Array<{ role: string; content: string }>): string => {
  const turnByTurn = transcript
    .map(t => `${t.role === 'agent' ? 'Agent' : 'User'}: ${t.content}`)
    .join('\n');
  
  return `Score:
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
};

// Get a random scenario for the assessment
export const getRandomScenario = (): ConversationScenario => {
  const index = Math.floor(Math.random() * conversationScenarios.length);
  return conversationScenarios[index];
};
