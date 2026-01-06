import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to wrap raw PCM data in a WAV header
function wrapPcmInWav(pcmData: Uint8Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM data
  const wavData = new Uint8Array(buffer);
  wavData.set(pcmData, headerSize);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, speed, stability, outputFormat } = await req.json();

    if (!text) {
      throw new Error("No text provided");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error("[TTS] ELEVENLABS_API_KEY not configured");
      throw new Error("TTS service not configured");
    }

    // Use a French voice - Laura is a good neutral French voice
    const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura - neutral French

    // Speed parameter: default 0.9 for clarity
    const speechSpeed = speed ?? 0.9;
    
    // Stability parameter: default 0.6
    const speechStability = stability ?? 0.6;

    // Output format: 
    // - mp3_44100_128 (default) for playback
    // - pcm_16000 for Azure pronunciation assessment (raw 16kHz PCM)
    // - pcm_22050, pcm_24000, pcm_44100 for other use cases
    const selectedOutputFormat = outputFormat || "mp3_44100_128";
    
    // Determine content type based on output format
    let contentType = "audio/mpeg";
    if (selectedOutputFormat.startsWith("pcm_")) {
      contentType = "audio/wav"; // We'll wrap PCM in WAV header
    }

    console.log(`[TTS] Generating audio for text: "${text.substring(0, 50)}..."`);
    console.log(`[TTS] Using voice ID: ${selectedVoiceId}, speed: ${speechSpeed}, format: ${selectedOutputFormat}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=${selectedOutputFormat}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: speechStability,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: speechSpeed,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error: ${errorText}`);
      throw new Error(`TTS generation failed: ${response.status}`);
    }

    let audioBuffer = await response.arrayBuffer();
    console.log(`[TTS] Generated audio size: ${audioBuffer.byteLength} bytes`);

    // If PCM format, wrap in WAV header for compatibility
    if (selectedOutputFormat.startsWith("pcm_")) {
      const sampleRate = parseInt(selectedOutputFormat.split("_")[1]) || 16000;
      audioBuffer = wrapPcmInWav(new Uint8Array(audioBuffer), sampleRate);
      console.log(`[TTS] Wrapped PCM in WAV header, final size: ${audioBuffer.byteLength} bytes`);
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[TTS] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});