import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectsScreen } from "@/components/pocketmind/ProjectsScreen";
import { LocaleProvider } from "@/lib/i18n";
import type { DocumentRecord, ProjectDocumentLink, ProjectRecord } from "@/lib/types";

const project: ProjectRecord = {
  id: "project-1",
  name: "Northbridge",
  description: "Local tender dossier",
  status: "active",
  createdAt: "2026-11-18T10:00:00.000Z",
  updatedAt: "2026-11-18T10:00:00.000Z",
};

function document(id: string, name: string): DocumentRecord {
  return {
    id,
    name,
    size: 1_024,
    source: "upload",
    format: "pdf",
    pages: ["Extracted text"],
    addedAt: "2026-11-18T10:00:00.000Z",
  };
}

const linkedDocument = document("document-1", "tender.pdf");
const availableDocument = document("document-2", "certificate.pdf");
const link: ProjectDocumentLink = {
  id: "link-1",
  projectId: project.id,
  documentId: linkedDocument.id,
  role: "tender",
  order: 0,
  addedAt: "2026-11-18T10:00:00.000Z",
};

function callbacks() {
  return {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onArchive: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onAddLink: vi.fn().mockResolvedValue(undefined),
    onRemoveLink: vi.fn().mockResolvedValue(undefined),
    onOpenDocument: vi.fn(),
  };
}

describe("ProjectsScreen", () => {
  it("creates a project through an explicit labeled form", async () => {
    const actions = callbacks();
    render(
      <LocaleProvider>
        <ProjectsScreen
          projects={[]}
          documents={[]}
          links={[]}
          reviews={{}}
          activities={[]}
          search=""
          {...actions}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Create project" })[0]!);
    fireEvent.change(screen.getByRole("textbox", { name: "Project name" }), {
      target: { value: "Civic procurement" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Local dossier" },
    });
    const form = screen.getByRole("form", { name: "Create a local project" });
    fireEvent.click(within(form).getByRole("button", { name: "Create project" }));

    await waitFor(() =>
      expect(actions.onCreate).toHaveBeenCalledWith({
        name: "Civic procurement",
        description: "Local dossier",
      }),
    );
  });

  it("opens project details and manages existing local document associations", async () => {
    const actions = callbacks();
    render(
      <LocaleProvider>
        <ProjectsScreen
          projects={[project]}
          documents={[linkedDocument, availableDocument]}
          links={[link]}
          reviews={{}}
          activities={[]}
          search=""
          {...actions}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open project" }));
    expect(screen.getByRole("heading", { name: "Northbridge", level: 2 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));
    const picker = screen.getByRole("form", { name: "Add an existing document" });
    fireEvent.change(screen.getByRole("combobox", { name: "Document role" }), {
      target: { value: "certificate" },
    });
    fireEvent.click(within(picker).getByRole("button", { name: "Add document" }));

    await waitFor(() =>
      expect(actions.onAddLink).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          documentId: availableDocument.id,
          role: "certificate",
        }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove tender.pdf from this project" }));
    await waitFor(() => expect(actions.onRemoveLink).toHaveBeenCalledWith(link));
  });

  it("requires a second explicit action before deleting a project", async () => {
    const actions = callbacks();
    render(
      <LocaleProvider>
        <ProjectsScreen
          projects={[project]}
          documents={[]}
          links={[]}
          reviews={{}}
          activities={[]}
          search=""
          {...actions}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open project" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(actions.onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete project" })[0]!);
    await waitFor(() => expect(actions.onDelete).toHaveBeenCalledWith(project));
  });

  it("keeps the project readable and shows a retryable error when a link cannot be saved", async () => {
    const actions = callbacks();
    actions.onAddLink.mockRejectedValue(new Error("IndexedDB transaction failed"));
    render(
      <LocaleProvider>
        <ProjectsScreen
          projects={[project]}
          documents={[linkedDocument, availableDocument]}
          links={[link]}
          reviews={{}}
          activities={[]}
          search=""
          {...actions}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open project" }));
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));
    const picker = screen.getByRole("form", { name: "Add an existing document" });
    fireEvent.click(within(picker).getByRole("button", { name: "Add document" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("IndexedDB transaction failed");
    expect(screen.getByRole("rowheader", { name: "tender.pdf" })).toBeInTheDocument();
    expect(picker).toBeInTheDocument();
  });
});
