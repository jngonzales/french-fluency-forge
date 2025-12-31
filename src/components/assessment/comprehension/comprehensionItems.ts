export interface ComprehensionItem {
  id: string;
  context: string;
  audioScript: string;
  keyFacts: string[];
  acceptableIntents: string[];
  goodResponses: string[];
}

export const comprehensionItems: ComprehensionItem[] = [
  {
    id: "L1",
    context: "Tu es à la boulangerie.",
    audioScript: "Bonjour ! Il n'y a plus de croissants. Il reste des pains au chocolat. Vous en voulez ?",
    keyFacts: [
      "plus de croissants",
      "alternative disponible: pains au chocolat",
      "question: en voulez-vous"
    ],
    acceptableIntents: ["answer_yes", "answer_no", "ask_about_other_options"],
    goodResponses: [
      "Oui, je prends deux pains au chocolat, s'il vous plaît.",
      "Non merci. Vous avez autre chose ?"
    ]
  },
  {
    id: "L2",
    context: "Tu es en retard pour un rendez-vous.",
    audioScript: "Salut ! Je suis déjà là. Tu arrives dans combien de minutes ?",
    keyFacts: ["interlocuteur déjà là", "demande ETA"],
    acceptableIntents: ["give_eta", "apologize_and_give_eta", "ask_to_move_time"],
    goodResponses: [
      "Désolé, j'arrive dans dix minutes.",
      "Je suis dans le métro, j'arrive vers 18h10."
    ]
  },
  {
    id: "L3",
    context: "Tu veux réserver au restaurant.",
    audioScript: "On est complet ce soir. Mais demain à 19h, c'est possible.",
    keyFacts: ["pas de place ce soir", "option demain 19h"],
    acceptableIntents: ["accept_tomorrow", "decline", "ask_alternative_time"],
    goodResponses: [
      "D'accord pour demain à 19h. Pour deux personnes.",
      "Ah mince. Vous avez une autre heure demain ?"
    ]
  },
  {
    id: "L4",
    context: "Tu es dans un bus.",
    audioScript: "Prochain arrêt : Gare du Nord. Attention, les portes vont se fermer.",
    keyFacts: ["next stop Gare du Nord", "doors closing soon"],
    acceptableIntents: ["confirm_stop", "ask_if_need_get_off", "react_safely"],
    goodResponses: [
      "Merci. C'est ici pour la Gare du Nord ?",
      "D'accord, je descends au prochain arrêt."
    ]
  },
  {
    id: "L5",
    context: "Ton ami te propose un plan.",
    audioScript: "On peut aller au parc, mais il va pleuvoir. Tu préfères un café ?",
    keyFacts: ["parc possible", "risque pluie", "alternative: café", "asks preference"],
    acceptableIntents: ["choose_option", "suggest_third_option", "ask_time/place"],
    goodResponses: [
      "Je préfère un café, il va pleuvoir.",
      "On va au café. Tu veux aller où ?"
    ]
  },
  {
    id: "L6",
    context: "Tu es au travail.",
    audioScript: "La réunion est déplacée à 15h, pas à 14h. Tu peux confirmer ?",
    keyFacts: ["meeting moved to 15h", "not 14h", "asks confirmation"],
    acceptableIntents: ["confirm", "ask_details"],
    goodResponses: [
      "Oui, confirmé : 15h. Merci.",
      "D'accord à 15h. C'est où exactement ?"
    ]
  },
  {
    id: "L7",
    context: "Tu as acheté un billet de train.",
    audioScript: "Votre train a dix minutes de retard. Il partira voie 6.",
    keyFacts: ["10 min delay", "platform 6"],
    acceptableIntents: ["acknowledge", "ask_platform_confirmation"],
    goodResponses: [
      "D'accord, voie 6. Merci.",
      "Il a dix minutes de retard, c'est ça ?"
    ]
  },
  {
    id: "L8",
    context: "Tu es chez un médecin.",
    audioScript: "Vous avez de la fièvre depuis quand ? Et vous avez mal où ?",
    keyFacts: ["asks since when fever", "asks where pain is"],
    acceptableIntents: ["answer_both", "ask_clarification"],
    goodResponses: [
      "Depuis deux jours, et j'ai mal à la gorge.",
      "Depuis hier. J'ai mal au ventre."
    ]
  },
  {
    id: "L9",
    context: "Tu appelles un service client.",
    audioScript: "Je peux vous aider, mais j'ai besoin de votre numéro de commande.",
    keyFacts: ["can help", "needs order number"],
    acceptableIntents: ["provide_number", "ask_where_find_number"],
    goodResponses: [
      "Oui, c'est le numéro 12345.",
      "Il est où le numéro de commande, s'il vous plaît ?"
    ]
  },
  {
    id: "L10",
    context: "Tu es invité(e) à une soirée.",
    audioScript: "Ça commence à 20h, mais si tu peux, viens un peu plus tôt.",
    keyFacts: ["starts 20h", "request to come earlier if possible"],
    acceptableIntents: ["accept_earlier", "decline_earlier_with_reason", "ask_how_early"],
    goodResponses: [
      "Ok, je viens vers 19h30.",
      "Je peux pas avant 20h, désolé."
    ]
  },
  {
    id: "L11",
    context: "Tu es dans un magasin de vêtements.",
    audioScript: "Cette taille est petite. Je vous conseille une taille au-dessus.",
    keyFacts: ["current size small", "advises one size up"],
    acceptableIntents: ["accept_advice", "ask_to_try_other_size"],
    goodResponses: [
      "D'accord, je prends la taille au-dessus.",
      "Vous avez la taille M à essayer ?"
    ]
  },
  {
    id: "L12",
    context: "Tu es chez un ami.",
    audioScript: "Je suis fatigué, mais je veux quand même sortir. Tu proposes quoi ?",
    keyFacts: ["friend tired", "still wants to go out", "asks suggestion"],
    acceptableIntents: ["suggest_low_energy_plan", "ask_preference"],
    goodResponses: [
      "On peut aller boire un thé tranquille.",
      "Tu préfères un film ou un café ?"
    ]
  }
];

// Get a subset of items for assessment (6 items)
export const getAssessmentItems = (): ComprehensionItem[] => {
  // Return items L1, L3, L5, L7, L9, L11 for variety
  return comprehensionItems.filter((_, index) => index % 2 === 0);
};

// Get item by ID
export const getItemById = (id: string): ComprehensionItem | undefined => {
  return comprehensionItems.find(item => item.id === id);
};
