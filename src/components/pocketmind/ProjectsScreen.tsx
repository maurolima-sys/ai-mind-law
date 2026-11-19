import { ArrowRight, FolderPlus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ProjectDetailScreen } from "@/components/pocketmind/ProjectDetailScreen";
import { ProjectForm } from "@/components/pocketmind/ProjectForm";
import { useT } from "@/lib/i18n";
import { buildProjectOverview, type ProjectDraft } from "@/lib/services/projects";
import type {
  DocumentRecord,
  ProjectDocumentLink,
  ProjectRecord,
  Review,
  WorkspaceActivity,
} from "@/lib/types";

export function ProjectsScreen({
  projects,
  documents,
  links,
  reviews,
  activities,
  search,
  onCreate,
  onUpdate,
  onArchive,
  onDelete,
  onAddLink,
  onRemoveLink,
  onOpenDocument,
}: {
  projects: ProjectRecord[];
  documents: DocumentRecord[];
  links: ProjectDocumentLink[];
  reviews: Record<string, Review>;
  activities: WorkspaceActivity[];
  search: string;
  onCreate: (draft: ProjectDraft) => Promise<void>;
  onUpdate: (project: ProjectRecord, draft: ProjectDraft) => Promise<void>;
  onArchive: (project: ProjectRecord) => Promise<void>;
  onDelete: (project: ProjectRecord) => Promise<void>;
  onAddLink: (link: ProjectDocumentLink) => Promise<void>;
  onRemoveLink: (link: ProjectDocumentLink) => Promise<void>;
  onOpenDocument: (documentId: string) => void;
}) {
  const t = useT();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects
      .filter((project) => statusFilter === "all" || project.status === statusFilter)
      .filter(
        (project) =>
          !query ||
          project.name.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query),
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [projects, search, statusFilter]);

  if (selectedProject) {
    return (
      <ProjectDetailScreen
        project={selectedProject}
        documents={documents}
        links={links}
        reviews={reviews}
        activities={activities}
        onBack={() => setSelectedProjectId("")}
        onUpdate={onUpdate}
        onArchive={onArchive}
        onDelete={async (project) => {
          await onDelete(project);
          setSelectedProjectId("");
        }}
        onAddLink={onAddLink}
        onRemoveLink={onRemoveLink}
        onOpenDocument={onOpenDocument}
      />
    );
  }

  return (
    <div className="pm-projects-screen">
      <div className="pm-projects-toolbar">
        <div className="pm-project-filter" aria-label={t("projects_status_filter")}>
          {(["active", "archived", "all"] as const).map((status) => (
            <button
              type="button"
              key={status}
              className={statusFilter === status ? "is-selected" : undefined}
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status === "active"
                ? t("projects_status_active")
                : status === "archived"
                  ? t("projects_status_archived")
                  : t("projects_status_all")}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pm-button pm-button--primary"
          onClick={() => setCreating(true)}
        >
          <FolderPlus size={15} aria-hidden="true" />
          {t("projects_create")}
        </button>
      </div>

      {creating && (
        <ProjectForm
          onCancel={() => setCreating(false)}
          onSave={async (draft) => {
            await onCreate(draft);
            setCreating(false);
          }}
        />
      )}

      {visibleProjects.length ? (
        <div className="pm-project-grid">
          {visibleProjects.map((project) => {
            const overview = buildProjectOverview(project, documents, links, reviews, activities);
            return (
              <article className="pm-project-card" key={project.id}>
                <div className="pm-project-card-top">
                  <span className="pm-project-card-icon">
                    <FolderPlus size={19} aria-hidden="true" />
                  </span>
                  <span className={`pm-project-status is-${project.status}`}>
                    {project.status === "active"
                      ? t("projects_status_active")
                      : t("projects_status_archived")}
                  </span>
                </div>
                <div>
                  <h2>{project.name}</h2>
                  <p>{project.description || t("projects_no_description")}</p>
                </div>
                <dl>
                  <div>
                    <dt>{t("projects_metric_documents")}</dt>
                    <dd>{overview.metrics.documentCount}</dd>
                  </div>
                  <div>
                    <dt>{t("projects_metric_requirements")}</dt>
                    <dd>{overview.metrics.requirementCount}</dd>
                  </div>
                  <div>
                    <dt>{t("projects_metric_critical")}</dt>
                    <dd>{overview.metrics.criticalRiskCount}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="pm-link-button pm-project-open"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {t("projects_open")} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="pm-projects-empty">
          <Search size={24} aria-hidden="true" />
          <h2>{projects.length ? t("projects_no_matches") : t("projects_empty_title")}</h2>
          <p>{projects.length ? t("projects_no_matches_detail") : t("projects_empty_detail")}</p>
          {!creating && (
            <button
              type="button"
              className="pm-button pm-button--primary"
              onClick={() => setCreating(true)}
            >
              <FolderPlus size={15} aria-hidden="true" />
              {t("projects_create")}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
