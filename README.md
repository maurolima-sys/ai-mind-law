# PocketMind AI

PocketMind AI helps procurement teams review tender PDFs by organizing requirements, deadlines, specifications, risks, and source evidence into a human-reviewable workspace.

The web app includes a dashboard, document analysis view, compliance matrix, and processing/privacy controls. The included Northbridge tender and prepared findings are fictional sample data; they are illustrative and are **not** generated from a real procurement document.

## What works

- Upload a PDF up to 20 MB and extract selectable text in the browser with PDF.js.
- Analyze extracted text through Firebase AI Logic hybrid inference: prefer the browser's on-device model, with Gemini 3.8 Flash cloud fallback only after explicit user consent.
- Use on-device-only inference when cloud fallback is not permitted.
- Report the inference source returned by Firebase AI Logic and check AI citations against extracted page text.
- Review requirements, update review statuses and notes for the current browser session, and export the compliance matrix as CSV.
- Export a document's analysis as JSON.

Scanned-image OCR, accounts, shared workspaces, and persistent cloud document storage are not implemented. AI findings are suggestions and must be checked by a person against the original PDF; they are not legal advice.

## Firebase setup for live analysis

The sample dashboard works without Firebase. Live model analysis requires a Firebase project and App Check configuration:

1. Register a Firebase web app, enable Firebase AI Logic, and choose a supported Gemini API provider.
2. Enforce App Check for Firebase AI Logic. For local development, the app uses the App Check debug provider and prints a debug token in the browser console; register that token in the Firebase console. Do not commit or publish the token.
3. For a public deployment, register a production App Check provider (reCAPTCHA Enterprise) for the deployed domain and configure its site key. Do not ship the debug provider to production.
4. Copy `.env.example` to `.env.local` and fill in the Firebase web app configuration and production App Check site key when applicable.
5. Start the app and open it in desktop Chrome. On-device inference depends on the browser's available model and hardware; the app reports whether each completed analysis used on-device or cloud inference.

References: [Firebase AI Logic hybrid inference for Web](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started), [App Check debug provider](https://firebase.google.com/docs/app-check/web/debug-provider), and [App Check reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

The Firebase web configuration and reCAPTCHA site key are public client configuration values, not server secrets. Never put service-account keys, private API keys, or App Check debug tokens in this repository. Hybrid fallback can send extracted document text to Google's cloud, so the app requires explicit consent before enabling it.

Firebase AI Logic's web on-device inference uses Chrome's Prompt API and is available only in supported desktop Chrome versions. The SDK reports the inference source but does not let the app pin a particular on-device model version. PDF files are converted to text in the browser before model analysis; direct on-device PDF input and OCR are not supported by this workflow.

## Development

Requirements: Bun and Node.js.

```sh
bun install
bun run dev
```

Checks:

```sh
bun test
bun run lint
bun run build
```

## Submission readiness

The live AI feature is only usable after the Firebase and App Check setup above is completed and tested in the deployment. The repository currently has no open-source license file; add and verify an appropriate license before providing a license URL for a submission.
