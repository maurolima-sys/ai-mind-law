import { useEffect, useState, type FormEvent } from "react";

import { useT } from "@/lib/i18n";
import { validateProjectDraft, type ProjectDraft } from "@/lib/services/projects";
import type { ProjectRecord } from "@/lib/types";

export function ProjectForm({
  project,
  onSave,
  onCancel,
}: {
  project?: ProjectRecord;
  onSave: (draft: ProjectDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setError("");
  }, [project]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = { name, description };
    const validationError = validateProjectDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("projects_save_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="pm-project-form"
      onSubmit={(event) => void submit(event)}
      aria-labelledby="project-form-title"
    >
      <div>
        <h2 id="project-form-title">
          {project ? t("projects_edit_title") : t("projects_create_title")}
        </h2>
        <p>{project ? t("projects_edit_detail") : t("projects_create_detail")}</p>
      </div>

      <div className="pm-project-form-field">
        <label htmlFor="project-name">{t("projects_name_label")}</label>
        <input
          id="project-name"
          name="project-name"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
            setError("");
          }}
          maxLength={120}
          required
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "project-form-error" : undefined}
        />
      </div>

      <div className="pm-project-form-field">
        <label htmlFor="project-description">{t("projects_description_label")}</label>
        <textarea
          id="project-description"
          name="project-description"
          value={description}
          onChange={(event) => {
            setDescription(event.currentTarget.value);
            setError("");
          }}
          maxLength={1000}
          rows={4}
        />
      </div>

      {error && (
        <p id="project-form-error" className="pm-project-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="pm-project-form-actions">
        <button type="button" className="pm-button pm-button--outline" onClick={onCancel}>
          {t("projects_cancel")}
        </button>
        <button type="submit" className="pm-button pm-button--primary" disabled={saving}>
          {saving
            ? t("projects_saving")
            : project
              ? t("projects_save_changes")
              : t("projects_create")}
        </button>
      </div>
    </form>
  );
}
