# Comprehension Audio Generation Guide

## Current State

### Comprehension Item Structure

Each comprehension item has this structure:

```typescript
interface ComprehensionItem {
  id: string;                    // e.g., "lc_fr_a1_0001"
  language: string;              // "fr-FR"
  cefr_level: string;            // "A1", "A2", "B1", "B2"
  transcript_fr: string;         // The French text to be spoken
  word_count: number;            // Word count
  estimated_duration_s: number;  // Estimated duration in seconds
  prompt: { fr: string; en: string };
  options: Array<{ id: string; fr: string; en: string }>;
  answer_key: { correct_option_ids: string[] };
}
```

### Example Items (5 samples)

**1. lc_fr_a1_0001 (A1)**
- **Transcript**: "Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture."
- **Word count**: 14
- **Duration**: ~5.6 seconds

**2. lc_fr_a1_0002 (A1)**
- **Transcript**: "Au café, Paul commande un thé sans sucre, attend deux minutes, puis demande l'addition et son ticket avant de partir."
- **Word count**: 20
- **Duration**: ~8.0 seconds

**3. lc_fr_a2_0003 (A2)**
- **Transcript**: "Dans le bus, quelqu'un a oublié un sac bleu sous un siège. Le chauffeur l'annonce au micro, le met devant lui, et dit de le récupérer au terminus."
- **Word count**: 28
- **Duration**: ~11.2 seconds

**4. lc_fr_a2_0004 (A2)**
- **Transcript**: "On se retrouve à la station République à 18 h, près de la sortie 3. Désolé, mon bus est bloqué dans les embouteillages, je serai dix minutes en retard. Ne pars pas."
- **Word count**: 32
- **Duration**: ~12.8 seconds

**5. lc_fr_b1_0007 (B1)**
- **Transcript**: "Annonce en gare : le train pour Lyon de 17 h 12 est annulé à cause d'un problème technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent à l'heure."
- **Word count**: 45
- **Duration**: ~18.0 seconds

**6. lc_fr_b2_0011 (B2)**
- **Transcript**: "Au magasin, Léa revient avec un casque audio qui grésille. Elle veut être remboursée, mais elle a perdu le ticket de caisse. Le vendeur propose un échange ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable."
- **Word count**: 43
- **Duration**: ~17.2 seconds

**7. lc_fr_a2_0005 (A2)**
- **Transcript**: "Une voisine crie dans la rue : son chat est coincé dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaît pas le numéro et son téléphone est presque déchargé. Elle demande à un passant de l'aider."
- **Word count**: 42
- **Duration**: ~16.8 seconds

**8. lc_fr_b1_0008 (B1)**
- **Transcript**: "Dans la colocation, ils se disputent la facture d'électricité : l'un dit qu'il ne cuisine jamais, l'autre laisse la lumière allumée. Après quelques minutes, ils se calment et décident de suivre leur consommation avec une appli pendant un mois, à partir d'aujourd'hui, puis de partager la facture selon l'usage réel."
- **Word count**: 50
- **Duration**: ~20.0 seconds

**9. lc_fr_a2_0009 (A2)**
- **Transcript**: "Au restaurant, elle précise qu'elle est allergique aux noix. Le serveur part vérifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce."
- **Word count**: 38
- **Duration**: ~15.2 seconds

**10. lc_fr_b2_0012 (B2)**
- **Transcript**: "Lors d'une réunion de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerçants sont pour, d'autres craignent de perdre des clients. La mairie propose un essai d'un mois et un vote ensuite. Un habitant rappelle qu'il faut garder un accès pour les ambulances."
- **Word count**: 47
- **Duration**: ~18.8 seconds

## Audio Status

**Current Implementation:**
- ❌ **No pre-generated audio** - Audio is generated on-demand when users access each item
- ✅ Audio is generated using `french-tts` edge function (ElevenLabs TTS)
- ✅ Audio is stored in memory as blob URLs (not persisted)
- ⚠️ Each user generates audio fresh on each visit (inefficient, slower)

**Total Items:** 12 comprehension exercises

## Pre-Generation Script

A script has been created to pre-generate all audio files:

**Location:** `src/components/assessment/comprehension/scripts/generateComprehensionAudio.ts`

### How to Use

**Option 1: Run from Browser Console**

1. Open your app in the browser
2. Open Developer Console (F12)
3. Import and run:

```javascript
// Import the function
import { generateAllComprehensionAudio } from './src/components/assessment/comprehension/scripts/generateComprehensionAudio.ts';

// Run it
await generateAllComprehensionAudio();
```

**Option 2: Create a Dev Page**

Create a dev page that calls the function on mount (similar to other dev tools).

**Option 3: Run as One-Time Migration**

Add it to a migration script or run it once during deployment.

### Prerequisites

1. **Storage Bucket**: Create `comprehension-audio` bucket in Supabase Storage
   - Or update `STORAGE_BUCKET` constant in the script to use `phrases-audio` (existing bucket)

2. **TTS API Key**: Ensure `ELEVENLABS_API_KEY` is set in Supabase Edge Function environment

3. **Bucket Permissions**: Ensure the bucket allows public read access (for public URLs)

### What the Script Does

1. Iterates through all 12 comprehension items
2. Generates audio for each `transcript_fr` using `french-tts` edge function
3. Uploads MP3 files to Supabase Storage (`comprehension-audio` bucket)
4. Files are named: `{itemId}.mp3` (e.g., `lc_fr_a1_0001.mp3`)
5. Returns public URLs for each file
6. Includes error handling and progress logging

### Storage Structure

```
comprehension-audio/
├── lc_fr_a1_0001.mp3
├── lc_fr_a1_0002.mp3
├── lc_fr_a2_0003.mp3
├── lc_fr_a2_0004.mp3
├── lc_fr_a2_0005.mp3
├── lc_fr_a2_0006.mp3
├── lc_fr_a2_0009.mp3
├── lc_fr_b1_0007.mp3
├── lc_fr_b1_0008.mp3
├── lc_fr_b1_0010.mp3
├── lc_fr_b2_0011.mp3
└── lc_fr_b2_0012.mp3
```

## Next Steps: Update ComprehensionModule

After pre-generating audio, update `ComprehensionModule.tsx` to:

1. Check if pre-generated audio exists in storage first
2. Fall back to on-demand generation if not found
3. Cache the public URL for faster subsequent loads

This will improve performance and reduce TTS API calls.

