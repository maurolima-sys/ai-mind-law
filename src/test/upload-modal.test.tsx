import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidePointer } from "@/components/pocketmind/GuidePointer";
import { UploadDocumentModal } from "@/components/pocketmind/UploadDocumentModal";
import { LocaleProvider } from "@/lib/i18n";

describe("UploadDocumentModal", () => {
  it("renders the choose-file button tagged as the guided-action target", () => {
    render(
      <LocaleProvider>
        <UploadDocumentModal open error="" onClose={vi.fn()} onFile={vi.fn()} />
      </LocaleProvider>,
    );

    const choose = document.querySelector("[data-guide='choose-file']");
    expect(choose).not.toBeNull();
    expect(choose?.textContent).toContain("Choose document");
    expect(screen.getByText("Add a document")).toBeInTheDocument();
  });

  it("calls onFile with the file picked through the hidden input", () => {
    const onFile = vi.fn();
    render(
      <LocaleProvider>
        <UploadDocumentModal open error="" onClose={vi.fn()} onFile={onFile} />
      </LocaleProvider>,
    );

    const input = document.querySelector("input[type='file']");
    expect(input).not.toBeNull();
    const file = new File(["pdf content"], "tender.pdf", { type: "application/pdf" });
    Object.defineProperty(input!, "files", { value: [file], configurable: true });
    fireEvent.change(input!);
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("shows inline errors and closes via the close button", () => {
    const onClose = vi.fn();
    render(
      <LocaleProvider>
        <UploadDocumentModal
          open
          error="Format not supported. Choose a PDF, DOCX, or XLSX file (max 50 MB)."
          onClose={onClose}
          onFile={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close upload dialog" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("stays out of the DOM when closed", () => {
    render(
      <LocaleProvider>
        <UploadDocumentModal open={false} error="" onClose={vi.fn()} onFile={vi.fn()} />
      </LocaleProvider>,
    );

    expect(document.querySelector(".pm-upload-dialog")).toBeNull();
  });
});

describe("GuidePointer", () => {
  function renderWithTarget(selector: string) {
    const target = document.createElement("button");
    target.setAttribute("data-guide", selector.replace(/^\[[^=]+='|'\]$/g, ""));
    document.body.appendChild(target);
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      left: 120,
      top: 64,
      width: 200,
      height: 40,
      right: 320,
      bottom: 104,
      x: 120,
      y: 64,
      toJSON: () => ({}),
    } as DOMRect);
    return target;
  }

  it("renders ring and cursor over an existing target", async () => {
    renderWithTarget("target");
    render(
      <LocaleProvider>
        <GuidePointer targetSelector="[data-guide='target']" />
      </LocaleProvider>,
    );

    await vi.waitFor(() => {
      expect(document.querySelector(".pm-guide-layer")).not.toBeNull();
    });
    expect(document.querySelector(".pm-guide-ring")).not.toBeNull();
    expect(document.querySelector(".pm-guide-cursor")).not.toBeNull();
  });

  it("renders nothing when the target is missing", () => {
    render(
      <LocaleProvider>
        <GuidePointer targetSelector="[data-guide='missing']" />
      </LocaleProvider>,
    );

    expect(document.querySelector(".pm-guide-layer")).toBeNull();
  });
});
