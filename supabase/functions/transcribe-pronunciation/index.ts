import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;

  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);

    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }

    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Normalize text for comparison
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents for comparison
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/);
}

// Calculate weighted similarity with emphasis on minimal pairs
function calculateSimilarity(
  targetText: string, 
  transcript: string, 
  minimalPairs?: string[]
): { similarity: number; matchedWords: number; totalWords: number; minimalPairAccuracy: number } {
  const targetWords = normalizeText(targetText);
  const transcriptWords = normalizeText(transcript);
  
  // Normalize minimal pairs for comparison
  const normalizedPairs = (minimalPairs || []).map(word => 
    word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  let matchCount = 0;
  let minimalPairMatches = 0;
  let minimalPairTotal = 0;
  const usedIndices = new Set<number>();

  for (const targetWord of targetWords) {
    const isMinimalPair = normalizedPairs.includes(targetWord);
    if (isMinimalPair) minimalPairTotal++;

    for (let i = 0; i < transcriptWords.length; i++) {
      if (!usedIndices.has(i) && transcriptWords[i] === targetWord) {
        matchCount++;
        if (isMinimalPair) minimalPairMatches++;
        usedIndices.add(i);
        break;
      }
    }
  }

  // Calculate base similarity
  const baseSimilarity = targetWords.length > 0 
    ? (matchCount / targetWords.length) * 100 
    : 0;

  // Calculate minimal pair accuracy
  const minimalPairAccuracy = minimalPairTotal > 0 
    ? (minimalPairMatches / minimalPairTotal) * 100 
    : 100;

  // Weighted similarity: 60% base accuracy + 40% minimal pair accuracy
  const weightedSimilarity = minimalPairTotal > 0
    ? (baseSimilarity * 0.6) + (minimalPairAccuracy * 0.4)
    : baseSimilarity;

  return {
    similarity: Math.round(weightedSimilarity),
    matchedWords: matchCount,
    totalWords: targetWords.length,
    minimalPairAccuracy: Math.round(minimalPairAccuracy)
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, targetText, itemId, minimalPairs } = await req.json();

    if (!audio) {
      throw new Error("No audio data provided");
    }

    console.log(`[TRANSCRIBE] Processing audio for item: ${itemId}`);
    console.log(`[TRANSCRIBE] Target text: ${targetText}`);
    console.log(`[TRANSCRIBE] Minimal pairs: ${minimalPairs?.join(", ") || "none"}`);

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[TRANSCRIBE] Audio size: ${binaryAudio.length} bytes`);

    // Prepare form data for Whisper
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(binaryAudio)], { type: "audio/webm" });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "fr"); // Force French language
    
    // Add prompt with minimal pairs vocabulary to reduce transcription bias
    // This primes Whisper to recognize both words in minimal pairs without bias
    if (minimalPairs && minimalPairs.length > 0) {
      const promptVocabulary = `Vocabulaire français: ${minimalPairs.join(", ")}. Ces mots doivent être transcrits exactement comme prononcés.`;
      formData.append("prompt", promptVocabulary);
      console.log(`[TRANSCRIBE] Whisper prompt: ${promptVocabulary}`);
    }

    // Send to OpenAI Whisper
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("[TRANSCRIBE] OPENAI_API_KEY not configured");
      throw new Error("Transcription service not configured");
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TRANSCRIBE] Whisper API error: ${errorText}`);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.text || "";
    
    console.log(`[TRANSCRIBE] Transcript: ${transcript}`);

    // Calculate weighted similarity score
    const { similarity, matchedWords, totalWords, minimalPairAccuracy } = calculateSimilarity(
      targetText, 
      transcript, 
      minimalPairs
    );

    console.log(`[TRANSCRIBE] Similarity: ${similarity}%, Minimal pair accuracy: ${minimalPairAccuracy}%`);

    return new Response(
      JSON.stringify({
        transcript,
        similarity,
        targetWords: totalWords,
        matchedWords,
        minimalPairAccuracy,
        itemId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[TRANSCRIBE] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});