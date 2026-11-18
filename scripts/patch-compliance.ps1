$file = "src\components\pocketmind\PocketMindApp.tsx"
$lines = Get-Content $file

# Keep lines 1..2465 (indices 0..2464) and 2680..end (indices 2679..end)
$before = $lines[0..2464]
$after  = $lines[2679..($lines.Length - 1)]

$newBlock = @'
  const verifiedCount = requirements.filter((r) => r.evidence.verified).length;
  const pendingCount  = requirements.filter((r) => (reviews[r.id]?.status ?? "pending") === "pending").length;

  return (
    <div className="pm-compliance-screen">
      {/* Sub-header: breadcrumb + KPI pills */}
      <div className="pm-compliance-sub">
        <div className="pm-compliance-sub-left">
          <ClipboardCheck size={15} />
          <span>{t("compliance_col_requirement")}</span>
          <span style={{color:"var(--pm-soft)"}}>·</span>
          <span>{requirements.length} {t("compliance_summary_reqs", { count: requirements.length })}</span>
        </div>
        <div className="pm-compliance-sub-right">
          <span className="pm-pill-in-review">
            <CheckCircle2 size={12} /> {verifiedCount} {t("compliance_summary_verified")}
          </span>
          {pendingCount > 0 && (
            <span className="pm-status-pill-score pm-status-pill-score--pending">
              {pendingCount} {t("compliance_status_pending")}
            </span>
          )}
        </div>
      </div>

      {analysis.mode === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>{t("compliance_demo_inline")}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="pm-compliance-toolbar">
        <label className="pm-table-search">
          <Search size={16} />
          <span aria-label="Search requirements">{search || t("compliance_search_hint")}</span>
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">{t("compliance_category_filter_sr")}</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.currentTarget.value)}>
            <option value="all">{t("compliance_all_categories")}</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">{t("compliance_status_filter_sr")}</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.currentTarget.value)}>
            <option value="all">{t("compliance_all_statuses")}</option>
            <option value="pending">{t("compliance_status_pending")}</option>
            <option value="reviewed">{t("compliance_status_reviewed")}</option>
            <option value="satisfied">{t("compliance_status_satisfied")}</option>
            <option value="unclear">{t("compliance_status_unclear")}</option>
          </select>
          <ChevronDown size={15} />
        </label>
        <button className="pm-button pm-button--primary pm-export-button" type="button" onClick={onExport}>
          <ArrowDownToLine size={16} /> {t("compliance_export_csv")}
        </button>
      </div>

      <div className="pm-compliance-layout">
        {/* Matrix table */}
        <section className="pm-panel pm-matrix-panel">
          <div className="pm-matrix-summary">
            <span><strong>{requirements.length}</strong> {t("compliance_summary_reqs", { count: requirements.length })}</span>
            <span><strong>{verifiedCount}</strong> {t("compliance_summary_verified")}</span>
            <span><strong>{filteredRequirements.length}</strong> {t("compliance_summary_shown")}</span>
          </div>
          {filteredRequirements.length ? (
            <div className="pm-table-wrap">
              <table className="pm-table pm-matrix-table">
                <thead>
                  <tr>
                    <th>{t("compliance_col_requirement")}</th>
                    <th>{t("compliance_col_category")}</th>
                    <th>{t("compliance_col_mandatory")}</th>
                    <th>{t("compliance_col_evidence")}</th>
                    <th>{t("compliance_col_page")}</th>
                    <th>{t("compliance_col_review_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((req) => {
                    const review = reviews[req.id] ?? { status: "pending" as ReviewStatus, notes: "" };
                    const statusClass = `pm-status-pill-score pm-status-pill-score--${review.status}`;
                    return (
                      <tr key={req.id} className={selectedRequirementId === req.id ? "is-selected" : ""}>
                        <td>
                          <button className="pm-requirement-select" type="button" onClick={() => onSelectRequirement(req.id)}>
                            {req.description}
                          </button>
                        </td>
                        <td><Badge tone="purple">{req.category}</Badge></td>
                        <td>
                          <Badge tone={req.mandatory ? "red" : "neutral"}>
                            {req.mandatory ? t("compliance_mandatory_yes") : t("compliance_mandatory_no")}
                          </Badge>
                        </td>
                        <td>
                          {req.evidence.excerpt ? (
                            <span className={req.evidence.verified ? "pm-verified-text" : "pm-unverified-text"}>
                              {req.evidence.verified ? t("compliance_verified") : t("compliance_check_excerpt")}
                            </span>
                          ) : (
                            <span className="pm-muted-label">{t("compliance_not_provided")}</span>
                          )}
                        </td>
                        <td>{req.evidence.page ?? "—"}</td>
                        <td>
                          <label className="pm-status-select">
                            <span className="sr-only">{t("review_status_sr", { description: req.description })}</span>
                            <select
                              value={review.status}
                              onChange={(e) => {
                                const status = STATUSES.find((s) => s === e.currentTarget.value);
                                if (status) onUpdateReview(req.id, { status });
                              }}
                            >
                              <option value="pending">{t("compliance_status_pending")}</option>
                              <option value="reviewed">{t("compliance_status_reviewed")}</option>
                              <option value="satisfied">{t("compliance_status_satisfied")}</option>
                              <option value="unclear">{t("compliance_status_unclear")}</option>
                            </select>
                            <ChevronDown size={14} />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pm-empty-state">
              <Search size={21} />
              <strong>{t("compliance_empty_title")}</strong>
              <span>{t("compliance_empty_detail")}</span>
            </div>
          )}
          <div className="pm-panel-foot">
            <span>{t("compliance_footer_session")}</span>
            <span>{filteredRequirements.length} {t("compliance_count_of")} {requirements.length}</span>
          </div>
        </section>

        {/* Right drawer */}
        <aside className="pm-source-drawer">
          <div className="pm-source-drawer-head">
            <h3>{t("evidence_panel_title")}</h3>
            <FileCheck2 size={16} />
          </div>
          {selectedRequirement ? (
            <>
              {/* Doc badge */}
              <div className="pm-drawer-doc-badge">
                <span style={{fontWeight:700, color:"var(--pm-ink)", fontSize:"0.8rem"}}>{selectedRequirement.description.slice(0, 60)}{selectedRequirement.description.length > 60 ? "…" : ""}</span>
                <div style={{display:"flex", gap:"6px", flexShrink:0}}>
                  <Badge tone="purple">{selectedRequirement.category}</Badge>
                  {selectedRequirement.evidence.page && (
                    <Badge tone="blue">{t("evidence_page_badge", { page: selectedRequirement.evidence.page })}</Badge>
                  )}
                </div>
              </div>

              {/* Certificate-style preview when verified */}
              {selectedRequirement.evidence.verified && (
                <div className="pm-cert-preview-card">
                  <div className="pm-cert-seal-icon"><ShieldCheck size={28} /></div>
                  <h5>{t("compliance_verified").toUpperCase()}</h5>
                  <p>{t("evidence_panel_subtitle")}</p>
                  <small>{t("compliance_col_page")} {selectedRequirement.evidence.page ?? "—"}</small>
                </div>
              )}

              {/* Extracted excerpt */}
              {selectedRequirement.evidence.excerpt ? (
                <div className="pm-extracted-ai-box">
                  <div className="pm-extracted-ai-header">
                    <span>{t("source_panel_title")}</span>
                    <EvidenceStatus evidence={selectedRequirement.evidence} />
                  </div>
                  <p>"{selectedRequirement.evidence.excerpt}"</p>
                </div>
              ) : (
                <div className="pm-evidence-missing">{t("evidence_no_excerpt")}</div>
              )}

              {/* Relevance bar */}
              {selectedRequirement.evidence.verified && (
                <div className="pm-relevance-bar-wrap" style={{marginBottom:"14px"}}>
                  <div className="pm-relevance-label-row">
                    <span style={{color:"var(--pm-ink)"}}>Relevance</span>
                    <span style={{color:"#16a34a"}}>High</span>
                  </div>
                  <div className="pm-relevance-progress-track">
                    <div className="pm-relevance-progress-fill" style={{width:"82%"}} />
                  </div>
                </div>
              )}

              {/* Review notes */}
              <label className="pm-notes-label">
                {t("evidence_notes_label")}
                <textarea
                  value={reviews[selectedRequirement.id]?.notes ?? ""}
                  onChange={(e) => onUpdateReview(selectedRequirement.id, { notes: e.currentTarget.value })}
                  placeholder={t("evidence_notes_placeholder")}
                  rows={4}
                />
              </label>
            </>
          ) : (
            <div className="pm-empty-inline">{t("evidence_select_hint")}</div>
          )}
        </aside>
      </div>
    </div>
  );
'@

$result = $before + $newBlock.Split("`n") + $after
$result | Set-Content $file -Encoding UTF8
Write-Host "Patched. Total lines: $($result.Length)"
