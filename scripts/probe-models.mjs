/**
 * probe-models.mjs
 * Probes each model in the fallback chain against the Gemini Developer API
 * using the project's API key directly (no App Check, no browser).
 *
 * Usage: node scripts/probe-models.mjs
 * Reads VITE_FIREBASE_API_KEY from .env.local automatically.
 *
 * NOT committed — listed in .gitignore via scripts/*.probe.* pattern.
 * This file itself is safe to commit (no secrets embedded).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── Read .env.local ──────────────────────────────────────────────────────────
function readEnv() {
  const envPath = join(ROOT, ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && val) env[key] = val;
  }
  return env;
}

// ── Probe a single model ─────────────────────────────────────────────────────
async function probeModel(apiKey, modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: "Reply with exactly one word: ready" }] }],
    generationConfig: { maxOutputTokens: 8 },
  };

  const start = Date.now();
  let status, text, inferenceSource;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    status = res.status;
    text = await res.text();
    if (res.ok) {
      const json = JSON.parse(text);
      inferenceSource = json?.usageMetadata ? "in_cloud (REST)" : "unknown";
    }
  } catch (err) {
    status = "NETWORK_ERROR";
    text = err.message;
  }
  const ms = Date.now() - start;
  return { modelName, status, ms, inferenceSource, text };
}

// ── Main ─────────────────────────────────────────────────────────────────────
const env = readEnv();
const apiKey = env["VITE_FIREBASE_API_KEY"];
if (!apiKey) {
  console.error("VITE_FIREBASE_API_KEY not found in .env.local");
  process.exit(1);
}

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

console.log("\nProbing Gemini Developer API — Firebase AI Logic backend");
console.log("Project: VITE_FIREBASE_PROJECT_ID —", env["VITE_FIREBASE_PROJECT_ID"] ?? "not set");
console.log("─".repeat(70));

for (const model of MODELS) {
  process.stdout.write(`  ${model.padEnd(28)} ... `);
  const result = await probeModel(apiKey, model);
  if (result.status === 200) {
    console.log(`✅  HTTP 200  ${result.ms}ms  source: ${result.inferenceSource}`);
  } else {
    // Parse error detail without echoing the full response body
    let detail = "";
    try {
      const parsed = JSON.parse(result.text);
      detail = parsed?.error?.message ?? parsed?.error?.status ?? "";
    } catch {
      detail = String(result.text).slice(0, 120);
    }
    console.log(`❌  HTTP ${result.status}  ${result.ms}ms  — ${detail}`);
  }
}

console.log("─".repeat(70));
console.log("Note: this probe uses the REST API directly (no App Check).");
console.log("A 200 here confirms the model is available for this API key.");
console.log("App Check is still required for the browser path.\n");
