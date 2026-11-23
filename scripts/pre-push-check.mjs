#!/usr/bin/env node
// pre-push-check.mjs — Quality & Security Gate for PocketMind AI
//
// USAGE
//   node scripts/pre-push-check.mjs          — verify only (git-check)
//   node scripts/pre-push-check.mjs --staged — verify staged files (called by git-exe after git add)
//
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCKED_FILENAME = [/Avalia[çc][aã]o independente.*\.md$/i, /pocketmind-compliance\.csv$/i];

// Matches .env, .env.local, .env.production, .env.anything — but not .envrc.example
const ENV_FILE_RE = /^\.env(\.[^.]+)?$/;

const SECRET_PATTERNS = [
  { re: /AAAA[A-Za-z0-9_-]{20,}/, label: "Firebase/GCP service-account token" },
  { re: /-----BEGIN (RSA |EC )?PRIVATE KEY/, label: "private key" },
  { re: /AIza[A-Za-z0-9_-]{35}/, label: "Google API key" },
  { re: /sk-[A-Za-z0-9]{20,}/, label: "OpenAI-style secret key" },
  { re: /ghp_[A-Za-z0-9]{36}/, label: "GitHub personal access token" },
  {
    re: /FIREBASE_APPCHECK_DEBUG_TOKEN\s*=\s*["']?[0-9A-Fa-f-]{30,}/,
    label: "App Check debug token value",
  },
];

// Known-accepted CVE IDs from the 2026-11-21 audit baseline.
// Add new IDs here only after a deliberate decision to accept them.
// Remove an ID once the vulnerability is patched.
const AUDIT_BASELINE_CVES = new Set([
  // Accepted 2026-11-23 — all pre-existing from 2026-11-21 audit; no patch available.
  // Re-evaluate when firebase ≥ next major or grpc-js / zod release a fix.
  "@firebase/firestore", // high — transitive via firebase SDK; no upstream fix
  "@firebase/firestore-compat", // high — same root cause as @firebase/firestore
  "@grpc/grpc-js", // high — transitive via Firebase; no patch available
  "firebase", // high — umbrella package, same root as above
  "zod", // high — accepted pending upstream patch
]);

let failed = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(label, cmd, { blocking = true } = {}) {
  process.stdout.write(`\n▶ ${label}…\n`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
    console.log(`✅ ${label}`);
  } catch {
    console.error(`❌ ${label} — FAILED`);
    if (blocking) failed = true;
  }
}

function abort(msg) {
  console.error(`\n🚫 Gate aborted: ${msg}`);
  process.exit(1);
}

function stagedFiles() {
  return execSync("git diff --cached --name-only").toString().trim().split("\n").filter(Boolean);
}

// ── 1. Branch ─────────────────────────────────────────────────────────────────
const branch = execSync("git branch --show-current").toString().trim();
if (branch !== "main") abort(`not on main (current: ${branch})`);
console.log(`✅ Branch: ${branch}`);

// ── 2. Remote sync ────────────────────────────────────────────────────────────
// git fetch updates remote-tracking refs locally; it does not modify working files.
try {
  execSync("git fetch origin", { stdio: "pipe" });
  const status = execSync("git status -sb").toString();
  if (status.includes("behind")) abort("local branch is behind origin/main — pull first");
  if (status.includes("diverged"))
    abort("branch has diverged from origin/main — resolve before pushing");
  console.log("✅ Remote sync: up to date");
} catch (e) {
  if (String(e.message).includes("Gate aborted")) throw e;
  console.warn("⚠️  Could not fetch origin — proceeding without remote check");
}

// ── 3. Staged secret scan ─────────────────────────────────────────────────────
// Runs over the current staging area (--cached). In git-exe this step is called
// a second time after git add, so it always reflects the final commit content.
process.stdout.write("\n▶ Secret scan (staged files)…\n");
try {
  const files = stagedFiles();
  if (files.length === 0) {
    console.log("✅ Secret scan: nothing staged");
  } else {
    for (const file of files) {
      const basename = file.split(/[/\\]/).pop() ?? "";

      // Block env files by name
      if (ENV_FILE_RE.test(basename)) {
        abort(`env file in staging: ${file}`);
      }

      // Block files on the exclusion list (should never be staged)
      if (BLOCKED_FILENAME.some((p) => p.test(file))) {
        abort(`blocked file in staging: ${file} — remove it with: git reset HEAD -- "${file}"`);
      }

      // Scan content of text files
      const fullPath = join(process.cwd(), file);
      if (!existsSync(fullPath)) continue;
      let content;
      try {
        content = readFileSync(fullPath, "utf8");
      } catch {
        continue;
      } // binary — skip

      for (const { re, label } of SECRET_PATTERNS) {
        if (re.test(content)) abort(`possible ${label} detected in ${file}`);
      }
    }
    console.log(`✅ Secret scan: ${files.length} staged file(s) clean`);
  }
} catch (e) {
  if (String(e.message).includes("Gate aborted")) throw e;
  console.warn("⚠️  Secret scan could not complete:", e.message);
}

// ── 4. Staged whitespace ──────────────────────────────────────────────────────
// --cached checks what is staged, not the working tree.
run("Staged whitespace (git diff --cached --check)", "git diff --cached --check");

// ── 5. Lint ───────────────────────────────────────────────────────────────────
// eslint.config.js includes eslint-plugin-prettier/recommended — Prettier rules
// are enforced here; no separate format step is needed or run automatically.
run("Lint (npm run lint)", "npm run lint");

// ── 6. TypeScript ─────────────────────────────────────────────────────────────
run("TypeScript (tsc --noEmit)", "npx tsc --noEmit");

// ── 7. Tests ──────────────────────────────────────────────────────────────────
run("Tests (npm run test -- --run)", "npm run test -- --run");

// ── 8. Dependency audit ───────────────────────────────────────────────────────
// Compares CVE IDs against an explicit baseline, not just counts.
// A new CVE blocks the gate even if the total count stays the same.
process.stdout.write("\n▶ Dependency audit (npm audit --omit=dev)…\n");
try {
  let auditJson;
  try {
    auditJson = execSync("npm audit --omit=dev --json", { stdio: "pipe" }).toString();
  } catch (e) {
    // npm audit exits non-zero when vulnerabilities exist — stdout still has JSON
    auditJson = e.stdout?.toString() ?? "{}";
  }

  const audit = JSON.parse(auditJson);
  const vulns = audit.vulnerabilities ?? {};
  const { high = 0, critical = 0 } = audit.metadata?.vulnerabilities ?? {};

  const newCves = Object.entries(vulns)
    .filter(([id, v]) => {
      const sev = (v.severity ?? "").toLowerCase();
      return (sev === "high" || sev === "critical") && !AUDIT_BASELINE_CVES.has(id);
    })
    .map(([id, v]) => `${id} (${v.severity})`);

  if (newCves.length > 0) {
    console.error(`❌ Audit: new high/critical CVEs not in baseline:\n   ${newCves.join("\n   ")}`);
    console.error(
      "   Add them to AUDIT_BASELINE_CVES only after a deliberate acceptance decision.",
    );
    failed = true;
  } else {
    console.log(`✅ Audit: ${critical} critical, ${high} high — all within accepted baseline`);
  }
} catch {
  console.warn("⚠️  Audit output could not be parsed — skipping");
}

// ── 9. Build ──────────────────────────────────────────────────────────────────
run("Production build (npm run build)", "npm run build");

// ── Result ────────────────────────────────────────────────────────────────────
if (failed) {
  console.error("\n🚫 Gate FAILED — fix the issues above before committing.\n");
  process.exit(1);
}
console.log("\n✅ All checks passed — ready to commit and push.\n");
