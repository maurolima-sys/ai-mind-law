import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  LoaderCircle,
  Link2,
  Unlink,
} from "lucide-react";
import { useMemo, useRef, type ChangeEvent } from "react";

import type {
  EvidenceMatch,
  InferencePreference,
  Requirement,
  RequirementEvidenceLink,
  SupportingEvidenceDocument,
} from "@/lib/types";
import { useT } from "@/lib/i18n";

export function EvidenceComparisonPanel({
  tenderDocumentId,
  requirements,
  selectedRequirementId,
  evidenceDocuments,
  links,
  matches,
  selectedEvidenceId,
  preference,
  cloudConsent,
  isComparing,
  isAddingEvidence,
  progress,
  error,
  demo,
  onSelectEvidence,
  onSelectRequirement,
  onUpload,
  onLink,
  onUnlink,
  onCompare,
  onCloudConsentChange,
}: {
  tenderDocumentId: string;
  requirements: Requirement[];
  selectedRequirementId: string;
  evidenceDocuments: SupportingEvidenceDocument[];
  links: RequirementEvidenceLink[];
  matches: EvidenceMatch[];
  selectedEvidenceId: string;
  preference: InferencePreference | null;
  cloudConsent: boolean;
  isComparing: boolean;
  isAddingEvidence: boolean;
  progress: string;
  error: string;
  demo: boolean;
  onSelectEvidence: (id: string) => void;
  onSelectRequirement: (id: string) => void;
  onUpload: (file: File) => void;
  onLink: (requirementId: string, evidenceDocumentId: string) => void;
  onUnlink: (linkId: string) => void;
  onCompare: (requirementId: string, evidenceDocumentId: string) => void;
  onCloudConsentChange: (checked: boolean) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requirement = requirements.find((item) => item.id === selectedRequirementId);
  const tenderEvidence = evidenceDocuments.filter(
    (document) => document.tenderDocumentId === tenderDocumentId,
  );
  const selectedEvidence = tenderEvidence.find((document) => document.id === selectedEvidenceId);
  const requirementLinks = links.filter(
    (link) => link.tenderDocumentId === tenderDocumentId && link.requirementId === requirement?.id,
  );
  const selectedLink = requirementLinks.find(
    (link) => link.evidenceDocumentId === selectedEvidenceId,
  );
  const result = useMemo(
    () =>
      matches.find(
        (match) =>
          match.requirementId === requirement?.id &&
          match.evidenceDocumentId === selectedEvidenceId,
      ),
    [matches, requirement?.id, selectedEvidenceId],
  );
  const needsCloudConsent = preference === "cloud" || preference === "hybrid";

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) onUpload(file);
    event.currentTarget.value = "";
  }

  return (
    <section className="pm-panel pm-evidence-comparison">
      <div className="pm-panel-heading">
        <div>
          <h2>{t("evidence_compare_title")}</h2>
          <p>{t("evidence_compare_detail")}</p>
        </div>
        <FileCheck2 size={18} aria-hidden="true" />
      </div>

      {demo ? (
        <p className="pm-evidence-note">{t("evidence_compare_demo")}</p>
      ) : requirements.length === 0 ? (
        <p className="pm-evidence-note">{t("evidence_compare_no_requirements")}</p>
      ) : !requirement ? (
        <p className="pm-evidence-note">{t("evidence_compare_select_requirement")}</p>
      ) : (
        <div className="pm-evidence-compare-body">
          <label className="pm-evidence-select-label" htmlFor="pm-evidence-requirement-select">
            {t("evidence_compare_requirement")}
          </label>
          <select
            id="pm-evidence-requirement-select"
            value={requirement.id}
            onChange={(event) => onSelectRequirement(event.currentTarget.value)}
          >
            {requirements.map((item) => (
              <option key={item.id} value={item.id}>
                {item.description}
              </option>
            ))}
          </select>
          <strong className="pm-evidence-requirement">{requirement.description}</strong>
          <label className="pm-evidence-select-label" htmlFor="pm-evidence-file-select">
            {t("evidence_compare_select_file")}
          </label>
          <select
            id="pm-evidence-file-select"
            value={selectedEvidenceId}
            onChange={(event) => onSelectEvidence(event.currentTarget.value)}
            disabled={tenderEvidence.length === 0}
          >
            <option value="">{t("evidence_compare_choose_file")}</option>
            {tenderEvidence.map((document) => (
              <option key={document.id} value={document.id}>
                {document.name}
              </option>
            ))}
          </select>

          <input
            ref={inputRef}
            className="pm-visually-hidden"
            type="file"
            accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label={t("evidence_compare_file_input")}
            onChange={handleUpload}
          />
          <button
            className="pm-button pm-button--outline"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isAddingEvidence}
          >
            {isAddingEvidence ? (
              <>
                <LoaderCircle size={15} className="pm-spin" /> {t("evidence_compare_adding_file")}
              </>
            ) : (
              <>
                <FilePlus2 size={15} /> {t("evidence_compare_add_file")}
              </>
            )}
          </button>

          {selectedEvidence && (
            <div className="pm-evidence-link-actions">
              {selectedLink ? (
                <button
                  className="pm-button pm-button--danger-outline"
                  type="button"
                  onClick={() => onUnlink(selectedLink.id)}
                >
                  <Unlink size={15} /> {t("evidence_compare_unlink")}
                </button>
              ) : (
                <button
                  className="pm-button pm-button--outline"
                  type="button"
                  onClick={() => onLink(requirement.id, selectedEvidence.id)}
                >
                  <Link2 size={15} /> {t("evidence_compare_link")}
                </button>
              )}
              {selectedLink && (
                <span className="pm-evidence-linked-label">
                  <CheckCircle2 size={14} /> {t("evidence_compare_linked")}
                </span>
              )}
            </div>
          )}

          {needsCloudConsent && selectedEvidence && (
            <label className="pm-cloud-consent pm-evidence-cloud-consent">
              <input
                type="checkbox"
                checked={cloudConsent}
                onChange={(event) => onCloudConsentChange(event.currentTarget.checked)}
              />
              <span className="pm-consent-check">
                <CheckCircle2 size={13} />
              </span>
              <span>
                <strong>{t("evidence_compare_cloud_consent")}</strong>
                <small>
                  {t("evidence_compare_cloud_consent_detail", {
                    name: selectedEvidence.name,
                  })}
                </small>
              </span>
            </label>
          )}

          {selectedEvidence && (
            <button
              className="pm-button pm-button--primary"
              type="button"
              disabled={
                isComparing || !selectedLink || !preference || (needsCloudConsent && !cloudConsent)
              }
              onClick={() => onCompare(requirement.id, selectedEvidence.id)}
            >
              {isComparing ? (
                <>
                  <LoaderCircle size={15} className="pm-spin" /> {t("evidence_compare_running")}
                </>
              ) : (
                t("evidence_compare_action")
              )}
            </button>
          )}

          {progress && (
            <p className="pm-evidence-progress" role="status">
              <LoaderCircle size={14} className="pm-spin" /> {progress}
            </p>
          )}
          {error && (
            <p className="pm-evidence-error" role="alert">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {result && <EvidenceMatchResult result={result} document={selectedEvidence} />}
          {requirementLinks.length > 0 && (
            <ul className="pm-evidence-linked-list" aria-label={t("evidence_compare_linked_files")}>
              {requirementLinks.map((link) => {
                const document = tenderEvidence.find((item) => item.id === link.evidenceDocumentId);
                return document ? (
                  <li key={link.id}>
                    <span>{document.name}</span>
                    <button
                      type="button"
                      className="pm-icon-button"
                      aria-label={t("evidence_compare_unlink_named", { name: document.name })}
                      onClick={() => onUnlink(link.id)}
                    >
                      <Unlink size={14} />
                    </button>
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function EvidenceMatchResult({
  result,
  document,
}: {
  result: EvidenceMatch;
  document: SupportingEvidenceDocument | undefined;
}) {
  const t = useT();
  const assessmentLabel =
    result.assessment === "supports"
      ? t("evidence_assessment_supports")
      : result.assessment === "contradicts"
        ? t("evidence_assessment_contradicts")
        : t("evidence_assessment_insufficient");

  return (
    <article className={`pm-evidence-match pm-evidence-match--${result.assessment}`}>
      <div className="pm-evidence-match-heading">
        <div>
          <strong>{assessmentLabel}</strong>
          <span>
            {t("evidence_compare_ai_estimate", { confidence: Math.round(result.confidence * 100) })}
          </span>
        </div>
        <small>{result.model}</small>
      </div>
      <p>{result.explanation}</p>
      {result.evidence.excerpt && (
        <blockquote>
          <mark>{result.evidence.excerpt}</mark>
        </blockquote>
      )}
      <div className="pm-evidence-match-source">
        <span>
          {document?.name ?? t("evidence_compare_unknown_file")}
          {result.evidence.sourceLocation ? ` · ${result.evidence.sourceLocation}` : ""}
        </span>
        <span>
          {result.evidence.verified
            ? t("evidence_compare_quote_verified")
            : t("evidence_compare_quote_unverified")}
        </span>
      </div>
    </article>
  );
}
