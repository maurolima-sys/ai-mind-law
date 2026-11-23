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

// ─── Rich jurisdiction catalogue ─────────────────────────────────────────────

export interface SubJurisdiction {
  code: string;
  label: string;
  /** Override registration system label for this sub-jurisdiction. */
  registrationSystem?: string;
  /** Override registration number label (e.g. "OCN" for Ontario). */
  registrationNumberLabel?: string;
}

export interface JurisdictionInfo extends JurisdictionDefaults {
  code: string;
  label: string;
  flag: string;
  /** Suggested interface language (ISO 639-1). Does NOT auto-change the app locale. */
  suggestedLanguage: string;
  suggestedLanguageLabel: string;
  /** Primary tax / business identifier label. */
  taxIdLabel: string;
  /** Placeholder / format hint for the tax identifier. */
  taxIdPlaceholder: string;
  /** Official registration authority name. */
  registrationAuthority: string;
  /** Address format hint shown to the user. */
  addressFormat: string;
  /** Optional secondary identifier (e.g. GST/HST for CA). */
  secondaryIdLabel?: string;
  secondaryIdPlaceholder?: string;
  /** Sub-jurisdictions (provinces, states) — only for countries where it matters. */
  subJurisdictions?: SubJurisdiction[];
}

/** The 7 countries surfaced in the Primary country dropdown. */
export const SUPPORTED_COUNTRIES: JurisdictionInfo[] = [
  {
    code: "BR",
    label: "Brasil",
    flag: "🇧🇷",
    suggestedLanguage: "pt",
    suggestedLanguageLabel: "Português",
    taxIdLabel: "CNPJ",
    taxIdPlaceholder: "00.000.000/0001-00",
    registrationAuthority: "Junta Comercial / DREI",
    addressFormat: "Logradouro, número, bairro, cidade, UF, CEP",
    registrationSystem: "CNPJ",
    activitySystem: "CNAE",
    activityVersion: "2.3",
  },
  {
    code: "PT",
    label: "Portugal",
    flag: "🇵🇹",
    suggestedLanguage: "pt",
    suggestedLanguageLabel: "Português",
    taxIdLabel: "NIPC / NIF",
    taxIdPlaceholder: "500 000 000",
    registrationAuthority: "Conservatória do Registo Comercial",
    addressFormat: "Rua, número, código postal, localidade",
    registrationSystem: "NIPC/NIF",
    activitySystem: "CAE",
    activityVersion: "Rev.3",
  },
  {
    code: "GB",
    label: "United Kingdom",
    flag: "🇬🇧",
    suggestedLanguage: "en",
    suggestedLanguageLabel: "English",
    taxIdLabel: "Company number",
    taxIdPlaceholder: "12345678",
    registrationAuthority: "Companies House",
    addressFormat: "Street, town, county, postcode",
    registrationSystem: "Companies House",
    activitySystem: "UK SIC",
    activityVersion: "2007",
  },
  {
    code: "US",
    label: "United States",
    flag: "🇺🇸",
    suggestedLanguage: "en",
    suggestedLanguageLabel: "English",
    taxIdLabel: "EIN",
    taxIdPlaceholder: "00-0000000",
    registrationAuthority: "Secretary of State (varies by state)",
    addressFormat: "Street, city, state, ZIP code",
    registrationSystem: "EIN",
    activitySystem: "NAICS",
    activityVersion: "2022",
  },
  {
    code: "ES",
    label: "España",
    flag: "🇪🇸",
    suggestedLanguage: "es",
    suggestedLanguageLabel: "Español",
    taxIdLabel: "NIF / CIF",
    taxIdPlaceholder: "A00000000",
    registrationAuthority: "Registro Mercantil",
    addressFormat: "Calle, número, código postal, municipio, provincia",
    registrationSystem: "NIF",
    activitySystem: "CNAE",
    activityVersion: "2025",
  },
  {
    code: "MX",
    label: "México",
    flag: "🇲🇽",
    suggestedLanguage: "es",
    suggestedLanguageLabel: "Español",
    taxIdLabel: "RFC",
    taxIdPlaceholder: "ABC000000000",
    registrationAuthority: "Registro Público de Comercio",
    addressFormat: "Calle, número, colonia, municipio, estado, C.P.",
    registrationSystem: "RFC",
    activitySystem: "SCIAN",
    activityVersion: "2023",
  },
  {
    code: "CA",
    label: "Canada",
    flag: "🇨🇦",
    suggestedLanguage: "en",
    suggestedLanguageLabel: "English / Français",
    taxIdLabel: "Business Number (BN)",
    taxIdPlaceholder: "000000000",
    registrationAuthority: "Canada Revenue Agency (CRA)",
    addressFormat: "Street, city, province/territory, postal code",
    secondaryIdLabel: "GST/HST Account",
    secondaryIdPlaceholder: "000000000 RT 0001",
    registrationSystem: "Corporation Number",
    activitySystem: "NAICS",
    activityVersion: "2022",
    subJurisdictions: [
      { code: "CA-FED", label: "Federal", registrationSystem: "Corporation Number", registrationNumberLabel: "Corporation Number" },
      { code: "CA-ON",  label: "Ontario", registrationSystem: "Ontario Business Registry", registrationNumberLabel: "OCN" },
      { code: "CA-QC",  label: "Québec",  registrationSystem: "Registraire des entreprises", registrationNumberLabel: "NEQ" },
      { code: "CA-BC",  label: "British Columbia", registrationSystem: "BC Registry", registrationNumberLabel: "Incorporation Number" },
      { code: "CA-AB",  label: "Alberta", registrationSystem: "CORES", registrationNumberLabel: "Registry Number" },
      { code: "CA-MB",  label: "Manitoba", registrationSystem: "Companies Office", registrationNumberLabel: "Corporation Number" },
      { code: "CA-SK",  label: "Saskatchewan", registrationSystem: "ISC", registrationNumberLabel: "Corporation Number" },
      { code: "CA-NS",  label: "Nova Scotia", registrationSystem: "Registry of Joint Stock Companies", registrationNumberLabel: "Registry Number" },
      { code: "CA-NB",  label: "New Brunswick", registrationSystem: "Corporate Registry", registrationNumberLabel: "Corporation Number" },
      { code: "CA-NL",  label: "Newfoundland & Labrador", registrationSystem: "Registry of Companies", registrationNumberLabel: "Corporation Number" },
      { code: "CA-PE",  label: "Prince Edward Island", registrationSystem: "Corporate Registry", registrationNumberLabel: "Corporation Number" },
      { code: "CA-NT",  label: "Northwest Territories", registrationSystem: "Corporate Registry", registrationNumberLabel: "Corporation Number" },
      { code: "CA-YT",  label: "Yukon", registrationSystem: "Corporate Affairs", registrationNumberLabel: "Corporation Number" },
      { code: "CA-NU",  label: "Nunavut", registrationSystem: "Corporate Registry", registrationNumberLabel: "Corporation Number" },
    ],
  },
];

export const JURISDICTION_DEFAULTS: Record<string, JurisdictionDefaults> = Object.fromEntries(
  SUPPORTED_COUNTRIES.map((j) => [j.code, { registrationSystem: j.registrationSystem, activitySystem: j.activitySystem, activityVersion: j.activityVersion }])
) as Record<string, JurisdictionDefaults>;

// Keep legacy entries for countries not in the dropdown but previously supported
const LEGACY_DEFAULTS: Record<string, JurisdictionDefaults> = {
  DE: { registrationSystem: "Handelsregisternummer", activitySystem: "NACE", activityVersion: "Rev.2" },
  FR: { registrationSystem: "SIREN/SIRET", activitySystem: "NAF", activityVersion: "Rev.2" },
  IT: { registrationSystem: "Codice Fiscale", activitySystem: "ATECO", activityVersion: "2007" },
  NL: { registrationSystem: "KvK-nummer", activitySystem: "SBI", activityVersion: "2008" },
};

export function getJurisdictionDefaults(country: string): JurisdictionDefaults {
  const key = country.toUpperCase();
  return (
    JURISDICTION_DEFAULTS[key] ??
    LEGACY_DEFAULTS[key] ?? {
      registrationSystem: "",
      activitySystem: "NACE",
      activityVersion: "Rev.2",
    }
  );
}

export function getJurisdictionInfo(country: string): JurisdictionInfo | undefined {
  return SUPPORTED_COUNTRIES.find((j) => j.code === country.toUpperCase());
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
