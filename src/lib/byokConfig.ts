// ─── BYOK Firebase configuration ─────────────────────────────────────────────
// Stores the user's own Firebase project config in localStorage.
// These are public client-side values (apiKey, authDomain, projectId, appId,
// appCheckSiteKey) — not server secrets. The user's Firebase project handles
// billing and quota independently of PocketMind's default project.
//
// Security note: Firebase web config values are intentionally public.
// The App Check site key is also a public value. Neither is a billing credential.
// Do NOT store service-account keys, private API keys, or debug tokens here.

export const BYOK_STORAGE_KEY = "pocketmind.byok.firebase";

export interface ByokFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  appCheckSiteKey: string;
}

export function isByokConfigComplete(config: Partial<ByokFirebaseConfig>): config is ByokFirebaseConfig {
  return Boolean(
    config.apiKey?.trim() &&
    config.authDomain?.trim() &&
    config.projectId?.trim() &&
    config.appId?.trim() &&
    config.appCheckSiteKey?.trim(),
  );
}

/** Stable hash of a config object — used to detect runtime changes. */
export function hashByokConfig(config: ByokFirebaseConfig): string {
  return [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.appId,
    config.appCheckSiteKey,
  ].join("|");
}

export function loadByokConfig(): ByokFirebaseConfig | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(BYOK_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ByokFirebaseConfig>;
    return isByokConfigComplete(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveByokConfig(config: ByokFirebaseConfig): void {
  localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(config));
}

export function clearByokConfig(): void {
  localStorage.removeItem(BYOK_STORAGE_KEY);
}
