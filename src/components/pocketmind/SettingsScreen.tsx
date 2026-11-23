import { AlertCircle, Database, Laptop, Save, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { LOCALES, useT, type Locale } from "@/lib/i18n";
import { formatBytes } from "@/lib/services/documentProcessing";
import type { PocketMindPreferences } from "@/lib/preferences";
import type { InferencePreference } from "@/lib/types";
import { loadCompanyProfile, type CompanyProfile } from "@/lib/companyProfile";
import { CompanyProfileSection } from "@/components/pocketmind/CompanyProfileSection";

type SettingsScreenProps = {
  preferences: PocketMindPreferences;
  documentCount: number;
  evidenceCount: number;
  storageBytes: number;
  storageError: string;
  onSave: (preferences: PocketMindPreferences) => void;
  onClearWorkspace: () => Promise<void>;
};

const PROCESSING_MODES: Array<{
  value: InferencePreference;
  labelKey: "settings_mode_local" | "settings_mode_cloud" | "settings_mode_hybrid";
}> = [
  { value: "local", labelKey: "settings_mode_local" },
  { value: "cloud", labelKey: "settings_mode_cloud" },
  { value: "hybrid", labelKey: "settings_mode_hybrid" },
];

export function SettingsScreen({
  preferences,
  documentCount,
  evidenceCount,
  storageBytes,
  storageError,
  onSave,
  onClearWorkspace,
}: SettingsScreenProps) {
  const t = useT();
  const [draft, setDraft] = useState(preferences);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => loadCompanyProfile());

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  function updateDraft(patch: Partial<PocketMindPreferences>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveStatus("idle");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onSave(draft);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function deleteWorkspaceData() {
    if (!deleteConfirmed) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onClearWorkspace();
      setDeleteConfirmed(false);
    } catch {
      setDeleteError(t("settings_delete_error"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      className="pm-settings-screen"
      onSubmit={submit}
      aria-labelledby="settings-preferences-title"
    >
      <section className="pm-panel pm-settings-card">
        <div className="pm-settings-heading">
          <span className="pm-settings-icon">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 id="settings-preferences-title">{t("settings_preferences_title")}</h2>
            <p>{t("settings_preferences_detail")}</p>
          </div>
        </div>

        <div className="pm-settings-field">
          <div>
            <label htmlFor="settings-language">{t("settings_language_label")}</label>
            <p id="settings-language-help">{t("settings_language_detail")}</p>
          </div>
          <select
            id="settings-language"
            name="language"
            value={draft.locale}
            aria-describedby="settings-language-help"
            onChange={(event) => updateDraft({ locale: event.currentTarget.value as Locale })}
          >
            {LOCALES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.flag} {option.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="pm-settings-field pm-settings-mode-field">
          <legend>{t("settings_processing_label")}</legend>
          <p id="settings-processing-help">{t("settings_processing_detail")}</p>
          <div className="pm-settings-mode-grid" aria-describedby="settings-processing-help">
            {PROCESSING_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`pm-settings-mode${draft.defaultProcessingMode === mode.value ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="default-processing-mode"
                  value={mode.value}
                  checked={draft.defaultProcessingMode === mode.value}
                  onChange={() => updateDraft({ defaultProcessingMode: mode.value })}
                />
                <span>
                  {mode.value === "local" ? (
                    <Laptop size={17} aria-hidden="true" />
                  ) : (
                    <ShieldCheck size={17} aria-hidden="true" />
                  )}
                  {t(mode.labelKey)}
                </span>
              </label>
            ))}
          </div>
          <p className="pm-settings-warning">
            <AlertCircle size={14} aria-hidden="true" />
            {t("settings_mode_cloud_warning")}
          </p>
        </fieldset>
      </section>

      <section className="pm-panel pm-settings-card">
        <div className="pm-settings-heading">
          <span className="pm-settings-icon">
            <Volume2 size={19} aria-hidden="true" />
          </span>
          <div>
            <h2>{t("settings_voice_title")}</h2>
            <p>{t("settings_voice_detail")}</p>
          </div>
        </div>

        <div className="pm-settings-toggles">
          <label className="pm-settings-toggle-row">
            <span>
              <strong>{t("settings_tour_narration_label")}</strong>
              <small>{t("settings_tour_narration_detail")}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="tour-narration"
              checked={draft.tourNarrationEnabled}
              onChange={(event) =>
                updateDraft({ tourNarrationEnabled: event.currentTarget.checked })
              }
            />
          </label>
          <label className="pm-settings-toggle-row">
            <span>
              <strong>{t("settings_voice_input_label")}</strong>
              <small>{t("settings_voice_input_detail")}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="voice-input"
              checked={draft.voiceInputEnabled}
              onChange={(event) => updateDraft({ voiceInputEnabled: event.currentTarget.checked })}
            />
          </label>
          <label className="pm-settings-toggle-row">
            <span>
              <strong>{t("settings_answer_speech_label")}</strong>
              <small>{t("settings_answer_speech_detail")}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="answer-speech"
              checked={draft.answerSpeechEnabled}
              onChange={(event) =>
                updateDraft({ answerSpeechEnabled: event.currentTarget.checked })
              }
            />
          </label>
          <label className="pm-settings-toggle-row">
            <span>
              <strong>{t("settings_section_sound_label")}</strong>
              <small>{t("settings_section_sound_detail")}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="section-sound"
              checked={draft.sectionSoundEnabled}
              onChange={(event) =>
                updateDraft({ sectionSoundEnabled: event.currentTarget.checked })
              }
            />
          </label>
        </div>
      </section>

      <section className="pm-panel pm-settings-card">
        <div className="pm-settings-heading">
          <span className="pm-settings-icon">
            <Database size={19} aria-hidden="true" />
          </span>
          <div>
            <h2>{t("settings_local_data_title")}</h2>
            <p>{t("settings_local_data_detail")}</p>
          </div>
          <strong className="pm-settings-storage-summary">
            {t("settings_local_data_summary", {
              documents: documentCount,
              evidence: evidenceCount,
              size: formatBytes(storageBytes),
            })}
          </strong>
        </div>

        <div className="pm-settings-data-warning">
          <AlertCircle size={16} aria-hidden="true" />
          <p>{t("settings_local_data_warning")}</p>
        </div>
        {storageError && (
          <p className="pm-settings-error" role="alert">
            {storageError}
          </p>
        )}

        <div className="pm-settings-delete-zone">
          <div>
            <h3>{t("settings_delete_label")}</h3>
            <p>{t("settings_delete_detail")}</p>
          </div>
          <label className="pm-settings-delete-confirm">
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(event) => setDeleteConfirmed(event.currentTarget.checked)}
              disabled={deleting || (documentCount === 0 && evidenceCount === 0)}
            />
            <span>{t("settings_delete_confirm")}</span>
          </label>
          <button
            type="button"
            className="pm-button pm-button--danger"
            disabled={!deleteConfirmed || deleting || (documentCount === 0 && evidenceCount === 0)}
            onClick={() => void deleteWorkspaceData()}
          >
            <Trash2 size={15} aria-hidden="true" />
            {t("settings_delete_action")}
          </button>
          {deleteError && (
            <p className="pm-settings-error" role="alert">
              {deleteError}
            </p>
          )}
        </div>
      </section>

      <CompanyProfileSection profile={companyProfile} onProfileChange={setCompanyProfile} />

      <div className="pm-settings-actions">
        {saveStatus === "saved" && (
          <p role="status" className="pm-settings-saved">
            {t("settings_saved")}
          </p>
        )}
        {saveStatus === "error" && (
          <p role="alert" className="pm-settings-error">
            {t("settings_save_error")}
          </p>
        )}
        <button type="submit" className="pm-button pm-button--primary">
          <Save size={15} aria-hidden="true" />
          {t("settings_save")}
        </button>
      </div>
    </form>
  );
}
