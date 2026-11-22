export const SIDEBAR_EXPANDED_STORAGE_KEY = "pocketmind.layout.sidebar-expanded";
export const EVIDENCE_PANEL_EXPANDED_STORAGE_KEY = "pocketmind.layout.evidence-expanded";

export function loadSidebarExpanded(): boolean {
  return readExpanded(SIDEBAR_EXPANDED_STORAGE_KEY);
}

export function saveSidebarExpanded(expanded: boolean): void {
  writeExpanded(SIDEBAR_EXPANDED_STORAGE_KEY, expanded);
}

export function loadEvidencePanelExpanded(): boolean {
  return readExpanded(EVIDENCE_PANEL_EXPANDED_STORAGE_KEY);
}

export function saveEvidencePanelExpanded(expanded: boolean): void {
  writeExpanded(EVIDENCE_PANEL_EXPANDED_STORAGE_KEY, expanded);
}

function readExpanded(key: string): boolean {
  if (typeof localStorage === "undefined") return true;
  const value = localStorage.getItem(key);
  if (value === "0") return false;
  if (value === "1") return true;
  return true;
}

function writeExpanded(key: string, expanded: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, expanded ? "1" : "0");
}
