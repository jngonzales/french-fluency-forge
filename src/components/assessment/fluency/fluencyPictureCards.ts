// Fluency Picture Cards - French speaking prompts with images
// Images from OpenClipart (public domain)

export interface FluencyPictureCard {
  id: string;
  image: string;
  promptFr: string;
  followupFr: string;
}

export const FLUENCY_PICTURE_CARDS: FluencyPictureCard[] = [
  {
    id: "fluPic-01",
    image: "https://openclipart.org/detail/191160/messy-room",
    promptFr: "Décris la pièce. Qui est responsable du désordre ? Pourquoi ?",
    followupFr: "Qu'est-ce que tu ferais maintenant : ranger, parler à quelqu'un, ou partir ?"
  },
  {
    id: "fluPic-02",
    image: "https://openclipart.org/detail/327749/kitchen-with-dirty-dishes",
    promptFr: "Qu'est-ce qui se passe dans la cuisine ? Qui doit faire la vaisselle ?",
    followupFr: "Si c'est ton colocataire, tu lui dis quoi (gentiment) ?"
  },
  {
    id: "fluPic-03",
    image: "https://openclipart.org/detail/319792/argument-silhouette",
    promptFr: "Deux personnes se disputent. Qui a tort, selon toi ?",
    followupFr: "Comment tu peux calmer la situation ?"
  },
  {
    id: "fluPic-04",
    image: "https://openclipart.org/detail/309036/couple-arguing-by-mstlion-silhouette",
    promptFr: "Un couple se dispute. Est-ce que quelqu'un exagère ?",
    followupFr: "Qu'est-ce que tu conseillerais à ce couple ?"
  },
  {
    id: "fluPic-05",
    image: "https://openclipart.org/detail/179384/waiting-in-line",
    promptFr: "Les gens attendent dans une file. Imagine : quelqu'un passe devant. C'est grave ?",
    followupFr: "Tu fais quoi : tu dis quelque chose, ou tu laisses ? Pourquoi ?"
  },
  {
    id: "fluPic-06",
    image: "https://openclipart.org/detail/333553/no-drinking-and-driving",
    promptFr: "Un ami veut conduire après avoir bu. Tu lui fais confiance ?",
    followupFr: "Qu'est-ce que tu dis exactement pour l'arrêter ?"
  },
  {
    id: "fluPic-07",
    image: "https://openclipart.org/detail/49105/boy-driving-car-cartoon",
    promptFr: "Tu vois quelqu'un qui conduit. Il/elle a l'air prudent(e) ou dangereux(se) ?",
    followupFr: "Raconte une fois où tu as eu peur dans une voiture."
  },
  {
    id: "fluPic-08",
    image: "https://openclipart.org/detail/322047/a-woman-riding-a-bike-fast-remix",
    promptFr: "Cette personne roule vite à vélo. C'est une bonne idée ? Pourquoi ?",
    followupFr: "Quelles règles de sécurité tu suis à vélo ?"
  },
  {
    id: "fluPic-09",
    image: "https://openclipart.org/detail/223115/multiple-thoughts-man-line-art",
    promptFr: "Cette personne pense à beaucoup de choses. Elle est stressée ? À cause de quoi ?",
    followupFr: "Toi, quand tu es stressé(e), tu fais quoi ?"
  },
  {
    id: "fluPic-10",
    image: "https://openclipart.org/detail/227553/student-asking-question",
    promptFr: "En classe, quelqu'un pose une question. C'est courageux ?",
    followupFr: "Toi, tu poses des questions facilement ? Pourquoi ?"
  },
  {
    id: "fluPic-11",
    image: "https://openclipart.org/detail/201522/no-littering-sign",
    promptFr: "Quelqu'un jette des déchets par terre. Qui est en tort ?",
    followupFr: "Que ferais-tu si tu voyais ça dans la rue ?"
  },
  {
    id: "fluPic-12",
    image: "https://openclipart.org/detail/226337/Camouflage",
    promptFr: "Cette personne fait semblant de lire, mais elle dort. C'est 'pas sérieux' ?",
    followupFr: "Dans quel moment toi tu fais semblant (au travail/à l'école) ?"
  },
  {
    id: "fluPic-13",
    image: "https://openclipart.org/detail/168343/Cinema",
    promptFr: "Tu es au cinéma. Imagine : quelqu'un parle très fort. Qui a tort ?",
    followupFr: "Tu dis quoi à la personne ? (simple et poli)"
  },
  {
    id: "fluPic-14",
    image: "https://openclipart.org/detail/332669/hygiene-products",
    promptFr: "Tu partages une salle de bain. Quelqu'un laisse tout sale. Tu fais quoi ?",
    followupFr: "Donne 3 règles simples pour vivre avec un colocataire."
  },
  {
    id: "fluPic-15",
    image: "https://openclipart.org/detail/325237/no-sleep-icon",
    promptFr: "Tu ne dors pas bien. Pourquoi ? Qu'est-ce que tu ressens ?",
    followupFr: "Tu as une solution simple ?"
  },
  {
    id: "fluPic-16",
    image: "https://openclipart.org/detail/822/police-car",
    promptFr: "Tu vois une voiture de police. Qu'est-ce qui se passe, selon toi ?",
    followupFr: "Tu te sens en sécurité ou inquiet/inquiète ? Pourquoi ?"
  },
  {
    id: "fluPic-17",
    image: "https://openclipart.org/detail/233914/car-side-view",
    promptFr: "Imagine : cette voiture est abîmée. Qui est responsable ?",
    followupFr: "Quelles informations tu donnes à l'assurance ?"
  },
  {
    id: "fluPic-18",
    image: "https://openclipart.org/detail/286088/important",
    promptFr: "Tu reçois une note 'Important'. Tu penses que c'est quoi ?",
    followupFr: "Tu fais quoi en premier : appeler, répondre, ou attendre ?"
  },
  {
    id: "fluPic-19",
    image: "https://openclipart.org/detail/353395/silhouette-bowing-remix",
    promptFr: "Deux personnes se saluent. Imagine : une personne est impolie. Qui ? Pourquoi ?",
    followupFr: "Dans ton pays, comment on dit bonjour poliment ?"
  },
  {
    id: "fluPic-20",
    image: "https://openclipart.org/detail/326906/high-voltage-power-lines-silhouette",
    promptFr: "Tu vois un endroit dangereux. Est-ce que les gens respectent les règles ?",
    followupFr: "Raconte une situation où quelqu'un n'a pas fait attention."
  }
];

// Get a random subset of cards for the assessment
export function getRandomPictureCards(count: number = 3): FluencyPictureCard[] {
  const shuffled = [...FLUENCY_PICTURE_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
