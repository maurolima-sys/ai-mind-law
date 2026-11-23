import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, Search, Shield } from "lucide-react";

import { useLocale } from "@/lib/i18n";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { discoverDocuments } from "@/lib/services/discoverDocuments.functions";
import type { DiscoveryCandidate } from "@/lib/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SmartDiscoveryPanelProps {
  onLoadDocument: (url: string, docId: string, fileName: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartDiscoveryPanel({ onLoadDocument }: SmartDiscoveryPanelProps) {
  const { t } = useLocale();

  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [country, setCountry] = useState("US");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<DiscoveryCandidate[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [activityCodes, setActivityCodes] = useState<{ system: string; code: string; description: string }[]>([]);

  // Pre-fill from Company Profile on mount
  useEffect(() => {
    const profile = loadCompanyProfile();
    const identity = profile.identity;
    const activities = profile.activities;

    const hasIdentity = identity.name.trim().length > 0;
    setProfileMissing(!hasIdentity);

    if (identity.primaryCountry) setCountry(identity.primaryCountry);

    const reg = identity.registrations[0];
    if (reg?.country) setJurisdiction(reg.country);

    const codes = activities.activityCodes
      .filter((a) => (a.kind === "registered" || a.kind === "capability") && a.label.trim().length > 0)
      .slice(0, 10)
      .map((a) => ({ system: a.system, code: a.code, description: a.label }));
    setActivityCodes(codes);
  }, []);

  const canSearch =
    consent && description.trim().length >= 10 && jurisdiction.trim().length >= 2 && /^[A-Za-z]{2}$/.test(country);

  const handleSearch = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setCandidates(null);
    try {
      const results = await discoverDocuments({
        data: {
          consent: true,
          description: description.trim(),
          jurisdiction: jurisdiction.trim(),
          country,
          activityCodes: activityCodes.length > 0 ? activityCodes : undefined,
        },
      });
      setCandidates(results);
      if (results.length === 0) setError(t("discovery_no_results"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("discovery_error_generic"));
    } finally {
      setLoading(false);
    }
  }, [canSearch, description, jurisdiction, country, activityCodes, t]);

  const handleAnalyze = useCallback(
    async (candidate: DiscoveryCandidate) => {
      setLoadingId(candidate.id);
      try {
        const fileName = candidate.title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) + ".pdf";
        await onLoadDocument(candidate.pdfUrl, `discovery-${candidate.id}`, fileName);
      } finally {
        setLoadingId(null);
      }
    },
    [onLoadDocument],
  );

  return (
    <section className="pm-discovery-panel" aria-label={t("discovery_panel_aria")}>
      {/* ── Header / toggle ── */}
      <button
        type="button"
        className="pm-discovery-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="pm-discovery-header-left">
          <Search size={16} aria-hidden="true" />
          <span className="pm-discovery-header-title">{t("discovery_title")}</span>
          <span className="pm-discovery-header-badge">{t("discovery_badge")}</span>
        </span>
        {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="pm-discovery-body">
          {/* ── Privacy note ── */}
          <p className="pm-discovery-privacy">
            <Shield size={13} aria-hidden="true" />
            {t("discovery_privacy_note")}
          </p>

          {/* ── Profile missing notice ── */}
          {profileMissing && (
            <p className="pm-discovery-profile-notice" role="note">
              {t("discovery_profile_missing")}
            </p>
          )}

          {/* ── Form ── */}
          <div className="pm-discovery-form">
            <label className="pm-discovery-label" htmlFor="disc-description">
              {t("discovery_description_label")}
            </label>
            <textarea
              id="disc-description"
              className="pm-discovery-textarea"
              rows={3}
              maxLength={500}
              placeholder={t("discovery_description_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="pm-discovery-row">
              <div className="pm-discovery-field">
                <label className="pm-discovery-label" htmlFor="disc-jurisdiction">
                  {t("discovery_jurisdiction_label")}
                </label>
                <input
                  id="disc-jurisdiction"
                  className="pm-discovery-input"
                  type="text"
                  maxLength={150}
                  placeholder={t("discovery_jurisdiction_placeholder")}
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </div>
              <div className="pm-discovery-field pm-discovery-field--narrow">
                <label className="pm-discovery-label" htmlFor="disc-country">
                  {t("discovery_country_label")}
                </label>
                <input
                  id="disc-country"
                  className="pm-discovery-input"
                  type="text"
                  maxLength={2}
                  placeholder="US"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* ── Consent ── */}
            <label className="pm-discovery-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t("discovery_consent_label")}</span>
            </label>

            <button
              type="button"
              className="pm-discovery-search-btn"
              disabled={!canSearch || loading}
              onClick={handleSearch}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="pm-spin" aria-hidden="true" />
                  {t("discovery_searching")}
                </>
              ) : (
                <>
                  <Search size={14} aria-hidden="true" />
                  {t("discovery_search_btn")}
                </>
              )}
            </button>
          </div>

          {/* ── Error ── */}
          {error && <p className="pm-discovery-error" role="alert">{error}</p>}

          {/* ── Results ── */}
          {candidates !== null && candidates.length > 0 && (
            <ul className="pm-discovery-results" aria-label={t("discovery_results_aria")}>
              {candidates.map((c) => (
                <li key={c.id} className="pm-discovery-card">
                  <div className="pm-discovery-card-header">
                    <FileText size={14} aria-hidden="true" className="pm-discovery-card-icon" />
                    <div className="pm-discovery-card-meta">
                      <span className="pm-discovery-card-title">{c.title}</span>
                      <span className="pm-discovery-card-issuer">{c.issuer}</span>
                    </div>
                    <div className="pm-discovery-card-badges">
                      <span className="pm-discovery-badge-pages">{c.pages}p</span>
                      <span className="pm-discovery-badge-score">{c.relevanceScore}%</span>
                    </div>
                  </div>

                  {c.description && (
                    <p className="pm-discovery-card-desc">{c.description}</p>
                  )}

                  <div className="pm-discovery-card-footer">
                    {c.publishedDate && (
                      <span className="pm-discovery-card-date">{c.publishedDate}</span>
                    )}
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pm-discovery-source-link"
                      aria-label={t("discovery_source_link_aria")}
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      {t("discovery_source_link")}
                    </a>
                    <button
                      type="button"
                      className="pm-discovery-analyze-btn"
                      disabled={loadingId !== null}
                      onClick={() => handleAnalyze(c)}
                    >
                      {loadingId === c.id ? (
                        <>
                          <Loader2 size={12} className="pm-spin" aria-hidden="true" />
                          {t("discovery_loading")}
                        </>
                      ) : (
                        t("discovery_analyze_btn")
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* ── Disclaimer ── */}
          <p className="pm-discovery-disclaimer">{t("discovery_disclaimer")}</p>
        </div>
      )}
    </section>
  );
}
