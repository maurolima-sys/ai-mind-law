/**
 * Server function: ElevenLabs text-to-speech for guided-tour narration.
 *
 * Security model:
 *  - ELEVENLABS_API_KEY stays server-side only; never sent to the browser.
 *  - Input is validated and capped before forwarding to ElevenLabs.
 *  - The binary MP3 is returned directly as base64 so the browser can create
 *    a Blob URL without an extra round-trip.
 *
 * ElevenLabs endpoint used:
 *  POST /v1/text-to-speech/{voiceId}?output_format=mp3_44100_128
 *  Model: eleven_multilingual_v2  (supports EN, PT, ES natively)
 *
 * Voice map (all multilingual, one per locale):
 *  en → George  JBFqnCBsd6RMkjVDRZzb  (documentary narration, clear English)
 *  pt → Brian   nPczCjzI2devNBz1zQrb  (professional Portuguese)
 *  es → Laura   FGY2WhTYpPnrIDTdsKH5  (crisp Spanish)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

const VOICE_BY_LOCALE: Record<string, string> = {
  en: "JBFqnCBsd6RMkjVDRZzb", // George
  pt: "nPczCjzI2devNBz1zQrb", // Brian
  es: "FGY2WhTYpPnrIDTdsKH5", // Laura
};

/** Max characters forwarded to ElevenLabs per request (title + body joined). */
const MAX_CHARS = 600;

const inputSchema = z.object({
  text: z.string().trim().min(1).max(MAX_CHARS),
  locale: z.enum(["en", "pt", "es"]),
});

/**
 * Availability check — returns true only when the key is configured.
 * Called once on tour mount; result is cached in the browser for the session.
 */
export const checkTourNarrationAvailability = createServerFn({
  method: "GET",
}).handler(async () => Boolean(process.env["ELEVENLABS_API_KEY"]));

/**
 * Synthesise speech for one tour step.
 * Returns base64-encoded MP3 audio.
 */
export const synthesiseTourStep = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ audioBase64: string }> => {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) {
      throw new Error("Tour narration is not configured on the server.");
    }

    const voiceId = VOICE_BY_LOCALE[data.locale] ?? VOICE_BY_LOCALE["en"];
    const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: data.text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      console.error(`ElevenLabs TTS failed [${response.status}]: ${detail}`);
      throw new Error(`Tour narration failed [${response.status}].`);
    }

    const buffer = await response.arrayBuffer();
    // Convert to base64 in the Worker/Node environment.
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return { audioBase64 };
  });
