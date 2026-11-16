declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
declare const __COMMIT_HASH__: string;

export const APP_VERSION: string = __APP_VERSION__;
export const BUILD_TIME: string = __BUILD_TIME__;
export const COMMIT_HASH: string = __COMMIT_HASH__;

/** "v0.4.0 · abc1234 · 2026-11-16 20:05 UTC" */
export function buildLabel(): string {
  const dt = new Date(BUILD_TIME);
  const date = dt.toISOString().slice(0, 10);
  const time = dt.toISOString().slice(11, 16);
  return `v${APP_VERSION} · ${COMMIT_HASH} · ${date} ${time} UTC`;
}
