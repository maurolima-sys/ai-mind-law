/**
 * benchmark-gemini.mjs
 * Standalone latency benchmark for the 3 Gemini models in the app's fallback
 * chain. Measures the server-side path with NO app-code involvement.
 *
 * Two routes per model:
 *   (a) dev  — Gemini Developer API REST (no App Check):     https://generativelanguage.googleapis.com
 *   (b) fai  — Firebase AI Logic REST + App Check header:    https://firebasevertexai.googleapis.com
 *
 * Matrix: 3 models x {2k, 16k} chars x 2 routes = 12 calls, one run each,
 * no internal retries (each call is measured once, clean).
 *
 * Usage: node scripts/benchmark-gemini.mjs
 * Reads .env.local directly. Never prints credential values (prefix only).
 * Output: JSON + table on stdout. Safe to run repeatedly; each cell costs
 * one small generateContent call.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "..", "..", "..", ".vibe", "logs", "session");

const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const SIZES = { "2k": 2_000, "16k": 16_000 };
const MAX_OUTPUT_TOKENS = 2_000;
const CALL_TIMEOUT_MS = 45_000;

// ── env (names only; values stay internal) ────────────────────────────────────
function readEnv() {
  const envPath = join(ROOT, ".env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

// ── representative inputs: real contract prose from the saved analysis ────────
function buildInputs() {
  const analysis = JSON.parse(
    readFileSync(join(ROOT, "request_for_proposal-analysis.json"), "utf8"),
  ).analysis;
  // Collect real excerpts + descriptions from the analysis (real tender prose).
  const fragments = [];
  const walk = (value) => {
    if (typeof value === "string" && value.length > 40) fragments.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(analysis);
  for (const k of ["summary", "requirements", "deadlines", "specifications", "risks"])
    walk(analysis[k]);
  // Tile real prose up to the requested sizes (deterministic: base string repeat + slice).
  const base = fragments.join(" ").replace(/\s+/g, " ").trim();
  const results = {};
  for (const [label, size] of Object.entries(SIZES)) {
    let text = "";
    while (text.length < size) text += (text ? "\n" : "") + base;
    results[label] = text.slice(0, size);
  }
  return results;
}

// Representative structured-output schema, mirroring the app's chunk response shape.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    requirements: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          category: { type: "STRING" },
          mandatory: { type: "BOOLEAN" },
          confidence: { type: "STRING" },
          excerpt: { type: "STRING" },
          sourceIndex: { type: "INTEGER" },
        },
        required: ["description", "category", "mandatory"],
      },
    },
    deadlines: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          date: { type: "STRING" },
          excerpt: { type: "STRING" },
        },
        required: ["description", "date"],
      },
    },
    risks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          severity: { type: "STRING" },
          explanation: { type: "STRING" },
        },
        required: ["title", "severity"],
      },
    },
  },
  required: ["summary", "requirements", "deadlines", "risks"],
};

const PROMPT = (analysisText) =>
  `You are a tender contract analyst. Analyze the following tender text and return the structured object. Text:\n\n${analysisText}`;

// ── one measurement, no retries ───────────────────────────────────────────────
async function measure(label, url, headers, body) {
  const start = Date.now();
  let status, bodyText;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    status = res.status;
    bodyText = await res.text();
  } catch (err) {
    return {
      label,
      status: "NETWORK_ERROR",
      ms: Date.now() - start,
      detail: String(err?.message ?? err).slice(0, 120),
    };
  }
  const ms = Date.now() - start;
  if (status >= 400) {
    let detail = "";
    try {
      const parsed = JSON.parse(bodyText);
      detail = parsed?.error?.message ?? parsed?.error?.status ?? "";
    } catch {
      detail = bodyText.slice(0, 120);
    }
    return { label, status, ms, detail: detail.slice(0, 120) };
  }
  let outChars = "";
  try {
    const json = JSON.parse(bodyText);
    const candidates = json?.candidates ?? [];
    const parts = candidates?.[0]?.content?.parts ?? [];
    outChars = parts.map((p) => p.text ?? "").join("").length;
    if (json?.promptFeedback?.blockReason)
      return {
        label,
        status: "BLOCKED",
        ms,
        outChars,
        blockedReason: json.promptFeedback.blockReason,
      };
  } catch {}
  return { label, status, ms, outChars };
}

function r6Body(model, promptText, schema) {
  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}),
  };
  return {
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
const env = readEnv();
const apiKey = env["VITE_FIREBASE_API_KEY"];
const projectId = env["VITE_FIREBASE_PROJECT_ID"];
const appCheck = env["FIREBASE_APPCHECK_DEBUG_TOKEN"];

if (!apiKey || !projectId) {
  console.error(
    "benchmark-gemini: VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID not found in .env.local",
  );
  process.exit(1);
}

console.log("benchmark-gemini");
console.log(
  `key: ${apiKey.slice(0, 6)}... project: ${projectId} appcheck: ${appCheck ? "present" : "ABSENT"}`,
);
console.log("─".repeat(78));

const inputs = buildInputs();
console.log(
  `input sizes: ${Object.entries(SIZES)
    .map(([l, s]) => `${l}=${SIZES[l]}(target)`)
    .join(", ")} | built: ${Object.entries(inputs)
    .map(([l, v]) => `${l}=${v.length}`)
    .join(", ")}`,
);
console.log("─".repeat(78));

const results = [];
for (const model of MODELS) {
  for (const sizeLabel of Object.keys(SIZES)) {
    const promptText = PROMPT(inputs[sizeLabel]);
    for (const route of ["dev", "fai"]) {
      const label = `${model} ${sizeLabel} ${route}`;
      process.stdout.write(`  ${label.padEnd(52)} ... `);
      let r;
      const body = r6Body(model, promptText, RESPONSE_SCHEMA);
      if (route === "dev") {
        r = await measure(
          label,
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          { "Content-Type": "application/json" },
          body,
        );
      } else {
        if (!appCheck) {
          results.push({ label, skipped: "no FIREBASE_APPCHECK_DEBUG_TOKEN" });
          console.log("skipped (no debug token)");
          continue;
        }
        r = await measure(
          label,
          `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/us-central1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
          { "Content-Type": "application/json", "X-Firebase-AppCheck": appCheck },
          body,
        );
      }
      results.push(r);
      console.log(
        r.status >= 400
          ? `HTTP ${r.status} ${r.ms}ms — ${r.detail ?? ""}`
          : `HTTP ${r.status} ${r.ms}ms ${r.outChars ? `(${r.outChars} chars out)` : ""}`,
      );
    }
  }
}

console.log("─".repeat(78));
console.log(JSON.stringify(results, null, 2));
try {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "benchmark-gemini-results.json"), JSON.stringify(results, null, 2));
  console.log(`saved → .vibe/logs/session/benchmark-gemini-results.json`);
} catch {}
