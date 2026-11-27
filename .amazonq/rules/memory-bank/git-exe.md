# git-exe — Quality Gate & Feature Branch Workflow

## Trigger and aliases

- `git-exe` or `@git-exe` — execute the complete quality, staging, commit, and feature-branch push workflow described below.
- `git-check` or `@git-check` — run verification only; never modify the repository.
- Mentioning these strings inside ordinary conversation does **not** trigger execution. They must be explicitly invoked as commands.

Whenever the user invokes **git-exe** (or **@git-exe**), automatically execute the sequence below without requesting confirmation.

## Objective

Run the complete quality and security gate, create a selective commit, and push to the current feature branch.

**Fundamental rule:** Never commit or push directly to `main` or `master`. The standard workflow is Feature Branch → Pull Request → Vercel Preview → Merge.

## Execution Sequence

### 1. Identify the current branch and initial repository state

Run:

```
git branch --show-current
git status --short
git remote -v
git log --oneline -5
```

Rules:

- Identify and preserve the current branch.
- Never switch branches automatically.
- If the current branch is `main` or `master`, stop before staging, committing, or pushing.
- Inform the user that a feature branch is required.
- Preserve all existing workspace changes.

### 2. Run quality and security checks

Execute:

```
node scripts/pre-push-check.mjs
```

The script accepts feature branches, verifies synchronization with their upstream, and blocks `main`/`master`.

If any mandatory check fails, stop immediately.

### 3. Inspect all changes

Run:

```
git status
git diff --stat
git diff
git log --oneline -5
```

Identify:

- Modified files.
- New files.
- Deleted files.
- Changes unrelated to the current task.
- Local or sensitive files.

Do not include unrelated workspace changes simply because they are present.

### 4. Selective staging

Do **not** run `git add -A` blindly. Stage only the files that belong to the current task.

For each file identified in step 3:

- If it is part of the current task → stage it explicitly: `git add <file>`
- If it is unrelated to the current task → leave it unstaged; note it in the final report.
- If its relevance is uncertain → do not stage it; ask the user.

After staging task files, always run:

```
git reset HEAD -- "Avaliação independente*.md" pocketmind-compliance.csv
```

to ensure those files are never included regardless of how staging was performed.

Additional rules:

- Never stage test PDFs or local documents.
- Never stage `.env`, `.env.local`, or any variants.
- Never stage credentials, tokens, backups, or personal data.
- When the working tree contains changes that belong to a different logical task (e.g. a documentation file unrelated to a bug fix), leave them unstaged and note them in the final report. Create a separate commit for them only if the user explicitly requests it.

### 5. Inspect staged changes and run the secret scan

Execute:

```
git diff --cached --stat
git diff --cached
node scripts/pre-push-check.mjs --staged
```

The scan must inspect exactly the content staged for the commit.

If it detects secrets, credentials, `.env*` files, blocked files, or unintended PDFs, stop immediately without committing or pushing.

### 6. Create the commit

If there are no staged changes, report the repository state and stop.

Generate the commit message automatically according to the type of changes:

| Prefix   | Usage                         |
| -------- | ----------------------------- |
| `fix:`   | Bug fixes                     |
| `feat:`  | New functionality             |
| `docs:`  | Documentation                 |
| `chore:` | Maintenance and configuration |
| `test:`  | Tests                         |

Execute:

```
git commit -m "<automatically generated message>"
```

Do not mix independent documentation changes with functional fixes when doing so would compromise traceability. Create separate commits when appropriate.

### 7. Push to the current feature branch

Identify the current branch again:

```
git branch --show-current
```

Push exclusively to that branch:

```
git push -u origin <current-branch>
```

Rules:

- Never automatically execute `git push origin main`.
- Never execute `git push --force`.
- Never push to a branch other than the current working branch.
- If the remote branch has diverged, stop and investigate before attempting integration.
- Never merge automatically.

### 8. Final report

Report:

1. Branch used.
2. Result of every quality gate.
3. Files included in the commit.
4. Files excluded from staging.
5. Commit hash and message.
6. Push result.
7. Pull Request link, if it was actually created or is available.
8. Next steps for validating the Vercel Preview.

Never claim that a PR or Preview was created without confirmation.

---

## What the gate checks (scripts/pre-push-check.mjs)

| Step                    | Command                                                                                              | Blocks                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| Branch                  | `git branch --show-current` → must NOT be `main` or `master`                                        | ✅                         |
| Remote sync             | `git fetch origin` + upstream check (skipped gracefully if no upstream yet)                         | ✅                         |
| Secret scan             | Inspects staged content after `git add` — filenames and content                                     | ✅                         |
| Whitespace              | `git diff --cached --check`                                                                          | ✅                         |
| Lint                    | `npm run lint`                                                                                       | ✅                         |
| TypeScript              | `npx tsc --noEmit`                                                                                   | ✅                         |
| Tests                   | `npm run test -- --run`                                                                              | ✅                         |
| Dependency audit        | `npm audit --omit=dev` — compares CVE IDs against explicit baseline, not just counts                | ✅ if new CVE not accepted |
| Production build        | `npm run build`                                                                                      | ✅                         |

---

## Permanent Safety Rules

- Never commit or push directly to `main` or `master`.
- Never execute `git push --force`.
- Never execute `npm audit fix --force`.
- Never bypass failed quality checks.
- Never delete local changes to clean the workspace.
- Never automatically stage private documents or test files.
- Never bypass the secret scan.
- Preserve changes unrelated to the current task.
- Never merge automatically.

The dependency audit baseline remains 10 high / 0 critical, comparing CVE IDs and blocking new, unaccepted vulnerabilities.

---

## Shortcut: git-check / @git-check

Whenever the user invokes **git-check** or **@git-check**, execute only:

```
node scripts/pre-push-check.mjs
```

Do not modify files, stage changes, commit, or push.

The command accepts the current feature branch and verifies synchronization with its upstream.

If the branch has no configured upstream, report this without creating commits or pushing changes.

---

## Official Release Workflow

```
Feature Branch
      |
      v
  git-check
      |
      v
   git-exe
      |
      v
 Quality Gate
      |
      v
 Selective Commit
      |
      v
 Push Feature Branch
      |
      v
 Pull Request
      |
      v
 Vercel Preview
      |
      v
 Manual Validation
      |
      v
 Merge into main
```

Merging remains a separate decision and must never be performed automatically by git-exe.

---

## Creating a Pull Request via GitHub API

When the user asks to create a PR without exposing `.env.local`, use the following pattern:

1. Write a temporary ESM script to `scripts/create-pr.mjs` that reads `.env.local` directly with `readFileSync` (using `path.join(__dirname, '..', '.env.local')`) and calls the GitHub API via `fetch` with `GITHUB_ACCESS_TOKEN`.
2. Run it with `node scripts/create-pr.mjs`.
3. Delete the script immediately after: `del scripts\create-pr.mjs`.

**Key rules:**
- Never log or print the token value — only log `TOKEN_FOUND` / `TOKEN_NOT_FOUND` for diagnostics.
- Never commit the script — delete it before any staging.
- The token key in `.env.local` is `GITHUB_ACCESS_TOKEN`.
- Use `import.meta.url` + `fileURLToPath` + `dirname` for `__dirname` in ESM, then `path.join(__dirname, '..', '.env.local')` for the path — do NOT use `new URL(...).pathname` on Windows (produces double-drive-letter paths).
- Parse `.env.local` manually line by line (`line.match(/^([^#=\s][^=]*)=(.*)$/)`) — do not use the `dotenv` package (its injector intercepts the process and swallows async callbacks).
- The GitHub API endpoint is `POST https://api.github.com/repos/maurolima-sys/ai-mind-law/pulls` with headers `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: pocketmind-ai-agent`.
- On success the response contains `html_url` and `number`; log `PR_CREATED: <url> | number: <n>`.
- On failure log `STATUS: <code> | message: <msg> | errors: <json>`.

**Script template (minimal):**

```js
// scripts/create-pr.mjs — delete after use, never commit
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
const token = env["GITHUB_ACCESS_TOKEN"];
if (!token) { console.error("GITHUB_ACCESS_TOKEN not found"); process.exit(1); }
const res = await fetch("https://api.github.com/repos/maurolima-sys/ai-mind-law/pulls", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "pocketmind-ai-agent",
    "X-GitHub-Api-Version": "2022-11-28",
  },
  body: JSON.stringify({ title: "<title>", head: "<branch>", base: "main", body: "<body>" }),
});
const r = await res.json();
if (r.html_url) console.log("PR_CREATED:", r.html_url, "| number:", r.number);
else console.error("STATUS:", res.status, "| message:", r.message, "| errors:", JSON.stringify(r.errors ?? null));
```
