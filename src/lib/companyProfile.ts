// ─── Company Profile — domain types and persistence ──────────────────────────
//
// Three independent layers:
//   1. CompanyIdentity   — who the company is (registrations, legal form)
//   2. BusinessActivities — what it does officially (activity codes + description)
//   3. TenderPreferences  — what it wants to find (reserved for Discovery phase)
//
// Provenance is tracked per field so document-extracted values can be
// distinguished from user-confirmed values.

// ─── Provenance ───────────────────────────────────────────────────────────────

export interface FieldProvenance {
  /** Source document id in the local workspace, if extracted from a document. */
  documentId?: string;
  /** Page or source location within that document. */
  sourceLocation?: string | null;
  /** ISO timestamp of extraction or last user confirmation. */
  recordedAt: string;
  /** Whether the user has explicitly confirmed this value. */
  confirmedByUser: boolean;
}

// ─── Layer 1 — Company Identity ───────────────────────────────────────────────

/**
 * A single company registration in one jurisdiction.
 * A company may have registrations in multiple countries.
 */
export interface CompanyRegistration {
  id: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** Official name of the registration system, e.g. "CNPJ", "Companies House", "EIN". */
  system: string;
  /** The registration number as it appears in official documents. */
  number: string;
  /** Optional: verification status — not validated by the app, user-declared. */
  verificationStatus: "unverified" | "self-declared" | "document-extracted";
  provenance?: FieldProvenance;
}

export interface CompanyIdentity {
  /** Trading or registered name. */
  name: string;
  /** Primary country of operation (ISO 3166-1 alpha-2). */
  primaryCountry: string;
  /** Legal form, e.g. "Ltda", "Ltd", "LLC", "S.A.", "GmbH". */
  legalForm: string;
  /** One or more registrations across jurisdictions. */
  registrations: CompanyRegistration[];
  /** Registered address — free text, not structured, to avoid PII over-collection. */
  registeredAddress: string;
  provenance?: FieldProvenance;
}

// ─── Layer 2 — Business Activities ───────────────────────────────────────────

/**
 * A single activity classification code.
 * Preserves the original code, system, and version from the source document.
 */
export interface ActivityCode {
  id: string;
  /**
   * Classification system identifier.
   * Examples: "CNAE", "CNAE-2025", "UK SIC", "NAICS", "SCIAN", "CAE", "NACE"
   */
  system: string;
  /** Version or revision of the classification, e.g. "2.3", "2007", "2022", "Rev.3". */
  version: string;
  /** The code as it appears in the official classification. */
  code: string;
  /** Human-readable label in the original language of the classification. */
  label: string;
  /**
   * Whether this code represents a registered activity (from official documents),
   * a declared capability (what the company can provide), or a tender interest.
   * Keeps the three concepts separate from the start.
   */
  kind: "registered" | "capability" | "interest";
  provenance?: FieldProvenance;
}

export interface BusinessActivities {
  /** Activity codes from official registration documents. */
  activityCodes: ActivityCode[];
  /**
   * Free-text description of the company's business scope (objeto social / objects clause).
   * Preserved in the original language of the document.
   */
  businessDescription: string;
  /**
   * What the company declares it can actually provide — separate from registered activities.
   * User-authored; not extracted from documents automatically.
   */
  declaredCapabilities: string;
  provenance?: FieldProvenance;
}

// ─── Layer 3 — Tender Preferences (reserved) ─────────────────────────────────
// Intentionally minimal in v1. Fields exist to establish the conceptual boundary
// but are not surfaced in the UI until Smart Discovery consumes them.

export interface TenderPreferences {
  /** Free-text keywords for document discovery searches. */
  keywords: string[];
  /** Reserved for future use: target regions, contract value ranges, categories. */
  _reserved: true;
}

// ─── Root profile ─────────────────────────────────────────────────────────────

export interface CompanyProfile {
  version: 1;
  identity: CompanyIdentity;
  activities: BusinessActivities;
  /** Preferences layer — reserved, not yet surfaced in UI. */
  preferences: TenderPreferences;
  createdAt: string;
  updatedAt: string;
}

// ─── Country → registration system lookup ────────────────────────────────────

export interface JurisdictionDefaults {
  registrationSystem: string;
  activitySystem: string;
  activityVersion: string;
}

export const JURISDICTION_DEFAULTS: Record<string, JurisdictionDefaults> = {
  BR: { registrationSystem: "CNPJ", activitySystem: "CNAE", activityVersion: "2.3" },
  GB: { registrationSystem: "Companies House", activitySystem: "UK SIC", activityVersion: "2007" },
  US: { registrationSystem: "EIN", activitySystem: "NAICS", activityVersion: "2022" },
  ES: { registrationSystem: "NIF", activitySystem: "CNAE", activityVersion: "2025" },
  MX: { registrationSystem: "RFC", activitySystem: "SCIAN", activityVersion: "2023" },
  PT: { registrationSystem: "NIPC/NIF", activitySystem: "CAE", activityVersion: "Rev.3" },
  DE: { registrationSystem: "Handelsregisternummer", activitySystem: "NACE", activityVersion: "Rev.2" },
  FR: { registrationSystem: "SIREN/SIRET", activitySystem: "NAF", activityVersion: "Rev.2" },
  IT: { registrationSystem: "Codice Fiscale", activitySystem: "ATECO", activityVersion: "2007" },
  NL: { registrationSystem: "KvK-nummer", activitySystem: "SBI", activityVersion: "2008" },
};

export function getJurisdictionDefaults(country: string): JurisdictionDefaults {
  return (
    JURISDICTION_DEFAULTS[country.toUpperCase()] ?? {
      registrationSystem: "",
      activitySystem: "NACE",
      activityVersion: "Rev.2",
    }
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export function defaultCompanyProfile(): CompanyProfile {
  const now = new Date().toISOString();
  return {
    version: 1,
    identity: {
      name: "",
      primaryCountry: "",
      legalForm: "",
      registrations: [],
      registeredAddress: "",
    },
    activities: {
      activityCodes: [],
      businessDescription: "",
      declaredCapabilities: "",
    },
    preferences: {
      keywords: [],
      _reserved: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export const COMPANY_PROFILE_STORAGE_KEY = "pocketmind.companyProfile";

function isValidProfile(value: unknown): value is CompanyProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CompanyProfile>;
  return (
    candidate.version === 1 &&
    typeof candidate.identity === "object" &&
    typeof candidate.activities === "object"
  );
}

export function loadCompanyProfile(): CompanyProfile {
  if (typeof localStorage === "undefined") return defaultCompanyProfile();
  const stored = localStorage.getItem(COMPANY_PROFILE_STORAGE_KEY);
  if (!stored) return defaultCompanyProfile();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (isValidProfile(parsed)) return parsed;
  } catch {
    // fall through
  }
  return defaultCompanyProfile();
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  const updated: CompanyProfile = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(updated));
}
