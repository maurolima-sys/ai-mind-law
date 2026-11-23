// vercel-deploy.mjs — sync env vars to Vercel and trigger deploy
// Reads .env.local, sets required vars, then deploys via Vercel CLI.
// Never prints secret values.
import { readFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";

const envPath = "C:/Users/mauro/.copilot/repos/ai-mind-law/.env.local";
const raw = readFileSync(envPath, "utf8").replace(/\uFEFF/g, "");
const vars = {};
for (const line of raw.split("\n")) {
  const l = line.replace(/\r$/, "").trim();
  if (!l || l.startsWith("#")) continue;
  const eq = l.indexOf("=");
  if (eq > 0) {
    const k = l.substring(0, eq);
    const v = l.substring(eq + 1).replace(/^"|"$/g, "");
    vars[k] = v;
  }
}

const token = vars["VERCEL_ACCESS_DEPLOY_TOKEN"];
if (!token) {
  console.error("VERCEL_ACCESS_DEPLOY_TOKEN not found");
  process.exit(1);
}
console.log("Token present, length:", token.length);

// Variables to upsert in Vercel Production + Preview
const toSet = [
  { key: "VITE_FIREBASE_API_KEY", env: ["production", "preview"], type: "plain" },
  { key: "VITE_FIREBASE_AUTH_DOMAIN", env: ["production", "preview"], type: "plain" },
  { key: "VITE_FIREBASE_PROJECT_ID", env: ["production", "preview"], type: "plain" },
  { key: "VITE_FIREBASE_APP_ID", env: ["production", "preview"], type: "plain" },
  {
    key: "VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY",
    env: ["production", "preview"],
    type: "plain",
  },
  { key: "FIRECRAWL_API_KEY", env: ["production", "preview"], type: "encrypted" },
  { key: "ELEVENLABS_API_KEY", env: ["production", "preview"], type: "encrypted" },
];

const projectId = "prj_GCTbSolsJYsl6MBxlaq67gI5Dttj";
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// Fetch existing env var IDs so we can upsert (delete + create)
const listRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?limit=100`, {
  headers,
});
const listData = await listRes.json();
const existing = {};
for (const e of listData.envs || []) {
  existing[e.key] = e.id;
}
console.log("Existing Vercel env vars:", Object.keys(existing).length);

for (const { key, env, type } of toSet) {
  const value = vars[key];
  if (!value) {
    console.log(`SKIP (empty): ${key}`);
    continue;
  }

  // Delete existing if present
  if (existing[key]) {
    const del = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env/${existing[key]}`,
      {
        method: "DELETE",
        headers,
      },
    );
    if (del.ok) console.log(`DELETED old: ${key}`);
  }

  // Create new
  const body = JSON.stringify({ key, value, target: env, type });
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: "POST",
    headers,
    body,
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`SET: ${key} (${env.join(",")})`);
  } else {
    console.error(`ERROR: ${key}`, data.error?.message || JSON.stringify(data));
  }
}

// Trigger deploy via Vercel CLI
console.log("\nTriggering Vercel deploy...");
try {
  execSync(`vercel deploy --prod --token ${token} --yes`, {
    cwd: "C:/Users/mauro/.copilot/repos/ai-mind-law",
    stdio: "inherit",
    env: { ...process.env, VERCEL_TOKEN: token },
  });
  console.log("Deploy triggered.");
} catch (e) {
  console.error("Deploy error:", e.message);
}
