import { Building2, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useT } from "@/lib/i18n";
import {
  getJurisdictionDefaults,
  getJurisdictionInfo,
  saveCompanyProfile,
  SUPPORTED_COUNTRIES,
  type ActivityCode,
  type CompanyProfile,
  type CompanyRegistration,
} from "@/lib/companyProfile";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompanyProfileSectionProps {
  profile: CompanyProfile;
  onProfileChange: (profile: CompanyProfile) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompanyProfileSection({ profile, onProfileChange }: CompanyProfileSectionProps) {
  const t = useT();
  const [openSection, setOpenSection] = useState<"identity" | "activities" | "capabilities" | null>(
    "identity",
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  function toggle(section: typeof openSection) {
    setOpenSection((current) => (current === section ? null : section));
  }

  function patch(update: Partial<CompanyProfile>) {
    onProfileChange({ ...profile, ...update });
    setSaveStatus("idle");
  }

  function patchIdentity(update: Partial<CompanyProfile["identity"]>) {
    patch({ identity: { ...profile.identity, ...update } });
  }

  function patchActivities(update: Partial<CompanyProfile["activities"]>) {
    patch({ activities: { ...profile.activities, ...update } });
  }

  function handleSave() {
    try {
      saveCompanyProfile(profile);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  // ── Registration helpers ──────────────────────────────────────────────────

  function addRegistration() {
    const defaults = getJurisdictionDefaults(profile.identity.primaryCountry);
    const reg: CompanyRegistration = {
      id: newId(),
      country: profile.identity.primaryCountry,
      system: defaults.registrationSystem,
      number: "",
      verificationStatus: "unverified",
      provenance: { recordedAt: now(), confirmedByUser: false },
    };
    patchIdentity({ registrations: [...profile.identity.registrations, reg] });
  }

  function updateRegistration(id: string, update: Partial<CompanyRegistration>) {
    patchIdentity({
      registrations: profile.identity.registrations.map((r) =>
        r.id === id ? { ...r, ...update } : r,
      ),
    });
  }

  function removeRegistration(id: string) {
    patchIdentity({
      registrations: profile.identity.registrations.filter((r) => r.id !== id),
    });
  }

  // ── Activity code helpers ─────────────────────────────────────────────────

  function addActivityCode(kind: ActivityCode["kind"]) {
    const defaults = getJurisdictionDefaults(profile.identity.primaryCountry);
    const code: ActivityCode = {
      id: newId(),
      system: defaults.activitySystem,
      version: defaults.activityVersion,
      code: "",
      label: "",
      kind,
      provenance: { recordedAt: now(), confirmedByUser: false },
    };
    patchActivities({ activityCodes: [...profile.activities.activityCodes, code] });
  }

  function updateActivityCode(id: string, update: Partial<ActivityCode>) {
    patchActivities({
      activityCodes: profile.activities.activityCodes.map((c) =>
        c.id === id ? { ...c, ...update } : c,
      ),
    });
  }

  function removeActivityCode(id: string) {
    patchActivities({
      activityCodes: profile.activities.activityCodes.filter((c) => c.id !== id),
    });
  }

  const registeredCodes = profile.activities.activityCodes.filter((c) => c.kind === "registered");
  const capabilityCodes = profile.activities.activityCodes.filter((c) => c.kind === "capability");

  // ─── Render ───────────────────────────────────────────────────────────────

  const jurisdictionInfo = getJurisdictionInfo(profile.identity.primaryCountry);

  return (
    <section className="pm-panel pm-settings-card pm-cp-section" aria-labelledby="cp-section-title">
      <div className="pm-settings-heading">
        <span className="pm-settings-icon">
          <Building2 size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 id="cp-section-title">{t("cp_title")}</h2>
          <p>{t("cp_subtitle")}</p>
        </div>
      </div>

      {/* ── Identity ── */}
      <div className="pm-cp-accordion">
        <button
          type="button"
          className="pm-cp-accordion-header"
          aria-expanded={openSection === "identity"}
          onClick={() => toggle("identity")}
        >
          {openSection === "identity" ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
          <span>{t("cp_identity_title")}</span>
        </button>

        {openSection === "identity" && (
          <div className="pm-cp-accordion-body">
            <div className="pm-cp-field-row">
              <label htmlFor="cp-name">{t("cp_name_label")}</label>
              <input
                id="cp-name"
                type="text"
                value={profile.identity.name}
                placeholder={t("cp_name_placeholder")}
                maxLength={200}
                onChange={(e) => patchIdentity({ name: e.currentTarget.value })}
              />
            </div>

            <div className="pm-cp-field-row pm-cp-field-row--half">
              <div>
                <label htmlFor="cp-country">{t("cp_country_label")}</label>
                <select
                  id="cp-country"
                  value={profile.identity.primaryCountry}
                  onChange={(e) => {
                    const newCountry = e.currentTarget.value;
                    patchIdentity({ primaryCountry: newCountry });
                  }}
                >
                  <option value="">— select —</option>
                  {SUPPORTED_COUNTRIES.map((j) => (
                    <option key={j.code} value={j.code}>
                      {j.flag} {j.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cp-legal-form">{t("cp_legal_form_label")}</label>
                <input
                  id="cp-legal-form"
                  type="text"
                  value={profile.identity.legalForm}
                  placeholder={t("cp_legal_form_placeholder")}
                  maxLength={60}
                  onChange={(e) => patchIdentity({ legalForm: e.currentTarget.value })}
                />
              </div>
            </div>

            {jurisdictionInfo && (
              <div className="pm-cp-jurisdiction-card">
                <div className="pm-cp-jurisdiction-row">
                  <span className="pm-cp-jurisdiction-label">Tax / business ID</span>
                  <span className="pm-cp-jurisdiction-value">{jurisdictionInfo.taxIdLabel}</span>
                </div>
                <div className="pm-cp-jurisdiction-row">
                  <span className="pm-cp-jurisdiction-label">Registration authority</span>
                  <span className="pm-cp-jurisdiction-value">{jurisdictionInfo.registrationAuthority}</span>
                </div>
                <div className="pm-cp-jurisdiction-row">
                  <span className="pm-cp-jurisdiction-label">Suggested language</span>
                  <span className="pm-cp-jurisdiction-value">{jurisdictionInfo.suggestedLanguageLabel}</span>
                </div>
                <div className="pm-cp-jurisdiction-row">
                  <span className="pm-cp-jurisdiction-label">Address format</span>
                  <span className="pm-cp-jurisdiction-value">{jurisdictionInfo.addressFormat}</span>
                </div>
                {jurisdictionInfo.secondaryIdLabel && (
                  <div className="pm-cp-jurisdiction-row">
                    <span className="pm-cp-jurisdiction-label">{jurisdictionInfo.secondaryIdLabel}</span>
                    <span className="pm-cp-jurisdiction-value pm-cp-jurisdiction-value--muted">{jurisdictionInfo.secondaryIdPlaceholder}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pm-cp-field-row">
              <label htmlFor="cp-address">{t("cp_address_label")}</label>
              <input
                id="cp-address"
                type="text"
                value={profile.identity.registeredAddress}
                placeholder={t("cp_address_placeholder")}
                maxLength={300}
                onChange={(e) => patchIdentity({ registeredAddress: e.currentTarget.value })}
              />
            </div>

            {/* Registrations */}
            <div className="pm-cp-subsection">
              <div className="pm-cp-subsection-header">
                <span>{t("cp_registrations_title")}</span>
                <button
                  type="button"
                  className="pm-cp-add-btn"
                  onClick={addRegistration}
                  aria-label={t("cp_registration_add")}
                >
                  <Plus size={13} aria-hidden="true" />
                  {t("cp_registration_add")}
                </button>
              </div>
              <p className="pm-cp-hint">{t("cp_registrations_hint")}</p>

              {profile.identity.registrations.length === 0 && (
                <p className="pm-cp-empty">{t("cp_registrations_empty")}</p>
              )}

              {profile.identity.registrations.map((reg) => {
                const regJurisdiction = getJurisdictionInfo(reg.country);
                const isCA = reg.country === "CA";
                const caSubJurisdictions = isCA
                  ? (getJurisdictionInfo("CA")?.subJurisdictions ?? [])
                  : [];
                const caSubMatch = caSubJurisdictions.find((s) => s.registrationSystem === reg.system);
                const regNumberLabel = caSubMatch?.registrationNumberLabel ?? regJurisdiction?.taxIdLabel ?? t("cp_reg_number_label");
                return (
                  <div key={reg.id} className="pm-cp-registration-row">
                    <select
                      value={reg.country}
                      aria-label={t("cp_reg_country_label")}
                      className="pm-cp-input--short"
                      onChange={(e) => {
                        const newCountry = e.currentTarget.value;
                        const defaults = getJurisdictionDefaults(newCountry);
                        updateRegistration(reg.id, { country: newCountry, system: defaults.registrationSystem });
                      }}
                    >
                      <option value="">—</option>
                      {SUPPORTED_COUNTRIES.map((j) => (
                        <option key={j.code} value={j.code}>{j.flag} {j.code}</option>
                      ))}
                    </select>
                    {isCA && caSubJurisdictions.length > 0 ? (
                      <select
                        value={reg.system}
                        aria-label="Province / territory"
                        onChange={(e) => updateRegistration(reg.id, { system: e.currentTarget.value })}
                      >
                        {caSubJurisdictions.map((s) => (
                          <option key={s.code} value={s.registrationSystem ?? s.code}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={reg.system}
                        placeholder={regJurisdiction?.registrationAuthority ?? "Registry"}
                        maxLength={60}
                        aria-label={t("cp_reg_system_label")}
                        onChange={(e) => updateRegistration(reg.id, { system: e.currentTarget.value })}
                      />
                    )}
                    <input
                      type="text"
                      value={reg.number}
                      placeholder={regJurisdiction?.taxIdPlaceholder ?? t("cp_reg_number_placeholder")}
                      maxLength={60}
                      aria-label={regNumberLabel}
                      onChange={(e) => updateRegistration(reg.id, { number: e.currentTarget.value })}
                    />
                    <select
                      value={reg.verificationStatus}
                      aria-label={t("cp_reg_status_label")}
                      onChange={(e) =>
                        updateRegistration(reg.id, {
                          verificationStatus: e.currentTarget.value as CompanyRegistration["verificationStatus"],
                        })
                      }
                    >
                      <option value="unverified">{t("cp_reg_status_unverified")}</option>
                      <option value="self-declared">{t("cp_reg_status_self_declared")}</option>
                      <option value="document-extracted">{t("cp_reg_status_extracted")}</option>
                    </select>
                    <button
                      type="button"
                      className="pm-cp-remove-btn"
                      aria-label={t("cp_registration_remove")}
                      onClick={() => removeRegistration(reg.id)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Business Activities ── */}
      <div className="pm-cp-accordion">
        <button
          type="button"
          className="pm-cp-accordion-header"
          aria-expanded={openSection === "activities"}
          onClick={() => toggle("activities")}
        >
          {openSection === "activities" ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
          <span>{t("cp_activities_title")}</span>
        </button>

        {openSection === "activities" && (
          <div className="pm-cp-accordion-body">
            <div className="pm-cp-field-row">
              <label htmlFor="cp-business-desc">{t("cp_business_desc_label")}</label>
              <p className="pm-cp-hint">{t("cp_business_desc_hint")}</p>
              <textarea
                id="cp-business-desc"
                value={profile.activities.businessDescription}
                placeholder={t("cp_business_desc_placeholder")}
                maxLength={2000}
                rows={4}
                onChange={(e) => patchActivities({ businessDescription: e.currentTarget.value })}
              />
            </div>

            <div className="pm-cp-subsection">
              <div className="pm-cp-subsection-header">
                <span>{t("cp_registered_codes_title")}</span>
                <button
                  type="button"
                  className="pm-cp-add-btn"
                  onClick={() => addActivityCode("registered")}
                  aria-label={t("cp_code_add_registered")}
                >
                  <Plus size={13} aria-hidden="true" />
                  {t("cp_code_add")}
                </button>
              </div>
              <p className="pm-cp-hint">{t("cp_registered_codes_hint")}</p>

              {registeredCodes.length === 0 && (
                <p className="pm-cp-empty">{t("cp_codes_empty")}</p>
              )}

              {registeredCodes.map((code) => (
                <div key={code.id} className="pm-cp-code-row">
                  <input
                    type="text"
                    value={code.system}
                    placeholder="CNAE"
                    maxLength={30}
                    aria-label={t("cp_code_system_label")}
                    className="pm-cp-input--medium"
                    onChange={(e) => updateActivityCode(code.id, { system: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.version}
                    placeholder="2.3"
                    maxLength={20}
                    aria-label={t("cp_code_version_label")}
                    className="pm-cp-input--short"
                    onChange={(e) => updateActivityCode(code.id, { version: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.code}
                    placeholder="6201-5/01"
                    maxLength={30}
                    aria-label={t("cp_code_code_label")}
                    className="pm-cp-input--medium"
                    onChange={(e) => updateActivityCode(code.id, { code: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.label}
                    placeholder={t("cp_code_label_placeholder")}
                    maxLength={200}
                    aria-label={t("cp_code_label_label")}
                    className="pm-cp-input--grow"
                    onChange={(e) => updateActivityCode(code.id, { label: e.currentTarget.value })}
                  />
                  <button
                    type="button"
                    className="pm-cp-remove-btn"
                    aria-label={t("cp_code_remove")}
                    onClick={() => removeActivityCode(code.id)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Declared Capabilities ── */}
      <div className="pm-cp-accordion">
        <button
          type="button"
          className="pm-cp-accordion-header"
          aria-expanded={openSection === "capabilities"}
          onClick={() => toggle("capabilities")}
        >
          {openSection === "capabilities" ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
          <span>{t("cp_capabilities_title")}</span>
        </button>

        {openSection === "capabilities" && (
          <div className="pm-cp-accordion-body">
            <p className="pm-cp-hint">{t("cp_capabilities_hint")}</p>

            <div className="pm-cp-field-row">
              <label htmlFor="cp-capabilities">{t("cp_capabilities_label")}</label>
              <textarea
                id="cp-capabilities"
                value={profile.activities.declaredCapabilities}
                placeholder={t("cp_capabilities_placeholder")}
                maxLength={2000}
                rows={4}
                onChange={(e) =>
                  patchActivities({ declaredCapabilities: e.currentTarget.value })
                }
              />
            </div>

            <div className="pm-cp-subsection">
              <div className="pm-cp-subsection-header">
                <span>{t("cp_capability_codes_title")}</span>
                <button
                  type="button"
                  className="pm-cp-add-btn"
                  onClick={() => addActivityCode("capability")}
                  aria-label={t("cp_code_add_capability")}
                >
                  <Plus size={13} aria-hidden="true" />
                  {t("cp_code_add")}
                </button>
              </div>
              <p className="pm-cp-hint">{t("cp_capability_codes_hint")}</p>

              {capabilityCodes.length === 0 && (
                <p className="pm-cp-empty">{t("cp_codes_empty")}</p>
              )}

              {capabilityCodes.map((code) => (
                <div key={code.id} className="pm-cp-code-row">
                  <input
                    type="text"
                    value={code.system}
                    placeholder="NAICS"
                    maxLength={30}
                    aria-label={t("cp_code_system_label")}
                    className="pm-cp-input--medium"
                    onChange={(e) => updateActivityCode(code.id, { system: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.version}
                    placeholder="2022"
                    maxLength={20}
                    aria-label={t("cp_code_version_label")}
                    className="pm-cp-input--short"
                    onChange={(e) => updateActivityCode(code.id, { version: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.code}
                    placeholder="541511"
                    maxLength={30}
                    aria-label={t("cp_code_code_label")}
                    className="pm-cp-input--medium"
                    onChange={(e) => updateActivityCode(code.id, { code: e.currentTarget.value })}
                  />
                  <input
                    type="text"
                    value={code.label}
                    placeholder={t("cp_code_label_placeholder")}
                    maxLength={200}
                    aria-label={t("cp_code_label_label")}
                    className="pm-cp-input--grow"
                    onChange={(e) => updateActivityCode(code.id, { label: e.currentTarget.value })}
                  />
                  <button
                    type="button"
                    className="pm-cp-remove-btn"
                    aria-label={t("cp_code_remove")}
                    onClick={() => removeActivityCode(code.id)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Save ── */}
      <div className="pm-cp-footer">
        <p className="pm-cp-privacy-note">{t("cp_privacy_note")}</p>
        {saveStatus === "saved" && (
          <p role="status" className="pm-settings-saved">
            {t("cp_saved")}
          </p>
        )}
        {saveStatus === "error" && (
          <p role="alert" className="pm-settings-error">
            {t("cp_save_error")}
          </p>
        )}
        <button type="button" className="pm-button pm-button--outline" onClick={handleSave}>
          {t("cp_save")}
        </button>
      </div>
    </section>
  );
}
