// Fluency Prompts - French speaking prompts for real-life situations

export interface FluencyPrompt {
  id: string;
  tags: string[];
  fr: {
    context: string;
    question: string;
  };
  en: {
    context: string;
    question: string;
  };
}

export const FLUENCY_PROMPTS: FluencyPrompt[] = [
  {
    "id": "P001",
    "tags": ["work", "small-talk", "self-description"],
    "fr": {
      "context": "Tu rencontres quelqu'un pour la première fois, et la question classique arrive.",
      "question": "Qu'est-ce que tu fais dans la vie ? Décris ton travail de façon simple puis avec plus de détails."    },
    "en": {
      "context": "You meet someone for the first time, and the classic question comes up.",
      "question": "What do you do for a living? Describe your job simply, then in more detail."    }
  },
  {
    "id": "P002",
    "tags": ["communication", "clarity", "storytelling"],
    "fr": {
      "context": "Tu expliques quelque chose, mais la personne en face a l'air perdue.",
      "question": "Comment tu reformules ? Donne une explication courte, puis une version plus claire avec un exemple."    },
    "en": {
      "context": "You're explaining something, but the other person looks lost.",
      "question": "How do you rephrase? Give a short explanation, then a clearer version with an example."    }
  },
  {
    "id": "P003",
    "tags": ["interests", "identity", "conversation"],
    "fr": {
      "context": "Un ami veut mieux te connaître, sans entrer dans une conversation \"trop profonde\".",
      "question": "Qu'est-ce qui t'a passionné ces 10 dernières années ? Donne 3 exemples et pourquoi."    },
    "en": {
      "context": "A friend wants to know you better, without making it \"too deep\".",
      "question": "What have you been really into over the last 10 years? Give 3 examples and why."    }
  },
  {
    "id": "P004",
    "tags": ["relationships", "boundaries", "friendship"],
    "fr": {
      "context": "Tu viens de te séparer, et ton ex propose de rester amis.",
      "question": "Tu es pour ou contre ? Dans quels cas ça marche, et dans quels cas c'est une mauvaise idée ?"    },
    "en": {
      "context": "You just broke up, and your ex suggests staying friends.",
      "question": "Are you for or against it? When does it work, and when is it a bad idea?"    }
  },
  {
    "id": "P005",
    "tags": ["life-choices", "judgment", "social"],
    "fr": {
      "context": "Un collègue dit : \"Je ne veux pas d'enfants, jamais.\" Certains le jugent.",
      "question": "Qu'est-ce que tu en penses ? Comment tu réagis quand quelqu'un te dit ça ?"    },
    "en": {
      "context": "A coworker says: \"I don\'t want kids, ever.\" Some people judge them.",
      "question": "What do you think? How do you react when someone tells you that?"    }
  },
  {
    "id": "P006",
    "tags": ["friendship", "conflict", "punctuality"],
    "fr": {
      "context": "Un ami annule un rendez-vous de la semaine… dix minutes avant. Il fait ça souvent.",
      "question": "Tu fais quoi ? Tu dis quoi exactement ? Tu poses une limite ou tu laisses passer ?"    },
    "en": {
      "context": "A friend cancels a week-planned meet-up… ten minutes before. It happens often.",
      "question": "What do you do? What do you say exactly? Do you set a boundary or let it slide?"    }
  },
  {
    "id": "P007",
    "tags": ["work", "boundaries", "management"],
    "fr": {
      "context": "Ton manager te demande \"juste un petit truc\" le week-end. Ce \"petit truc\" devient régulier.",
      "question": "Tu acceptes ? Comment tu réponds sans te fâcher avec lui ?"    },
    "en": {
      "context": "Your manager asks for \"just a small thing\" on the weekend. It becomes a pattern.",
      "question": "Do you accept? How do you respond without starting a conflict?"    }
  },
  {
    "id": "P008",
    "tags": ["work", "fairness", "credit"],
    "fr": {
      "context": "Un collègue présente ton idée en réunion… comme si c'était la sienne.",
      "question": "Tu réagis comment sur le moment ? Et après la réunion ?"    },
    "en": {
      "context": "A coworker presents your idea in a meeting… as if it were theirs.",
      "question": "How do you react in the moment? And after the meeting?"    }
  },
  {
    "id": "P009",
    "tags": ["money", "friendship", "boundaries"],
    "fr": {
      "context": "Un ami te demande de lui prêter de l'argent. Il te dit \"je te rembourse bientôt\", mais tu n'es pas sûr.",
      "question": "Tu fais quoi ? Tu poses quelles conditions ?"    },
    "en": {
      "context": "A friend asks to borrow money. They say \"I\'ll pay you back soon,\" but you're not sure.",
      "question": "What do you do? What conditions do you set?"    }
  },
  {
    "id": "P010",
    "tags": ["money", "etiquette", "restaurant"],
    "fr": {
      "context": "Au restaurant, quelqu'un veut \"partager l\'addition\" alors qu'il a pris beaucoup plus cher que toi.",
      "question": "Tu acceptes ou tu dis quelque chose ? Comment tu le dis sans être gênant ?"    },
    "en": {
      "context": "At a restaurant, someone wants to \"split the bill evenly\" even though they ordered much more than you.",
      "question": "Do you accept or say something? How do you say it without making it awkward?"    }
  },
  {
    "id": "P011",
    "tags": ["etiquette", "public-space", "conflict"],
    "fr": {
      "context": "Dans le train, une personne parle très fort au téléphone en haut-parleur.",
      "question": "Tu fais quoi ? Tu confrontes, tu ignores, tu changes de place ?"    },
    "en": {
      "context": "On a train, someone is loudly on speakerphone.",
      "question": "What do you do? Confront, ignore, move seats?"    }
  },
  {
    "id": "P012",
    "tags": ["neighbors", "boundaries", "daily-life"],
    "fr": {
      "context": "Ton voisin fait du bruit tard le soir (musique, travaux, invités).",
      "question": "Tu le préviens comment ? Tu envoies un message ? Tu vas sonner ? Tu appelles le syndic ?"    },
    "en": {
      "context": "Your neighbor makes noise late at night (music, DIY, guests).",
      "question": "How do you address it? Text them? Knock? Contact the building manager?"    }
  },
  {
    "id": "P013",
    "tags": ["family", "holidays", "guilt"],
    "fr": {
      "context": "Ta famille insiste pour que tu viennes à une fête, mais tu n'en as pas envie (fatigue, stress).",
      "question": "Tu fais quoi ? Tu viens quand même ? Tu refuses ? Tu expliques comment ?"    },
    "en": {
      "context": "Your family insists you come to a gathering, but you don't want to (tired, stressed).",
      "question": "What do you do? Go anyway? Decline? How do you explain it?"    }
  },
  {
    "id": "P014",
    "tags": ["relationships", "privacy", "trust"],
    "fr": {
      "context": "Ton/ta partenaire te demande ton mot de passe \"par transparence\".",
      "question": "Tu acceptes ? Pourquoi ? Où est la limite entre confiance et contrôle ?"    },
    "en": {
      "context": "Your partner asks for your password \"for transparency\".",
      "question": "Do you agree? Why? Where's the line between trust and control?"    }
  },
  {
    "id": "P015",
    "tags": ["relationships", "etiquette", "phones"],
    "fr": {
      "context": "Pendant un dîner, quelqu'un regarde son téléphone toutes les 30 secondes.",
      "question": "Tu dis quelque chose ? Qu'est-ce que ça signifie pour toi ?"    },
    "en": {
      "context": "During dinner, someone checks their phone every 30 seconds.",
      "question": "Do you say something? What does it mean to you?"    }
  },
  {
    "id": "P016",
    "tags": ["ethics", "honesty", "friendship"],
    "fr": {
      "context": "Un ami te demande ton avis sur son projet. Tu trouves ça vraiment mauvais.",
      "question": "Tu dis la vérité ? Tu arrondis ? Tu le critiques comment sans le démotiver ?"    },
    "en": {
      "context": "A friend asks your opinion on their project. You genuinely think it's bad.",
      "question": "Do you tell the truth? Soften it? How do you critique without crushing them?"    }
  },
  {
    "id": "P017",
    "tags": ["work", "salary", "social-norms"],
    "fr": {
      "context": "Un collègue te demande combien tu gagnes. Tu sens que la question est délicate.",
      "question": "Tu réponds ? Tu refuses ? Tu détournes ? Pourquoi ?"    },
    "en": {
      "context": "A coworker asks how much you earn. You feel it's a sensitive question.",
      "question": "Do you answer? Refuse? Deflect? Why?"    }
  },
  {
    "id": "P018",
    "tags": ["etiquette", "queues", "conflict"],
    "fr": {
      "context": "Quelqu'un \"grille la queue\" devant toi comme si de rien n'était.",
      "question": "Tu réagis comment ? Tu dis quoi exactement ?"    },
    "en": {
      "context": "Someone cuts in line in front of you like it's normal.",
      "question": "How do you react? What do you say exactly?"    }
  },
  {
    "id": "P019",
    "tags": ["ethics", "lost-and-found", "values"],
    "fr": {
      "context": "Tu trouves un portefeuille avec de l'argent et une carte d'identité.",
      "question": "Tu fais quoi, étape par étape ? Et si tu es pressé ?"    },
    "en": {
      "context": "You find a wallet with cash and an ID.",
      "question": "What do you do, step by step? What if you're in a rush?"    }
  },
  {
    "id": "P020",
    "tags": ["work", "integrity", "whistleblowing"],
    "fr": {
      "context": "Au travail, tu vois quelqu'un tricher (heures, notes de frais, ou vol).",
      "question": "Tu en parles à qui ? Tu le confrontes ? Tu laisses tomber ?"    },
    "en": {
      "context": "At work, you see someone cheating (hours, expenses, or stealing).",
      "question": "Who do you talk to? Confront them? Ignore it?"    }
  },
  {
    "id": "P021",
    "tags": ["travel", "airplane", "boundaries"],
    "fr": {
      "context": "Dans l'avion, quelqu'un te demande d'échanger ton siège (tu as payé pour ton choix).",
      "question": "Tu acceptes ? Quelles questions tu poses avant de décider ?"    },
    "en": {
      "context": "On a plane, someone asks to swap seats (you paid for your seat).",
      "question": "Do you agree? What questions do you ask before deciding?"    }
  },
  {
    "id": "P022",
    "tags": ["travel", "etiquette", "comfort"],
    "fr": {
      "context": "Dans l'avion, la personne devant toi incline complètement son siège et tu as zéro espace.",
      "question": "Tu fais quoi ? Tu dis quoi ?"    },
    "en": {
      "context": "On a plane, the person in front reclines fully and you have no space.",
      "question": "What do you do? What do you say?"    }
  },
  {
    "id": "P023",
    "tags": ["social-media", "relationships", "jealousy"],
    "fr": {
      "context": "Ton/ta partenaire \"like\" toutes les photos sexy d'une personne sur Instagram.",
      "question": "Ça te dérange ? Pourquoi ? Tu en parles comment ?"    },
    "en": {
      "context": "Your partner likes every sexy photo of someone on Instagram.",
      "question": "Does it bother you? Why? How do you talk about it?"    }
  },
  {
    "id": "P024",
    "tags": ["friends", "group-trip", "money"],
    "fr": {
      "context": "Un groupe d'amis organise un voyage. Certains veulent un hôtel cher, d'autres veulent économiser.",
      "question": "Tu fais comment pour décider ? Tu acceptes le compromis ou tu te retires ?"    },
    "en": {
      "context": "A friend group plans a trip. Some want an expensive hotel, others want to save money.",
      "question": "How do you decide? Do you compromise or opt out?"    }
  },
  {
    "id": "P025",
    "tags": ["roommates", "cleanliness", "boundaries"],
    "fr": {
      "context": "Ton coloc ne fait jamais le ménage. Il dit : \"Je ne vois pas le problème.\"",
      "question": "Tu fais quoi ? Tu proposes un planning, tu confrontes, tu déménages ?"    },
    "en": {
      "context": "Your roommate never cleans. They say: \"I don\'t see the problem.\"",
      "question": "What do you do? Make a cleaning schedule, confront, move out?"    }
  },
  {
    "id": "P026",
    "tags": ["dating", "communication", "respect"],
    "fr": {
      "context": "Après un premier rendez-vous, la personne ne répond plus (ghosting).",
      "question": "Tu en penses quoi ? Tu relances ? Tu laisses tomber ? Quelle est la \"bonne\" manière de faire ?"    },
    "en": {
      "context": "After a first date, the person stops replying (ghosting).",
      "question": "What do you think about it? Do you follow up? Let it go? What's the \"right\" way?"    }
  },
  {
    "id": "P027",
    "tags": ["family", "weddings", "social-obligation"],
    "fr": {
      "context": "Tu es invité à un mariage cher (déplacement, hôtel), mais tu n'es pas si proche.",
      "question": "Tu y vas ? Tu refuses ? Comment tu expliques ?"    },
    "en": {
      "context": "You're invited to an expensive wedding (travel, hotel), but you're not that close to them.",
      "question": "Do you go? Decline? How do you explain it?"    }
  },
  {
    "id": "P028",
    "tags": ["etiquette", "gifts", "money"],
    "fr": {
      "context": "Quelqu'un t'offre un cadeau qui ne te plaît pas du tout. Il te demande ensuite : \"Alors, tu aimes ?\"",
      "question": "Tu réponds quoi ? Tu es honnête ou diplomate ?"    },
    "en": {
      "context": "Someone gives you a gift you really dislike. Then they ask: \"So, do you like it?\"",
      "question": "What do you say? Honest or diplomatic?"    }
  },
  {
    "id": "P029",
    "tags": ["work", "meetings", "productivity"],
    "fr": {
      "context": "On te met dans une réunion… qui aurait pu être un email.",
      "question": "Tu fais quoi ? Tu le dis ? Comment tu proposes une alternative ?"    },
    "en": {
      "context": "You're put into a meeting… that could have been an email.",
      "question": "What do you do? Do you say it? How do you propose an alternative?"    }
  },
  {
    "id": "P030",
    "tags": ["ethics", "technology", "work"],
    "fr": {
      "context": "Ton collègue utilise l'IA pour faire son boulot et le cache. Il rend du travail moyen, mais ça passe.",
      "question": "Tu trouves ça OK ? Où est la limite ? Tu en parles à qui, si à quelqu'un ?"    },
    "en": {
      "context": "Your coworker uses AI to do their job and hides it. The output is mediocre but acceptable.",
      "question": "Is it okay? Where's the line? Who do you talk to, if anyone?"    }
  },
  {
    "id": "P031",
    "tags": ["ethics", "copyright", "daily-life"],
    "fr": {
      "context": "Un ami pirate des films et dit : \"Tout le monde le fait, ce n'est pas grave.\"",
      "question": "Tu es d'accord ? Tu lui réponds quoi ?"    },
    "en": {
      "context": "A friend pirates movies and says: \"Everyone does it, it's not a big deal.\"",
      "question": "Do you agree? What do you say back?"    }
  },
  {
    "id": "P032",
    "tags": ["health", "social", "boundaries"],
    "fr": {
      "context": "Un ami te pousse à boire alors que tu dis non. Il insiste : \"Allez, juste un !\"",
      "question": "Tu réagis comment ? Tu dis quoi exactement ?"    },
    "en": {
      "context": "A friend pushes you to drink when you say no. They insist: \"Come on, just one!\"",
      "question": "How do you react? What do you say exactly?"    }
  },
  {
    "id": "P033",
    "tags": ["values", "food", "social"],
    "fr": {
      "context": "Tu manges différemment (végétarien, sans alcool, sans gluten, etc.) et quelqu'un se moque ou critique.",
      "question": "Tu réponds comment sans lancer un débat interminable ?"    },
    "en": {
      "context": "You eat differently (vegetarian, no alcohol, gluten-free, etc.) and someone mocks or criticizes it.",
      "question": "How do you respond without starting an endless debate?"    }
  },
  {
    "id": "P034",
    "tags": ["friendship", "loyalty", "conflict"],
    "fr": {
      "context": "Deux amis se disputent. Chacun te raconte sa version et te demande de \"choisir un camp\".",
      "question": "Tu fais quoi ? Tu prends parti ? Tu restes neutre ? Tu dis quoi à chacun ?"    },
    "en": {
      "context": "Two friends fight. Each tells you their side and asks you to \"pick a side\".",
      "question": "What do you do? Take a side? Stay neutral? What do you say to each?"    }
  },
  {
    "id": "P035",
    "tags": ["relationships", "household", "fairness"],
    "fr": {
      "context": "En couple, l'un fait beaucoup plus de tâches ménagères que l'autre.",
      "question": "Tu gères ça comment ? Tu fais une liste ? Tu négocies ?"    },
    "en": {
      "context": "In a relationship, one person does way more chores than the other.",
      "question": "How do you handle it? Make a list? Negotiate?"    }
  },
  {
    "id": "P036",
    "tags": ["work", "feedback", "communication"],
    "fr": {
      "context": "Tu dois donner un feedback négatif à un collègue qui est sympa, mais pas efficace.",
      "question": "Tu le fais comment ? Quelles phrases tu utilises ?"    },
    "en": {
      "context": "You need to give negative feedback to a coworker who is nice but not effective.",
      "question": "How do you do it? What phrases do you use?"    }
  },
  {
    "id": "P037",
    "tags": ["daily-life", "etiquette", "animals"],
    "fr": {
      "context": "Quelqu'un laisse son chien faire ses besoins devant chez toi et ne ramasse pas.",
      "question": "Tu dis quoi ? Tu fais quoi si ça se répète ?"    },
    "en": {
      "context": "Someone lets their dog poop in front of your place and doesn't pick it up.",
      "question": "What do you say? What do you do if it happens again?"    }
  },
  {
    "id": "P038",
    "tags": ["friends", "social", "punctuality"],
    "fr": {
      "context": "Un ami arrive toujours en retard et dit : \"C\'est ma personnalité.\"",
      "question": "Tu tolères ? Tu poses une règle ? Comment ?"    },
    "en": {
      "context": "A friend is always late and says: \"That\'s just my personality.\"",
      "question": "Do you tolerate it? Set a rule? How?"    }
  },
  {
    "id": "P039",
    "tags": ["work", "remote", "communication"],
    "fr": {
      "context": "En visio, un collègue coupe toujours la parole et monopolise la conversation.",
      "question": "Tu fais quoi pour reprendre de l'espace sans être agressif ?"    },
    "en": {
      "context": "On video calls, a coworker constantly interrupts and dominates the conversation.",
      "question": "What do you do to take space without being aggressive?"    }
  },
  {
    "id": "P040",
    "tags": ["money", "tips", "culture"],
    "fr": {
      "context": "Tu es dans un pays où le pourboire est attendu, mais tu trouves ça injuste ou confus.",
      "question": "Tu laisses un pourboire ? Combien ? Pourquoi ?"    },
    "en": {
      "context": "You're in a country where tipping is expected, but you find it unfair or confusing.",
      "question": "Do you tip? How much? Why?"    }
  },
  {
    "id": "P041",
    "tags": ["privacy", "social-media", "boundaries"],
    "fr": {
      "context": "Un ami poste une photo de toi en ligne sans te demander, et tu n'aimes pas la photo.",
      "question": "Tu réagis comment ? Tu demandes de supprimer ? Comment tu le formules ?"    },
    "en": {
      "context": "A friend posts a photo of you online without asking, and you hate the photo.",
      "question": "How do you react? Ask them to delete it? How do you phrase it?"    }
  },
  {
    "id": "P042",
    "tags": ["daily-life", "service", "conflict"],
    "fr": {
      "context": "Tu reçois un service mauvais (restaurant, livraison, hôtel). La personne en face est gentille, mais le résultat est nul.",
      "question": "Tu te plains ? Tu laisses un avis ? Tu dis quoi exactement ?"    },
    "en": {
      "context": "You get poor service (restaurant, delivery, hotel). The person is nice, but the result is bad.",
      "question": "Do you complain? Leave a review? What do you say exactly?"    }
  },
  {
    "id": "P043",
    "tags": ["family", "money", "boundaries"],
    "fr": {
      "context": "Un membre de ta famille te demande de l'argent \"parce que la famille, c\'est la famille\".",
      "question": "Tu acceptes ? Tu refuses ? Comment tu fixes une limite ?"    },
    "en": {
      "context": "A family member asks you for money \"because family is family\".",
      "question": "Do you agree? Refuse? How do you set a boundary?"    }
  },
  {
    "id": "P044",
    "tags": ["ethics", "work", "loyalty"],
    "fr": {
      "context": "Ton entreprise fait quelque chose que tu trouves moralement douteux, mais ton job te plaît.",
      "question": "Tu restes ? Tu pars ? Tu essayes de changer de l'intérieur ?"    },
    "en": {
      "context": "Your company does something you find morally questionable, but you like your job.",
      "question": "Do you stay? Quit? Try to change things from the inside?"    }
  },
  {
    "id": "P045",
    "tags": ["friends", "honesty", "conflict"],
    "fr": {
      "context": "Un ami te demande : \"Tu me trouves grossi ?\" et tu penses que oui.",
      "question": "Tu réponds comment ? Tu dis quoi mot pour mot ?"    },
    "en": {
      "context": "A friend asks: \"Do you think I\'ve gained weight?\" and you think yes.",
      "question": "How do you answer? What do you say word-for-word?"    }
  },
  {
    "id": "P046",
    "tags": ["work", "negotiation", "career"],
    "fr": {
      "context": "On te propose une promotion, mais sans augmentation claire. On te dit : \"Ça viendra plus tard.\"",
      "question": "Tu acceptes ? Tu négocies ? Comment ?"    },
    "en": {
      "context": "You're offered a promotion, but no clear raise. They say: \"It will come later.\"",
      "question": "Do you accept? Negotiate? How?"    }
  },
  {
    "id": "P047",
    "tags": ["daily-life", "consumer", "ethics"],
    "fr": {
      "context": "Tu achètes un truc en ligne. Il arrive cassé. Le service client est lent et te balade.",
      "question": "Tu fais quoi pour résoudre ça efficacement ?"    },
    "en": {
      "context": "You buy something online. It arrives broken. Customer support is slow and keeps stalling.",
      "question": "What do you do to resolve it efficiently?"    }
  },
  {
    "id": "P048",
    "tags": ["social", "work-life", "values"],
    "fr": {
      "context": "Un ami se définit entièrement par son boulot et te juge si tu parles d'autre chose.",
      "question": "Ça t'attire ou ça t'agace ? Qu'est-ce que tu lui dis ?"    },
    "en": {
      "context": "A friend defines themselves entirely by their job and judges you if you talk about other things.",
      "question": "Do you find it attractive or annoying? What do you say to them?"    }
  },
  {
    "id": "P049",
    "tags": ["communication", "conflict", "apologies"],
    "fr": {
      "context": "Quelqu'un te fait une excuse du style : \"Désolé si tu l\'as mal pris.\"",
      "question": "Pour toi, c'est une vraie excuse ? Tu réponds quoi ?"    },
    "en": {
      "context": "Someone gives you an apology like: \"Sorry if you took it the wrong way.\"",
      "question": "Is that a real apology to you? How do you respond?"    }
  },
  {
    "id": "P050",
    "tags": ["work", "communication", "expectations"],
    "fr": {
      "context": "On te donne une mission floue au travail, sans critères de réussite, puis on te reproche le résultat.",
      "question": "Tu fais quoi la prochaine fois ? Quelles questions tu poses au début ?"    },
    "en": {
      "context": "You're given a vague task at work with no success criteria, then later blamed for the outcome.",
      "question": "What do you do next time? What questions do you ask at the start?"    }
  }
];

// Get a random subset of prompts for the assessment, ensuring no consecutive repeats
export function getRandomPrompts(count: number = 3): FluencyPrompt[] {
  const shuffled = [...FLUENCY_PROMPTS].sort(() => Math.random() - 0.5);
  const selected: FluencyPrompt[] = [];
  
  for (let i = 0; i < shuffled.length && selected.length < count; i++) {
    const current = shuffled[i];
    const previous = selected[selected.length - 1];
    
    // Don't add if it's the same as the previous prompt
    if (!previous || current.id !== previous.id) {
      selected.push(current);
    }
  }
  
  // If we couldn't get enough unique prompts (unlikely with 50 prompts), fill remaining
  while (selected.length < count && selected.length < FLUENCY_PROMPTS.length) {
    const remaining = FLUENCY_PROMPTS.filter(p => !selected.find(s => s.id === p.id));
    if (remaining.length > 0) {
      selected.push(remaining[0]);
    } else {
      break;
    }
  }
  
  return selected;
}

// Keep backward compatibility
export type FluencyPictureCard = FluencyPrompt;
export const FLUENCY_PICTURE_CARDS = FLUENCY_PROMPTS;
export const getRandomPictureCards = getRandomPrompts;
