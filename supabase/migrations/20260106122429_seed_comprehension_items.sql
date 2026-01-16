-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au cafÃ©, Paul commande un thÃ© sans sucre, attend deux minutes, puis demande l''addition et son ticket avant de partir.',
  20,
  8.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Paul commande un thÃ© sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition et le ticket.", "en": "He asks for the bill and the receipt."},
    {"id": "o4", "fr": "Paul commande un cafÃ© au lait.", "en": "Paul orders a coffee with milk."},
    {"id": "o5", "fr": "Il demande la carte des desserts.", "en": "He asks for the dessert menu."},
    {"id": "o6", "fr": "Il reste au cafÃ© pendant une heure.", "en": "He stays at the cafe for an hour."},
    {"id": "o7", "fr": "Il part sans payer.", "en": "He leaves without paying."},
    {"id": "o8", "fr": "Il demande seulement un verre d''eau.", "en": "He only asks for a glass of water."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oubliÃ© un sac bleu sous un siÃ¨ge. Le chauffeur l''annonce au micro, le met devant lui, et dit de le rÃ©cupÃ©rer au terminus.',
  28,
  11.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oubliÃ© un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it over the speaker."},
    {"id": "o3", "fr": "Le chauffeur garde le sac devant lui.", "en": "The driver keeps the bag at the front."},
    {"id": "o4", "fr": "On peut rÃ©cupÃ©rer le sac au terminus.", "en": "You can pick up the bag at the end of the line."},
    {"id": "o5", "fr": "Le sac est rouge.", "en": "The bag is red."},
    {"id": "o6", "fr": "Le chauffeur jette le sac.", "en": "The driver throws the bag away."},
    {"id": "o7", "fr": "Il faut aller au commissariat pour le rÃ©cupÃ©rer.", "en": "You must go to the police station to retrieve it."},
    {"id": "o8", "fr": "Le bus s''arrÃªte tout de suite pour chercher le propriÃ©taire.", "en": "The bus stops immediately to find the owner."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve Ã  la station RÃ©publique Ã  18 h, prÃ¨s de la sortie 3. DÃ©solÃ©, mon bus est bloquÃ© dans les embouteillages, je serai dix minutes en retard. Ne pars pas.',
  32,
  12.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est Ã  la station RÃ©publique.", "en": "The meeting point is RÃ©publique station."},
    {"id": "o2", "fr": "Le rendez-vous est Ã  18 h.", "en": "The meeting is at 6 pm."},
    {"id": "o3", "fr": "La personne aura environ dix minutes de retard.", "en": "The person will be about ten minutes late."},
    {"id": "o4", "fr": "Son bus est bloquÃ© dans les embouteillages.", "en": "Their bus is stuck in traffic."},
    {"id": "o5", "fr": "Le rendez-vous est Ã  8 h.", "en": "The meeting is at 8 am."},
    {"id": "o6", "fr": "Ils se retrouvent Ã  la station Bastille.", "en": "They are meeting at Bastille station."},
    {"id": "o7", "fr": "La personne est dÃ©jÃ  arrivÃ©e.", "en": "The person has already arrived."},
    {"id": "o8", "fr": "On lui dit de ne pas attendre.", "en": "They tell the other person not to wait."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0005',
  'fr-FR',
  'A2',
  'Une voisine crie dans la rue : son chat est coincÃ© dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaÃ®t pas le numÃ©ro et son tÃ©lÃ©phone est presque dÃ©chargÃ©. Elle demande Ã  un passant de l''aider.',
  42,
  16.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un chat est coincÃ© dans un arbre.", "en": "A cat is stuck in a tree."},
    {"id": "o2", "fr": "Elle veut appeler les pompiers.", "en": "She wants to call the fire department."},
    {"id": "o3", "fr": "Elle ne connaÃ®t pas le numÃ©ro Ã  appeler.", "en": "She doesn''t know the number to call."},
    {"id": "o4", "fr": "Son tÃ©lÃ©phone est presque dÃ©chargÃ©.", "en": "Her phone is almost out of battery."},
    {"id": "o5", "fr": "Un chien est coincÃ© dans un arbre.", "en": "A dog is stuck in a tree."},
    {"id": "o6", "fr": "Les pompiers sont dÃ©jÃ  en route.", "en": "The fire department is already on the way."},
    {"id": "o7", "fr": "Elle veut appeler la police pour un vol.", "en": "She wants to call the police about a theft."},
    {"id": "o8", "fr": "Elle cherche un taxi.", "en": "She is looking for a taxi."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0006',
  'fr-FR',
  'A2',
  'On dÃ©cale la rÃ©union de cet aprÃ¨s-midi Ã  demain matin, Ã  9 h, parce que le client est malade. J''envoie tout de suite un e-mail avec la nouvelle heure et le lien visio. Garde ton aprÃ¨s-midi libre.',
  37,
  14.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "La rÃ©union est dÃ©placÃ©e Ã  demain matin, Ã  9 h.", "en": "The meeting is moved to tomorrow morning at 9."},
    {"id": "o2", "fr": "Le client est malade.", "en": "The client is sick."},
    {"id": "o3", "fr": "Un e-mail va confirmer la nouvelle heure.", "en": "An email will confirm the new time."},
    {"id": "o4", "fr": "Le lien visio est envoyÃ© par e-mail.", "en": "The video-call link is sent by email."},
    {"id": "o5", "fr": "La rÃ©union reste cet aprÃ¨s-midi.", "en": "The meeting stays this afternoon."},
    {"id": "o6", "fr": "La rÃ©union est annulÃ©e dÃ©finitivement.", "en": "The meeting is canceled forever."},
    {"id": "o7", "fr": "Le client est en vacances.", "en": "The client is on vacation."},
    {"id": "o8", "fr": "La rÃ©union est dÃ©placÃ©e Ã  ce soir.", "en": "The meeting is moved to tonight."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Annonce en gare : le train pour Lyon de 17 h 12 est annulÃ© Ã  cause d''un problÃ¨me technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent Ã  l''heure.',
  45,
  18.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le train pour Lyon de 17 h 12 est annulÃ©.", "en": "The 5:12 pm train to Lyon is canceled."},
    {"id": "o2", "fr": "C''est Ã  cause d''un problÃ¨me technique.", "en": "It is due to a technical problem."},
    {"id": "o3", "fr": "Un bus de remplacement part du quai 5.", "en": "A replacement bus leaves from platform 5."},
    {"id": "o4", "fr": "On peut demander un remboursement au guichet.", "en": "You can request a refund at the ticket office."},
    {"id": "o5", "fr": "Le train a seulement dix minutes de retard.", "en": "The train is only ten minutes late."},
    {"id": "o6", "fr": "Le bus part du quai 2.", "en": "The bus leaves from platform 2."},
    {"id": "o7", "fr": "Le remboursement se fait uniquement en ligne.", "en": "Refunds are online only."},
    {"id": "o8", "fr": "Tous les trains sont annulÃ©s aujourd''hui.", "en": "All trains are canceled today."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0008',
  'fr-FR',
  'B1',
  'Dans la colocation, ils se disputent la facture d''Ã©lectricitÃ© : l''un dit qu''il ne cuisine jamais, l''autre laisse la lumiÃ¨re allumÃ©e. AprÃ¨s quelques minutes, ils se calment et dÃ©cident de suivre leur consommation avec une appli pendant un mois, Ã  partir d''aujourd''hui, puis de partager la facture selon l''usage rÃ©el.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Ils se disputent la facture d''Ã©lectricitÃ©.", "en": "They argue about the electricity bill."},
    {"id": "o2", "fr": "Ils dÃ©cident de suivre leur consommation avec une appli.", "en": "They decide to track their usage with an app."},
    {"id": "o3", "fr": "Ils le font pendant un mois.", "en": "They do it for one month."},
    {"id": "o4", "fr": "Ils partageront la facture selon l''usage rÃ©el.", "en": "They will split the bill based on actual usage."},
    {"id": "o5", "fr": "Ils se disputent la facture d''eau.", "en": "They argue about the water bill."},
    {"id": "o6", "fr": "Ils dÃ©cident de ne plus payer la facture.", "en": "They decide to stop paying the bill."},
    {"id": "o7", "fr": "Ils partagent forcÃ©ment 50/50.", "en": "They will definitely split it 50/50."},
    {"id": "o8", "fr": "Ils achÃ¨tent un nouveau frigo.", "en": "They buy a new fridge."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0009',
  'fr-FR',
  'A2',
  'Au restaurant, elle prÃ©cise qu''elle est allergique aux noix. Le serveur part vÃ©rifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce.',
  38,
  15.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Elle est allergique aux noix.", "en": "She is allergic to nuts."},
    {"id": "o2", "fr": "Le serveur vÃ©rifie la sauce en cuisine.", "en": "The waiter checks the sauce in the kitchen."},
    {"id": "o3", "fr": "La sauce contient des amandes.", "en": "The sauce contains almonds."},
    {"id": "o4", "fr": "Elle choisit une salade sans sauce.", "en": "She chooses a salad with no sauce."},
    {"id": "o5", "fr": "Elle est allergique au gluten.", "en": "She is allergic to gluten."},
    {"id": "o6", "fr": "La sauce ne contient aucune amande.", "en": "The sauce contains no almonds."},
    {"id": "o7", "fr": "Elle garde le mÃªme plat.", "en": "She keeps the same dish."},
    {"id": "o8", "fr": "Elle commande un dessert aux noix.", "en": "She orders a dessert with nuts."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0010',
  'fr-FR',
  'B1',
  'Le recruteur propose un entretien lundi Ã  11 h pour un poste de chef de projet. Le candidat demande si c''est 100 % Ã  distance ; on lui rÃ©pond : hybride, trois jours au bureau. Il demande la fourchette de salaire. Ils fixent un second appel mercredi avec la RH.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un entretien est proposÃ© lundi Ã  11 h.", "en": "An interview is proposed for Monday at 11."},
    {"id": "o2", "fr": "On lui rÃ©pond : hybride, trois jours au bureau.", "en": "They answer: hybrid, three days in the office."},
    {"id": "o3", "fr": "Le candidat demande la fourchette de salaire.", "en": "The candidate asks for the salary range."},
    {"id": "o4", "fr": "Ils fixent un second appel mercredi avec la RH.", "en": "They schedule a second call on Wednesday with HR."},
    {"id": "o5", "fr": "On lui rÃ©pond : c''est totalement Ã  distance.", "en": "They answer: it is fully remote."},
    {"id": "o6", "fr": "L''entretien est prÃ©vu dimanche matin.", "en": "The interview is set for Sunday morning."},
    {"id": "o7", "fr": "Ils discutent d''un poste de serveur au restaurant.", "en": "They discuss a waiter job at a restaurant."},
    {"id": "o8", "fr": "Le recruteur annule et ne rappelle pas.", "en": "The recruiter cancels and never calls back."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Au magasin, LÃ©a revient avec un casque audio qui grÃ©sille. Elle veut Ãªtre remboursÃ©e, mais elle a perdu le ticket de caisse. Le vendeur propose un Ã©change ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable.',
  43,
  17.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le casque audio grÃ©sille.", "en": "The headphones crackle."},
    {"id": "o2", "fr": "LÃ©a a perdu le ticket de caisse.", "en": "LÃ©a lost the receipt."},
    {"id": "o3", "fr": "Le vendeur propose un Ã©change ou un avoir.", "en": "The seller offers an exchange or store credit."},
    {"id": "o4", "fr": "Le vendeur appelle la responsable.", "en": "The seller calls the manager."},
    {"id": "o5", "fr": "LÃ©a a le ticket de caisse.", "en": "LÃ©a has the receipt."},
    {"id": "o6", "fr": "Le casque fonctionne parfaitement.", "en": "The headphones work perfectly."},
    {"id": "o7", "fr": "Le vendeur lui rend l''argent tout de suite, sans question.", "en": "The seller refunds her immediately, no questions asked."},
    {"id": "o8", "fr": "Elle vient juste comparer des prix.", "en": "She only came to compare prices."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0012',
  'fr-FR',
  'B2',
  'Lors d''une rÃ©union de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerÃ§ants sont pour, d''autres craignent de perdre des clients. La mairie propose un essai d''un mois et un vote ensuite. Un habitant rappelle qu''il faut garder un accÃ¨s pour les ambulances.',
  47,
  18.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "On propose de fermer la rue aux voitures le week-end.", "en": "They propose closing the street to cars on weekends."},
    {"id": "o2", "fr": "Certains commerÃ§ants sont pour, d''autres sont inquiets.", "en": "Some shop owners support it; others are worried."},
    {"id": "o3", "fr": "La mairie propose un essai d''un mois, puis un vote.", "en": "City hall proposes a one-month trial, then a vote."},
    {"id": "o4", "fr": "Il faut garder un accÃ¨s pour les ambulances.", "en": "They must keep access for ambulances."},
    {"id": "o5", "fr": "La rue sera fermÃ©e tous les jours, toute l''annÃ©e.", "en": "The street will be closed every day all year."},
    {"id": "o6", "fr": "Tout le monde est d''accord immÃ©diatement.", "en": "Everyone agrees immediately."},
    {"id": "o7", "fr": "La mairie abandonne l''idÃ©e dÃ¨s maintenant.", "en": "City hall drops the idea right away."},
    {"id": "o8", "fr": "Ils parlent d''ouvrir une nouvelle autoroute.", "en": "They talk about building a new highway."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

