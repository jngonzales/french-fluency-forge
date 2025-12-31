import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, speed, stability } = await req.json();

    if (!text) {
      throw new Error("No text provided");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error("[TTS] ELEVENLABS_API_KEY not configured");
      throw new Error("TTS service not configured");
    }

    // Use a French voice - Laura is a good neutral French voice
    // You can change this to another French voice ID
    const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura - neutral French

    // Speed parameter: default 0.9 for clarity, can be increased for fast speech
    // Range: 0.7 - 1.2 (ElevenLabs supports up to 1.2)
    const speechSpeed = speed ?? 0.9;
    
    // Stability parameter: default 0.6, lower for more natural/messy variation
    // Range: 0 - 1 (lower = more expressive/variable)
    const speechStability = stability ?? 0.6;

    console.log(`[TTS] Generating audio for text: "${text.substring(0, 50)}..."`);
    console.log(`[TTS] Using voice ID: ${selectedVoiceId}, speed: ${speechSpeed}, stability: ${speechStability}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
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

    const audioBuffer = await response.arrayBuffer();
    console.log(`[TTS] Generated audio size: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
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