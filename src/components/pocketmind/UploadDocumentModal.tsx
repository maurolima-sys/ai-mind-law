import { useEffect, useRef, type DragEvent } from "react";
import { FolderOpen, Upload, X } from "lucide-react";

import { GuidePointer } from "@/components/pocketmind/GuidePointer";
import { useT } from "@/lib/i18n";

const ACCEPTED_TYPES =
  ".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Modal for adding a document to the workspace. Opened from the global
 * "Add a document" button; picking or dropping a file runs the caller's
 * add flow (which navigates to the processing screen) and the caller closes
 * the modal once the file is accepted.
 *
 * Uses the native <dialog> element: focus containment, top-layer rendering
 * and Esc dismissal come from the browser.
 */
export function UploadDocumentModal({
  open,
  error,
  onClose,
  onFile,
}: {
  open: boolean;
  error: string;
  onClose: () => void;
  onFile: (file: File) => void;
}) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && open && !dialog.open) {
      // jsdom (test env) has no showModal implementation; fall back to `open`.
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
  }, [open]);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="pm-upload-dialog"
      aria-labelledby="pm-upload-dialog-title"
      onClick={(event) => {
        // Click on the ::backdrop reports the dialog element as target.
        if (event.target === dialogRef.current) onClose();
      }}
      onClose={onClose}
    >
      <div className="pm-upload-dialog-head">
        <span className="pm-file-icon pm-file-icon--large" aria-hidden="true">
          <Upload size={20} />
        </span>
        <div className="pm-upload-dialog-heading">
          <h3 id="pm-upload-dialog-title">{t("btn_add_document")}</h3>
          <p>{t("drop_or")}</p>
        </div>
        <button
          type="button"
          className="pm-source-drawer-close"
          aria-label={t("upload_close")}
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>

      <div
        className="pm-upload-dialog-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="pm-drop-icon" aria-hidden="true">
          <Upload size={22} />
        </span>
        <strong>{t("drop_title")}</strong>
        <button
          type="button"
          data-guide="choose-file"
          className="pm-button pm-button--primary"
          onClick={() => inputRef.current?.click()}
        >
          <FolderOpen size={15} /> {t("drop_choose")}
        </button>
        <small>{t("drop_note")}</small>
        {error ? (
          <p className="pm-upload-dialog-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        className="pm-visually-hidden"
        type="file"
        accept={ACCEPTED_TYPES}
        aria-label={t("file_input_aria")}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) onFile(file);
        }}
      />

      <GuidePointer
        targetSelector={open ? "[data-guide='choose-file']" : null}
        renderInPortal={false}
      />
    </dialog>
  );
}
