/**
 * Tour narration — Mistral Voxtral TTS (server function) with browser
 * speechSynthesis as automatic fallback.
 *
 * Server path: POST /v1/audio/speech → { audio_data: "<base64 mp3>" }
 * Fallback: browser speechSynthesis (no network, no key required).
 */

import { createServerFn } from "@tanstack/react-start";

// ─── availability ─────────────────────────────────────────────────────────────

/** Returns true when either Mistral TTS or browser speechSynthesis is usable. */
export async function checkTourNarrationAvailability(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return true; // Mistral server fn always available; speechSynthesis is fallback
}

// ─── locale → BCP-47 lang hint (fallback only) ────────────────────────────────

const LANG: Record<string, string> = { en: "en-US", pt: "pt-PT", es: "es-ES" };

// ─── active handles ───────────────────────────────────────────────────────────

let _audio: HTMLAudioElement | null = null;
let _utterance: SpeechSynthesisUtterance | null = null;

export function stopTourNarration(): void {
  if (_audio) {
    _audio.pause();
    _audio.src = "";
    _audio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  _utterance = null;
}

// ─── server function ──────────────────────────────────────────────────────────

const _synthesiseMistral = createServerFn({ method: "POST" })
  .validator((d: { text: string }) => d)
  .handler(async ({ data }) => {
    const key = process.env["MISTRAL_API_KEY"];
    if (!key) return { audioBase64: "" };

    const res = await fetch("https://api.mistral.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voxtral-mini-tts-latest",
        input: data.text,
        voice: "en_paul_neutral",
      }),
    });

    if (!res.ok) return { audioBase64: "" };

    const json = (await res.json()) as { audio_data?: string };
    return { audioBase64: json.audio_data ?? "" };
  });

// ─── synthesise ───────────────────────────────────────────────────────────────

export interface SynthesiseResult {
  audioBase64: string;
}

/**
 * Speak `text` using Mistral TTS (server) or browser speechSynthesis (fallback).
 * Resolves when audio ends or immediately if both paths are unavailable.
 */
export async function synthesiseTourStep({
  data,
}: {
  data: { text: string; locale: string };
}): Promise<SynthesiseResult> {
  if (typeof window === "undefined") return { audioBase64: "" };

  stopTourNarration();

  // ── Mistral path ────────────────────────────────────────────────────────────
  try {
    const result = await _synthesiseMistral({ data: { text: data.text } });
    if (result.audioBase64) {
      return new Promise((resolve, reject) => {
        const src = `data:audio/mp3;base64,${result.audioBase64}`;
        const audio = new Audio(src);
        _audio = audio;
        audio.onended = () => {
          _audio = null;
          resolve({ audioBase64: result.audioBase64 });
        };
        audio.onerror = () => {
          _audio = null;
          reject(new Error("Audio playback error"));
        };
        audio.play().catch(reject);
      });
    }
  } catch {
    // fall through to speechSynthesis
  }

  // ── speechSynthesis fallback ────────────────────────────────────────────────
  if (!("speechSynthesis" in window)) return { audioBase64: "" };

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(data.text);
    utterance.lang = LANG[data.locale] ?? "en-US";
    utterance.rate = 0.95;
    _utterance = utterance;
    utterance.onend = () => {
      _utterance = null;
      resolve({ audioBase64: "" });
    };
    utterance.onerror = (event) => {
      _utterance = null;
      if (event.error === "interrupted" || event.error === "canceled") {
        resolve({ audioBase64: "" });
      } else {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      }
    };
    window.speechSynthesis.speak(utterance);
  });
}
