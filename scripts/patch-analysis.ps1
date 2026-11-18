$file = "src\components\pocketmind\PocketMindApp.tsx"
$lines = Get-Content $file

# Lines are 1-indexed; array is 0-indexed
# Keep lines 1..2079 (indices 0..2078) and 2393..end (indices 2392..end)
$before = $lines[0..2078]
$after  = $lines[2392..($lines.Length - 1)]

$newBlock = @'
  const [activeTab, setActiveTab] = React.useState<"analysis" | "summary" | "qa" | "compare">("analysis");
  return (
    <div className="pm-analysis-screen">
      {/* Document header */}
      <div className="pm-doc-subheader-aligned">
        <div className="pm-doc-sub-left">
          <span className="pm-file-icon pm-file-icon--large"><FileText size={20} /></span>
          <div>
            <h2>{document.name}</h2>
            <div className="pm-doc-sub-meta">
              <span>
                {document.source === "demo"
                  ? t("toolbar_fictional_sample")
                  : format === "pdf"
                    ? t("toolbar_pdf_document")
                    : format === "docx"
                      ? t("toolbar_docx_document")
                      : t("toolbar_xlsx_document")}
              </span>
              <span>·</span>
              <span>
                {hasPdfPagination
                  ? `${document.pages.length} ${t("toolbar_pages")}`
                  : `${document.pages.length} ${t("toolbar_source_sections")}`}
              </span>
              <span>·</span>
              <span>{formatBytes(document.size)}</span>
              <Badge tone={modeSourceTone(processingSource)}>{modeLabel(processingSource, t)}</Badge>
              {textSource === "llamaparse" && <Badge tone="amber">{t("toolbar_llamaparse_badge")}</Badge>}
            </div>
          </div>
        </div>
        <button className="pm-button pm-button--dark" type="button" onClick={onExport}>
          <ArrowDownToLine size={16} /> {t("toolbar_export_json")}
        </button>
      </div>

      {document.source === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>{analysis.mode === "demo" ? t("warning_demo_prepared") : t("warning_demo_ai")}</span>
        </div>
      )}

      {textSource === "llamaparse" && !paginationVerified && (
        <div className="pm-inline-warning" role="status">
          <AlertCircle size={16} />
          <span>{t("warning_llamaparse_no_pages")}</span>
        </div>
      )}

      {/* Summary strip */}
      <section className="pm-summary-strip">
        <div className="pm-summary-icon"><Sparkles size={18} /></div>
        <div>
          <strong>{t("summary_title")}</strong>
          <p>{analysis.summary}</p>
        </div>
        <div className="pm-summary-meta">
          <span>{analysis.engine}</span>
          <small>{new Date(analysis.generatedAt).toLocaleDateString()}</small>
        </div>
      </section>

      {/* Split-screen layout */}
      <div className="pm-analysis-layout">
        {/* Left: source viewer */}
        <section className="pm-panel pm-source-panel">
          {/* Viewer toolbar */}
          <div className="pm-viewer-toolbar">
            <div className="pm-toolbar-group">
              <button
                type="button"
                className="pm-toolbar-icon-btn"
                aria-label={t("source_prev_page")}
                disabled={activePage <= 1}
                onClick={() => onSelectSource(activePage - 1, null)}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="pm-page-counter-pill">
                {hasPdfPagination
                  ? t("source_page_of", { page: activePage, total: document.pages.length })
                  : sourceLocation}
              </span>
              <button
                type="button"
                className="pm-toolbar-icon-btn"
                aria-label={t("source_next_page")}
                disabled={activePage >= document.pages.length}
                onClick={() => onSelectSource(activePage + 1, null)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="pm-toolbar-group">
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Zoom out"><ZoomOut size={14} /></button>
              <span className="pm-zoom-pill">100%</span>
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Zoom in"><ZoomIn size={14} /></button>
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Expand"><Maximize2 size={14} /></button>
            </div>
          </div>
          <SourceDocumentViewer
            file={sourceFile}
            format={format}
            name={document.name}
            pageText={pageText}
            pageNumber={activePage}
            pageCount={document.pages.length}
            sourceLocation={sourceLocation}
            excerpt={activeExcerpt}
          />
          {/* Thumbnail strip */}
          {document.pages.length > 1 && (
            <div className="pm-thumbnail-strip">
              {document.pages.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pm-thumb-box${activePage === idx + 1 ? " is-active" : ""}`}
                  onClick={() => onSelectSource(idx + 1, null)}
                  aria-label={`Page ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
              {document.pages.length > 8 && (
                <span className="pm-zoom-pill">+{document.pages.length - 8}</span>
              )}
            </div>
          )}
        </section>

        {/* Right: tabbed analysis panel */}
        <section className="pm-findings-panel">
          {/* Tabs */}
          <div className="pm-analysis-tabs-header">
            {(["analysis", "summary", "qa", "compare"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pm-analysis-tab-btn${activeTab === tab ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "analysis" && <ScrollText size={14} />}
                {tab === "summary" && <Sparkles size={14} />}
                {tab === "qa" && <CircleHelp size={14} />}
                {tab === "compare" && <Table2 size={14} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "analysis" && (
            <>
              {/* Filter chips */}
              <div className="pm-filter-row" aria-label="Filter findings" style={{padding: "10px 12px 0"}}>
                {filterOptions.map((option) => (
                  <button
                    type="button"
                    aria-pressed={activeFinding === option.id}
                    className={`pm-filter-chip${activeFinding === option.id ? " is-selected" : ""}`}
                    key={option.id}
                    onClick={() => onSelectFilter(option.id)}
                  >
                    {option.label}<span>{option.count}</span>
                  </button>
                ))}
              </div>

              <div className="pm-findings-list">
                {findings.length ? (
                  findings.map((finding) => {
                    const conf = finding.confidence ?? 0;
                    const confTag = conf >= 0.8 ? "green" : conf >= 0.6 ? "yellow" : "orange";
                    return (
                      <article className="pm-finding-card-clean" key={finding.id}>
                        <div className="pm-finding-card-meta">
                          <Badge
                            tone={
                              finding.kind === "Risk"
                                ? finding.severity === "Critical" || finding.severity === "High" ? "red" : "amber"
                                : finding.kind === "Missing information" ? "amber" : "blue"
                            }
                          >
                            {finding.kind}
                          </Badge>
                          {finding.severity && (
                            <Badge tone={finding.severity === "Critical" || finding.severity === "High" ? "red" : "amber"}>
                              {finding.severity}
                            </Badge>
                          )}
                          {finding.confidence !== undefined && (
                            <span className={`pm-confidence-tag pm-confidence-tag--${confTag}`}>
                              {Math.round(finding.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <h5>{finding.title}</h5>
                        {finding.excerpt && <blockquote>"{finding.excerpt}"</blockquote>}
                        <div className="pm-finding-meta" style={{marginTop: "8px"}}>
                          {finding.sourceIndex !== null ? (
                            <button
                              className="pm-page-link"
                              type="button"
                              onClick={() => {
                                if (finding.sourceIndex !== null) {
                                  onSelectSource(
                                    finding.sourceIndex,
                                    finding.excerpt,
                                    finding.kind === "Requirement" ? finding.id : undefined,
                                  );
                                }
                              }}
                            >
                              <FileText size={13} />{" "}
                              {finding.page !== null
                                ? t("finding_page", { page: finding.page })
                                : (finding.sourceLocation ?? `Source section ${finding.sourceIndex}`)}
                            </button>
                          ) : (
                            <span className="pm-muted-label">{t("finding_no_source_page")}</span>
                          )}
                          <EvidenceStatus
                            evidence={{
                              page: finding.page,
                              excerpt: finding.excerpt,
                              verified: finding.verified,
                              sourceIndex: finding.sourceIndex,
                              sourceLocation: finding.sourceLocation,
                            }}
                          />
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="pm-empty-state">
                    <Filter size={22} />
                    <strong>{search ? t("findings_empty_search") : t("findings_empty_category")}</strong>
                    <span>{t("findings_empty_hint")}</span>
                  </div>
                )}
              </div>
              <div className="pm-human-review-note">
                <CircleHelp size={16} />
                <span>{t("findings_disclaimer")}</span>
              </div>
            </>
          )}

          {activeTab === "summary" && (
            <div style={{padding: "16px"}}>
              <section className="pm-inference-report" aria-label="Analysis run status">
                <div className="pm-inference-report-heading">
                  <strong>{t("inference_title")}</strong>
                  <Badge tone={modeSourceTone(processingSource)}>
                    {t("inference_processing_source")} {modeLabel(processingSource, t)}
                  </Badge>
                </div>
                <dl>
                  <div>
                    <dt>{t("inference_firebase_label")}</dt>
                    <dd>{analysis.mode === "demo" ? t("inference_firebase_not_used") : t("inference_firebase_connected")}</dd>
                  </div>
                  <div>
                    <dt>{t("inference_model_label")}</dt>
                    <dd>{analysis.model ?? analysis.engine}</dd>
                  </div>
                  <div>
                    <dt>{t("inference_evidence_label")}</dt>
                    <dd>{t("inference_evidence_value")}</dd>
                  </div>
                  <div>
                    <dt>{t("inference_demo_label")}</dt>
                    <dd>{document.source === "demo" ? t("inference_yes") : t("inference_no")}</dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {activeTab === "qa" && (
            <DocumentQaPanel
              key={document.id}
              documentName={document.name}
              pages={document.pages}
              format={format}
              sourceLocations={sourceLocations}
              draft={questionDraft}
              onDraftChange={onQuestionDraftChange}
              preference={preference}
              cloudConsent={cloudConsent}
              paginationVerified={hasPdfPagination}
              onOpenProcessing={onOpenProcessing}
              onSelectPage={(index, excerpt) => onSelectSource(index, excerpt ?? null)}
              onModelResponse={onModelResponse}
            />
          )}

          {activeTab === "compare" && (
            <EvidenceComparisonPanel
              tenderDocumentId={document.id}
              requirements={analysis.requirements}
              selectedRequirementId={selectedRequirementId}
              evidenceDocuments={evidenceDocuments}
              links={evidenceLinks}
              matches={evidenceMatches}
              selectedEvidenceId={selectedEvidenceId}
              preference={preference}
              cloudConsent={evidenceCloudConsent}
              isAddingEvidence={isAddingEvidence}
              isComparing={isComparingEvidence}
              progress={evidenceComparisonProgress}
              error={evidenceComparisonError}
              demo={document.source === "demo"}
              onSelectRequirement={onSelectRequirement}
              onSelectEvidence={onSelectEvidence}
              onUpload={onUploadEvidence}
              onLink={onLinkEvidence}
              onUnlink={onUnlinkEvidence}
              onCompare={onCompareEvidence}
              onCloudConsentChange={onEvidenceCloudConsentChange}
            />
          )}
        </section>
      </div>
    </div>
  );
'@

$result = $before + $newBlock.Split("`n") + $after
$result | Set-Content $file -Encoding UTF8
Write-Host "Patched. Total lines: $($result.Length)"
