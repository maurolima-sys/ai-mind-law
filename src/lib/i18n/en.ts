export const en = {
  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  nav_dashboard: "Dashboard",
  nav_library: "Documents",
  nav_analysis: "Analysis",
  nav_compliance: "Compliance matrix",
  nav_processing: "Processing",

  // â”€â”€ Screen titles / subtitles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  screen_overview_title: "Your document intelligence workspace",
  screen_overview_subtitle:
    "Turn complex tenders into reviewable findings, with source evidence attached.",
  screen_library_title: "Local document library",
  screen_library_subtitle: "Your tender files, evidence, and review work stay in this browser.",
  screen_analysis_title: "Document analysis",
  screen_analysis_subtitle: "Review extracted findings beside their source pages.",
  screen_compliance_title: "Compliance matrix",
  screen_compliance_subtitle:
    "Track tender citations, bidder evidence, and your own review status.",
  screen_processing_title: "Choose how your document is processed",
  screen_processing_subtitle:
    "Text is extracted in this browser. You control whether AI may process it in the cloud.",
  screen_risks_title: "Risk register",
  screen_risks_subtitle:
    "Review risks from saved document analyses, verify their source evidence, and record a response.",

  risk_summary_label: "Risk summary",
  risk_summary_total: "Risks",
  risk_summary_critical: "Critical",
  risk_summary_high: "High",
  risk_summary_needs_review: "Need source review",
  risk_filter_all: "All",
  risk_severity_filter: "Filter risks by severity",
  risk_document_filter: "Document",
  risk_all_documents: "All analyzed documents",
  risk_register_title: "Findings from document analyses",
  risk_results_count: "Showing {{shown}} of {{total}} risks",
  risk_export_csv: "Export CSV",
  risk_severity_critical: "Critical",
  risk_severity_high: "High",
  risk_severity_medium: "Medium",
  risk_severity_low: "Low",
  risk_kind_detected: "Detected finding",
  risk_kind_suggestion: "AI suggestion",
  risk_source_excerpt: "Source excerpt",
  risk_evidence_missing: "No source excerpt was provided for this finding.",
  risk_page_reference: "Page {{page}}",
  risk_source_unavailable: "Source location unavailable; verify in the document.",
  risk_action_plan_label: "Mitigation / response plan",
  risk_action_plan_hint: "Record a human-defined response for this risk.",
  risk_action_plan_save: "Save response",
  risk_local_note: "Stored only in this browser workspace.",
  risk_empty_title: "No risks were reported",
  risk_empty_detail:
    "The analyzed documents returned no risk findings. This does not guarantee that the documents contain no risks.",
  risk_no_analyses_title: "Analyze a document to review risks",
  risk_no_analyses_detail:
    "This register uses risks from saved analyses. Add and analyze a tender to populate it.",
  risk_no_matches_title: "No matching risks",
  risk_no_matches_detail: "Adjust the severity filter, document, or workspace search.",
  risk_review_disclaimer:
    "AI findings are reviewable suggestions, not legal advice. Verify each source and define mitigation with your team.",
  risk_csv_document: "Document",
  risk_csv_severity: "Severity",
  risk_csv_type: "Finding type",
  risk_csv_title: "Risk",
  risk_csv_explanation: "Explanation",
  risk_csv_action_plan: "Human response plan",
  risk_csv_evidence: "Source excerpt",
  risk_csv_source: "Source location",
  risk_csv_demo: "Illustrative sample",

  // â”€â”€ Processing mode labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  mode_on_device: "On-device",
  mode_cloud: "Cloud",
  mode_cloud_fallback: "Cloud fallback",
  mode_hybrid: "Hybrid",
  mode_demo: "Demo mode",
  mode_not_analyzed: "Not analyzed",

  // â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  sidebar_workspace: "Workspace",
  sidebar_privacy_title: "Privacy by choice",
  sidebar_privacy_note: "Cloud use is always explicit.",
  sidebar_user_workspace: "Procurement workspace",
  sidebar_user_session: "Local browser workspace",

  // â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  search_placeholder: "Search documents, requirements, risks...",
  search_aria: "Search current workspace",
  search_clear: "Clear search",
  firebase_not_configured: "Firebase setup required",
  firebase_connected: "Firebase AI Logic: Connected",
  firebase_configured: "Firebase configured Â· not yet verified",

  // â”€â”€ Global button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  btn_add_document: "Add a document",

  // â”€â”€ Demo banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  demo_banner_title: "Illustrative sample",

  // â”€â”€ Overview â€” metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  metric_docs_label: "Documents in workspace",
  metric_docs_detail: "Files in this browser session",
  metric_reqs_label_sample: "Sample requirements",
  metric_reqs_label_real: "Requirements extracted",
  metric_reqs_detail_demo: "Illustrative prepared findings",
  metric_reqs_detail_ai: "AI findings from fictional text",
  metric_reqs_detail_verified: "with source-verified excerpts",
  metric_risks_label: "Critical risks",
  metric_risks_detail: "Flagged for human review",
  metric_pending_label: "Pending reviews",
  metric_pending_detail: "Requirements awaiting a decision",
  metric_workspace_empty: "No uploaded tenders yet",

  // â”€â”€ Overview â€” documents table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  table_col_document: "Document",
  table_col_pages_sources: "Pages / sections",
  table_col_processing: "Processing",
  table_col_status: "Status",
  library_privacy_title: "Stored only in this browser",
  library_privacy_detail:
    "Files and extracted text are kept in IndexedDB on this device, not encrypted or synced. Browser data clearing may remove them.",
  library_documents_title: "Tender documents",
  library_documents_detail: "{{count}} uploaded tender documents",
  library_documents_table: "Local tender document library",
  library_col_format: "Format",
  library_col_sources: "Source sections",
  library_col_action: "Action",
  library_source_count: "{{count}} source sections",
  library_not_extracted: "Not extracted",
  library_open_document: "Open",
  library_empty_title: "No tender documents saved here",
  library_empty_detail: "Add a PDF, DOCX, or XLSX file to start a local workspace.",
  library_evidence_title: "Bidder evidence files",
  library_evidence_detail: "{{count}} evidence files linked to tenders",
  library_evidence_empty: "No separate bidder evidence files have been added.",
  library_delete_title: "Remove local workspace data",
  library_delete_detail:
    "This deletes uploaded tender files, evidence files, extracted text, analyses, comparison results, notes, and activity from this browser. The fictional sample is kept.",
  library_delete_action: "Clear local files and analyses",
  library_delete_confirm: "Delete all uploaded files and saved review data from this browser?",
  library_delete_confirm_action: "Delete local data",
  library_delete_cancel: "Keep data",
  activity_title: "Recent activity",
  activity_detail: "Actions recorded in this local browser workspace.",
  activity_empty: "Uploaded document activity will appear here.",
  activity_document_added: "Added {{name}}",
  activity_analysis_completed: "Analyzed {{name}}",
  activity_evidence_added: "Added evidence file {{name}}",
  activity_evidence_linked: "Linked evidence to a requirement in {{name}}",
  activity_evidence_compared: "Compared evidence in {{name}}",
  activity_review_updated: "Updated a requirement review in {{name}}",
  activity_unknown_document: "a document",
  status_prepared_sample: "Prepared sample",
  status_ai_analysed: "AI-analysed sample",
  status_analyzed: "Analyzed",
  status_not_analyzed: "Not analyzed",
  docs_empty_title: "No matching documents",
  docs_empty_detail: "Try a different search term.",
  docs_showing: "Showing {{shown}} of {{total}} documents",
  docs_open_analysis: "Open current analysis",

  // â”€â”€ Overview â€” upload tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  upload_tile_title: "Upload a tender",
  upload_tile_detail:
    "Extract PDF, DOCX, and XLSX text locally; scanned PDFs may use optional external OCR.",
  upload_tile_cta: "Choose processing mode",
  upload_tile_note: "PDF, DOCX, or XLSX Â· maximum 50 MB Â· optional external OCR for scanned PDFs",

  // â”€â”€ Overview â€” review queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  review_queue_title: "Review queue",
  review_queue_subtitle: "Findings that need human attention.",
  review_source_verified: "Source verified Â· page {{page}}",
  review_source_verified_location: "Source verified Â· {{location}}",
  review_evidence_needs: "Evidence needs verification",
  review_all_done: "All requirements are reviewed.",
  review_empty: "Analyze a document to create a review queue.",

  // â”€â”€ Analysis â€” filter chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  filter_all: "All findings",
  filter_requirements: "Requirements",
  filter_deadlines: "Deadlines",
  filter_specifications: "Specifications",
  filter_risks: "Risks",
  filter_missing: "Missing & inconsistencies",

  // â”€â”€ Analysis â€” source panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  source_panel_title: "Extracted source text",
  source_panel_title_full: "Source document",
  source_llamaparse_paginated: "Text extracted by LlamaParse.",
  source_llamaparse_unpaginated: "LlamaParse text; original page boundaries are unavailable.",
  source_pdfjs: "Text extracted locally in this browser.",
  source_pdfjs_full: "Page text extracted in this browser.",
  source_office_document: "Text extracted locally from this Office document.",
  source_llamaparse_full: "Page text extracted by LlamaParse.",
  source_prev_page: "Previous page",
  source_next_page: "Next page",
  source_page_of: "Page {{page}} of {{total}}",
  source_no_page_numbers: "Page numbers unavailable",
  source_pagination_unavailable: "Pagination unavailable",
  source_no_text: "No text is available for this page.",
  source_disclaimer: "Extracted text may need manual verification against the original PDF.",
  source_page_rendering_region: "Rendered source page",
  source_rendered_page: "Rendered page {{page}} of the original PDF",
  source_rendering: "Rendering the original PDF pageâ€¦",
  source_render_error:
    "The original page could not be rendered. Extracted text remains available. {{detail}}",

  // â”€â”€ Analysis â€” pre-analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  pre_analysis_title: "Ask about this document",
  pre_analysis_subtitle:
    "Review the text extracted in your browser and ask a question before running a full analysis.",
  pre_analysis_cta: "Run full analysis",

  // â”€â”€ Analysis â€” document toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  toolbar_fictional_sample: "Fictional sample",
  toolbar_pdf_document: "PDF document",
  toolbar_docx_document: "DOCX document",
  toolbar_xlsx_document: "XLSX document",
  toolbar_pages: "pages",
  toolbar_source_sections: "source sections",
  toolbar_pagination_unverified: "Pagination unverified",
  toolbar_llamaparse_badge: "Text: external OCR (LlamaParse)",
  toolbar_export_json: "Export JSON",

  // â”€â”€ Analysis â€” warnings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  warning_demo_prepared:
    "This prepared analysis is simulated and illustrative; it was not generated from the sample text.",
  warning_demo_ai: "This AI analysis uses fictional sample text, not a real procurement document.",
  warning_llamaparse_no_pages:
    "LlamaParse did not provide page numbers. Citations cannot be page-verified; findings are flagged for human review.",

  // â”€â”€ Analysis â€” inference report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  inference_title: "Analysis run",
  inference_processing_source: "Processing source:",
  inference_firebase_label: "Firebase AI Logic",
  inference_firebase_not_used: "Not used",
  inference_firebase_connected: "Connected Â· response received",
  inference_model_label: "Model",
  inference_evidence_label: "Evidence mode",
  inference_evidence_value: "Page-linked excerpts Â· checked against extracted text",
  inference_demo_label: "Demo data",
  inference_yes: "Yes",
  inference_no: "No",

  // â”€â”€ Analysis â€” summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  summary_title: "Document summary",

  // â”€â”€ Analysis â€” finding cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  finding_date_not_specified: "Date not specified",
  finding_no_source_page: "No source page",
  finding_source_location: "Source: {{location}}",
  finding_source_verified: "Source verified",
  finding_verify_source: "Verify source",
  finding_confidence: "{{pct}}% confidence",

  // â”€â”€ Analysis â€” findings panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  findings_title: "Findings",
  findings_count: "{{shown}} shown Â· {{total}} total",
  findings_illustrative: "Illustrative",
  findings_ai_generated: "AI-generated Â· review required",
  findings_empty_search: "No findings match your search",
  findings_empty_category: "No findings in this category",
  findings_empty_hint: "Change the filter or search a different term.",
  findings_disclaimer:
    "AI findings are suggestions. Verify every cited passage before relying on it.",

  // â”€â”€ Analysis â€” empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  empty_analysis_title: "No analysis for this document yet",
  empty_analysis_detail:
    "Choose an on-device, cloud, or hybrid mode to extract findings from a PDF, DOCX, or XLSX file.",
  empty_analysis_cta: "Open processing options",

  // â”€â”€ Compliance â€” toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  compliance_search_hint: "Search from the workspace bar...",
  compliance_all_categories: "All categories",
  compliance_all_statuses: "All statuses",
  compliance_status_pending: "Pending",
  compliance_status_reviewed: "Reviewed",
  compliance_status_satisfied: "Satisfied",
  compliance_status_unclear: "Unclear",
  compliance_export_csv: "Export CSV",

  // â”€â”€ Compliance â€” matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  compliance_col_requirement: "Requirement",
  compliance_col_category: "Category",
  compliance_col_mandatory: "Mandatory",
  compliance_col_evidence: "Evidence",
  compliance_col_page: "Page",
  compliance_col_review_status: "Review status",
  compliance_verified: "Verified",
  compliance_check_excerpt: "Check excerpt",
  compliance_not_provided: "Not provided",
  compliance_mandatory_yes: "Yes",
  compliance_mandatory_no: "No",
  compliance_summary_reqs: "{{count}} requirements",
  compliance_summary_verified: "with verified evidence",
  compliance_summary_shown: "shown",
  compliance_footer_session: "Review status and notes are stored locally in this browser.",
  compliance_empty_title: "No requirements match these filters",
  compliance_empty_detail: "Adjust the filters or search terms.",
  compliance_demo_warning: "Sample requirements and review results are fictional and illustrative.",

  // â”€â”€ Compliance â€” evidence panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  evidence_panel_title: "Source evidence",
  evidence_panel_subtitle: "Selected requirement",
  evidence_no_excerpt: "No source excerpt was returned. Verify this requirement manually.",
  evidence_notes_label: "Review notes",
  evidence_notes_placeholder: "Add a note for your review...",
  evidence_select_hint: "Select a requirement to inspect its evidence.",
  evidence_compare_title: "Bidder evidence comparison",
  evidence_compare_detail:
    "Link separate bidder files to this requirement, then compare their extracted text.",
  evidence_compare_demo:
    "The sample requirements are fictional. Add a real tender before linking bidder evidence.",
  evidence_compare_select_requirement: "Select a requirement to link bidder evidence.",
  evidence_compare_requirement: "Tender requirement",
  evidence_compare_no_requirements:
    "Run an analysis that finds requirements before comparing evidence.",
  evidence_compare_select_file: "Evidence document",
  evidence_compare_choose_file: "Choose an evidence file",
  evidence_compare_file_input: "Choose a bidder evidence document",
  evidence_compare_add_file: "Add evidence file",
  evidence_compare_adding_file: "Extracting and saving locally...",
  evidence_compare_link: "Link to requirement",
  evidence_compare_unlink: "Unlink",
  evidence_compare_unlink_named: "Unlink {{name}} from this requirement",
  evidence_compare_linked: "Linked to this requirement",
  evidence_compare_linked_files: "Evidence files linked to this requirement",
  evidence_compare_cloud_consent: "Allow cloud processing for this evidence file",
  evidence_compare_cloud_consent_detail:
    "The extracted text from {{name}} may be sent to Gemini through Firebase AI Logic during this comparison. This consent is separate from tender analysis and resets on reload.",
  evidence_compare_running: "Comparingâ€¦",
  evidence_compare_action: "Compare evidence",
  evidence_compare_ai_estimate: "AI estimate Â· {{confidence}}% confidence",
  evidence_compare_unknown_file: "Evidence file",
  evidence_compare_quote_verified: "Excerpt verified in extracted text",
  evidence_compare_quote_unverified: "Excerpt not verified Â· human review required",
  evidence_assessment_supports: "May support the requirement",
  evidence_assessment_contradicts: "May conflict with the requirement",
  evidence_assessment_insufficient: "Evidence is insufficient",

  // â”€â”€ Processing â€” topline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  processing_topline: "Processing options",
  processing_steps: "01 / 03",

  // â”€â”€ Processing â€” mode cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  mode_card_local_title: "On-device only",
  mode_card_local_badge: "PRIVATE",
  mode_card_local_heading: "Keep inference on this device",
  mode_card_local_desc:
    "PDF, DOCX, and XLSX text is extracted in your browser. Firebase AI Logic asks Chrome's on-device model to analyze it. First use may download the model, with progress shown when available. If the model is unavailable, the request fails instead of moving to cloud.",
  mode_card_local_p1: "No cloud fallback",
  mode_card_local_p2: "Requires supported desktop Chrome",
  mode_card_local_p3: "Firebase App Check still applies",

  mode_card_cloud_title: "Cloud AI",
  mode_card_cloud_badge: "GEMINI",
  mode_card_cloud_heading: "Analyze with Gemini 3.5 Flash-Lite",
  mode_card_cloud_desc:
    "Send extracted document text to Google's cloud through Firebase AI Logic. This mode uses cloud inference only and does not fall back to on-device processing.",
  mode_card_cloud_p1: "Direct cloud inference",
  mode_card_cloud_p2: "Requires your explicit consent",
  mode_card_cloud_p3: "Firebase App Check required",

  mode_card_hybrid_title: "Hybrid inference",
  mode_card_hybrid_badge: "ON-DEVICE FIRST",
  mode_card_hybrid_heading: "Prefer on-device, allow fallback",
  mode_card_hybrid_desc:
    "Firebase AI Logic tries the available on-device model first. If unavailable, the SDK may send extracted document text to Gemini 3.5 Flash-Lite and other fallback models in Google's cloud.",
  mode_card_hybrid_p1: "Actual source shown after analysis",
  mode_card_hybrid_p2: "Cloud use requires your consent",
  mode_card_hybrid_p3: "App Check required",

  mode_card_demo_title: "Sample data",
  mode_card_demo_badge: "DEMO",
  mode_card_demo_heading: "Explore prepared findings",
  mode_card_demo_desc:
    "View the fictional Northbridge street-lighting tender and its prepared analysis. No upload or model call occurs in this mode.",
  mode_card_demo_p1: "No Firebase setup needed",
  mode_card_demo_p2: "No real document processed",
  mode_card_demo_p3: "Sample clearly labeled",

  // â”€â”€ Processing â€” cloud consent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  consent_cloud_title: "I explicitly allow cloud AI processing for this session.",
  consent_cloud_detail:
    "Extracted text from this tender will be sent to Gemini through Firebase AI Logic. Bidder evidence needs its own separate consent. This setting resets when the page is reloaded.",
  consent_hybrid_title: "I explicitly allow cloud fallback for this session.",
  consent_hybrid_detail:
    "If the on-device model is unavailable, extracted text from this tender may be sent to Google's Gemini service through Firebase AI Logic. Bidder evidence needs its own separate consent. This setting resets when the page is reloaded.",

  // â”€â”€ Processing â€” file drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  file_input_aria: "Choose a PDF, DOCX, or XLSX document",
  file_replace: "Replace",
  file_stored: "stored in this browser",
  drop_title: "Drop a tender PDF, DOCX, or XLSX here",
  drop_or: "or select a file from your device",
  drop_choose: "Choose document",
  drop_note: "PDF, DOCX, or XLSX Â· maximum 50 MB Â· scanned PDFs may use optional external OCR",

  // â”€â”€ Processing â€” external OCR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ocr_scanned_title: "This looks like a scanned PDF.",
  ocr_scanned_desc:
    "You can send this file to LlamaParse for external text extraction. Firebase AI Logic will analyze the extracted text afterward.",
  ocr_analyze_extracted: "Analyze the text available in this browser",
  ocr_checking: "Checking whether external OCR is enabled...",
  ocr_disabled_title: "External OCR is not enabled.",
  ocr_disabled_desc: "Link the LlamaParse Platform connector to this project in Lovable.",
  ocr_check_again: "Check again",
  ocr_error: "Could not check connector availability.",
  ocr_retry: "Retry check",
  ocr_consent_title: "I consent to sending this PDF to LlamaParse for external OCR.",
  ocr_consent_detail:
    "This consent is separate from Firebase cloud consent. The PDF is sent to LlamaParse even when on-device inference is selected.",
  ocr_extract_btn: "Extract with LlamaParse",
  ocr_extracting: "Extracting and analyzing...",

  // â”€â”€ Processing â€” error / progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  error_dismiss: "Dismiss error",
  firebase_app_check_token_error:
    "Firebase rejected its security token, so live analysis could not be completed. Reload and try again, or use Sample mode. If it persists, ask the deployment administrator to verify the reCAPTCHA Enterprise site key, allowed domain, and Firebase App Check registration; changes to VITE_* settings require a new build and deployment.",
  on_device_init_timeout_error:
    "Chrome did not finish preparing its on-device model within 60 seconds without progress. Use supported desktop Chrome and keep this page open while the model downloads. This attempt did not send extracted text to Firebase's cloud service.",
  on_device_generation_timeout_error:
    "The on-device model did not return a result within 120 seconds. This attempt did not send extracted text to Firebase's cloud service. Try a shorter document, or choose Cloud AI and explicitly allow cloud processing.",
  on_device_timeout_choose_cloud: "Choose Cloud AI",
  progress_default: "Preparing analysis...",

  // â”€â”€ Processing â€” Firebase setup notice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  firebase_setup_title: "Firebase setup is needed for live analysis.",
  firebase_setup_desc:
    "Configure a Firebase web app, enable Firebase AI Logic, and set App Check before running a live model call. Follow the setup steps in README.md.",

  // â”€â”€ Processing â€” runtime status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  runtime_firebase_label: "Firebase AI Logic",
  runtime_not_configured: "Not configured",
  runtime_connected: "Connected Â· a response was received",
  runtime_configured_no_response: "Configured Â· no live response yet",
  runtime_processing_source: "Processing source",
  runtime_demo_mode: "Demo mode Â· AI not used",
  runtime_not_run: "Not run",
  runtime_demo_data: "Demo data",

  // â”€â”€ Processing â€” footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  footer_selected_mode: "Selected mode",
  footer_source_reporting: "Source reporting",
  footer_source_reporting_value: "Actual inference source appears with the results",
  footer_mode_demo: "Sample data",
  footer_mode_local: "On-device only",
  footer_mode_cloud: "Cloud AI Â· consent required",
  footer_mode_hybrid: "Hybrid Â· consent required",
  footer_status_demo: "No real document is processed.",
  footer_status_local: "No cloud fallback will be used.",
  footer_status_cloud_ok: "Cloud processing consent is enabled for this session.",
  footer_status_cloud_pending: "Enable cloud consent above to continue.",
  footer_status_hybrid_ok: "Cloud fallback consent is enabled for this session.",
  footer_status_hybrid_pending: "Enable cloud consent above to continue.",

  // â”€â”€ Processing â€” footer actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  btn_explore_sample: "Explore sample analysis",
  btn_ask_pdf: "Ask about this document",
  btn_extract_text: "Extract text only",
  btn_analyze_sample: "Analyze fictional sample",
  btn_analyze_pdf: "Analyze PDF",
  btn_processing: "Processing...",

  // â”€â”€ Processing â€” process flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  flow_title: "From document to reviewable findings",
  flow_subtitle: "Every finding links back to a source excerpt so a person can verify it.",
  flow_step1_title: "Choose document",
  flow_step1_detail: "File stays in browser",
  flow_step2_title: "Process text",
  flow_step2_detail: "Selected mode applies",
  flow_step3_title: "Verify findings",
  flow_step3_detail: "Source excerpts checked",
  flow_step4_title: "Human review",
  flow_step4_detail: "Decisions stay yours",
  flow_current_sample: "Current workspace document:",

  // â”€â”€ Hardcoded strings (previously missed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  overview_recent_title: "Recent tender documents",
  overview_recent_subtitle: "Files saved in this browser workspace.",
  overview_add_document: "Add document",
  sidebar_whats_new: "What's new",
  sidebar_take_tour: "Take a tour",
  compliance_demo_inline: "Sample requirements and review results are fictional and illustrative.",
  compliance_category_filter_sr: "Category filter",
  compliance_status_filter_sr: "Review status filter",
  compliance_count_of: "of",
  finding_page: "Page {{page}}",
  finding_mandatory: "Mandatory",
  finding_optional: "Optional",
  finding_missing_desc: "Referenced or expected information was not found in the analyzed text.",
  finding_inconsistency_title: "Potential inconsistency",
  evidence_page_badge: "Page {{page}}",
  review_status_sr: "Review status for {{description}}",
  workspace_no_document:
    "The workspace has no selected document. Refresh the page to restore the sample workspace.",
  runtime_demo_data_label: "Demo data",
  open_processing_aria: "Open processing options",
  ocr_analyze_browser: "Analyze the text available in this browser",

  // â”€â”€ DocumentQaPanel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  qa_title: "Ask this document",
  qa_subtitle: "Ask follow-up questions and review every answer against its sources.",
  qa_document_grounded: "Document-grounded",
  qa_privacy_note:
    "Questions use the selected AI mode. Cloud and hybrid fallback require your existing Firebase consent. The PDF is never sent to Firecrawl.",
  qa_review_consent: "Review cloud consent",
  qa_mode_note:
    "Choose on-device, cloud, or hybrid processing before asking. The prepared sample is illustrative and is not a real tender.",
  qa_choose_mode: "Choose a mode",
  qa_error_no_text: "No extracted document text is available to answer this question.",
  qa_error_mode: "Choose an AI processing mode before asking.",
  qa_error_cloud_consent: "Enable cloud consent in Processing & privacy, or choose on-device only.",
  qa_error_research:
    "External research is unavailable or incomplete. Turn it off, or provide consent and valid jurisdiction details.",
  qa_answer_region: "Answer",
  qa_empty_title: "Your answer will appear here",
  qa_empty_detail:
    "Send a question to see a text response. After an answer arrives, use its speaker button to hear it when your browser supports speech.",
  qa_voice_output_unavailable:
    "Voice playback is not supported by this browser. Answers will still appear as text.",
  qa_role_user: "You",
  qa_role_assistant: "PocketMind",
  qa_hypotheses: "Working hypotheses",
  qa_unresolved: "Still to verify",
  qa_citations_title: "Document evidence",
  qa_page_unavailable: "Source location unavailable",
  qa_citation_verified: "Verified in extracted text",
  qa_citation_unverified: "Verify against the PDF",
  qa_research_title: "Search results Â· verify authority and current status",
  qa_research_cited: "Cited in answer",
  qa_research_not_cited: "Not cited in answer",
  qa_research_no_date: "Publication date not provided",
  qa_research_no_sources: "Firecrawl returned no sources; this answer uses the document only.",
  qa_sending_research: "Searching sources and preparing an evidence-based answerâ€¦",
  qa_sending_document: "Checking the document and preparing an answerâ€¦",
  qa_research_checking: "Checking availabilityâ€¦",
  qa_research_available: "Optional Â· requires separate consent",
  qa_research_unavailable: "Not configured on the server",
  qa_research_error_status: "Availability could not be checked",
  qa_research_error_msg:
    "External research availability could not be checked. Try reloading or ask from the document only.",
  qa_jurisdiction_label: "Research jurisdiction",
  qa_jurisdiction_placeholder: "e.g. Brazil â€” State of Amazonas; Law 1,762/1986",
  qa_country_label: "Country code",
  qa_country_placeholder: "BR",
  qa_research_privacy1:
    "Only your question, country code, and jurisdiction are sent to Firecrawl; the PDF is not.",
  qa_research_privacy2:
    "External research accepts questions up to 300 characters and jurisdictions up to 150.",
  qa_research_consent:
    "I consent to sending this question, country code, and jurisdiction to Firecrawl for external research.",
  qa_composer_aria: "Ask a question about this document",
  qa_composer_placeholder: "Ask a question about this documentâ€¦",
  qa_voice_title: "Use voice to draft a question",
  qa_voice_unsupported: "Voice input is not supported by this browser",
  qa_voice_stop: "Stop listening",
  qa_voice_use: "Use microphone",
  qa_speak_stop: "Stop reading answer",
  qa_speak_read: "Read answer aloud",
  qa_voice_note:
    "Your browser may use its own speech service. Nothing is sent to AI until you submit.",
  qa_voice_unavailable: "Voice input is unavailable in this browser; you can type.",
  qa_send: "Send question",
  qa_research_toggle: "Include external research (Firecrawl)",
  qa_pagination_note:
    "This document has no verified page mapping. Answers may quote extracted text, but page citations are withheld.",

  // â”€â”€ Suggested questions dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  qa_suggestions_btn: "Suggested questions",
  qa_suggestions_q1: "What are the mandatory eligibility requirements to submit a bid?",
  qa_suggestions_q2: "What are the key submission deadlines and what happens if they are missed?",
  qa_suggestions_q3: "What technical specifications must the supplied items meet?",
  qa_suggestions_q4: "What financial guarantees or insurance are required?",
  qa_suggestions_q5: "What information or annexes appear to be missing from this document?",
  qa_suggestions_q6: "What are the highest-severity risks identified in this tender?",

  // â”€â”€ GuidedTour â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  tour_badge_welcome: "Welcome",
  tour_badge_step: "Step {{step}} of {{total}}",
  tour_close: "Close tour",
  tour_skip: "Skip tour",
  tour_back_to_app: "Back to app",
  tour_prev: "Previous step",
  tour_start: "Start tour",
  tour_done: "Done",
  tour_next: "Next",

  tour_step0_title: "Welcome to PocketMind AI",
  tour_step0_body:
    "Turn complex tender PDFs into reviewable findings â€” with a link to the source page for each one. This short tour walks the full flow in about 90 seconds, using the preloaded sample tender. No setup needed.",
  tour_step1_title: "Six areas, one workspace",
  tour_step1_body:
    "Move between Dashboard, Library, Document analysis, Compliance matrix, Risks, and Processing & privacy from this sidebar.",
  tour_library_title: "Your local document library",
  tour_library_body:
    "Uploaded tenders, extracted text, bidder evidence, and review work stay in this browser. The library shows what's saved and lets you delete local workspace data.",
  tour_step2_title: "Your workspace at a glance",
  tour_step2_body:
    "Documents in the session, requirements extracted, critical risks flagged for review, and pending reviews.",
  tour_step3_title: "The sample tender is ready",
  tour_step3_body:
    "NB-2026-114 Smart LED Street Lighting is preloaded and labeled illustrative â€” no Firebase setup needed to explore it.",
  tour_step4_title: "Choose how it's processed",
  tour_step4_body:
    "On-device, Cloud, Hybrid, or Sample data. Cloud and hybrid need your explicit consent. The tour uses Sample data â€” no upload, no model call.",
  tour_step5_title: "Findings, beside their source",
  tour_step5_body:
    "Requirements, deadlines, specifications, risks, and missing information â€” each quotes its excerpt. Click the Page link to jump to the source. Green means verified against the text.",
  tour_step6_title: "Verify against the original",
  tour_step6_body:
    "The source page sits beside the findings so you can confirm every excerpt yourself. AI findings are suggestions â€” verify before you rely on them.",
  tour_step7_title: "Track every requirement",
  tour_step7_body:
    "Filter by category, inspect the evidence, set a review status (Pending â†’ Reviewed â†’ Satisfied, or Unclear), add notes, and export to CSV.",
  tour_step8_title: "Privacy by choice. Decisions stay yours.",
  tour_step8_body:
    "PDF text is extracted in your browser; cloud use is always your explicit choice. When you're ready, choose Sample data and Explore sample analysis to try the full flow yourself.",

  // â”€â”€ CSV export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  csv_col_requirement: "Requirement",
  csv_col_category: "Category",
  csv_col_mandatory: "Mandatory",
  csv_col_evidence: "Evidence",
  csv_col_page: "Page",
  csv_col_evidence_verified: "Evidence verified",
  csv_col_review_status: "Review status",
  csv_col_notes: "Notes",
  csv_mandatory: "Mandatory",
  csv_optional: "Optional",
  csv_evidence_na: "Evidence not available",
  csv_yes: "Yes",
  csv_no: "No",

  // â”€â”€ Aligned Visual Design Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  sidebar_nav_risks: "Risks",
  sidebar_nav_projects: "Projects",
  sidebar_nav_team: "Team",
  sidebar_nav_integrations: "Integrations",
  sidebar_nav_settings: "Settings",
  nav_coming_soon: "Coming soon",
  sidebar_upgrade_title: "Upgrade to Pro",
  sidebar_upgrade_desc: "Unlock advanced analysis and team collaboration.",
  sidebar_view_plans: "View plans",
  sidebar_workspace_name: "Sample Studio",
  overview_good_to_see: "Good to see you again.",
  overview_last_30_days: "vs. last 30 days",
  overview_view_all: "View all",
  overview_table_col_project: "Project",
  overview_table_col_analysed_on: "Analysed on",
  upload_supports: "Supports PDF, DOCX, XLSX (max 50 MB)",
  processing_setup_badge: "DOCUMENT ANALYSIS SETUP",
  processing_setup_title: "Choose how your document is processed",
  processing_setup_desc:
    "PocketMind AI gives you flexible processing options. You control your data, every step of the way.",
  processing_confirm_btn: "Confirm and continue â†’",
  processing_confirm_sub: "You can change this later in Settings.",
  processing_flow_title: "From document to verified insights",
  processing_flow_desc: "A simple, transparent flow from your document to structured results.",
  compliance_drawer_title: "Source Evidence",
  compliance_drawer_extracted_ai: "Extracted text (AI)",
  compliance_drawer_relevance: "Relevance",
  compliance_filter_all_mandatory: "All Mandatory",
  compliance_filter_mandatory_only: "Mandatory Only",
  compliance_filter_optional_only: "Optional Only",
  proc_card_local_title: "Local processing",
  proc_card_local_badge: "RECOMMENDED",
  proc_card_local_heading: "Supported operations stay on your device.",
  proc_card_local_desc:
    "Your document is processed locally in your browser or device. No content leaves your device for supported operations.",
  proc_card_local_p1: "Private by default",
  proc_card_local_p2: "Works offline",
  proc_card_local_p3: "Ideal for sensitive documents",
  proc_card_cloud_title: "Cloud AI processing",
  proc_card_cloud_badge: "POWERFUL",
  proc_card_cloud_consent: "I explicitly consent to send my document to a cloud service",
  proc_card_cloud_warning:
    "Your document content may be sent to a cloud service for AI processing. Only enable this if you are comfortable sharing your data.",
  proc_card_cloud_p1: "Access to advanced AI models",
  proc_card_cloud_p2: "Higher accuracy for complex documents",
  proc_card_cloud_p3: "Requires explicit consent",
  proc_card_demo_title: "Demo mode",
  proc_card_demo_badge: "TRY IT",
  proc_card_demo_heading: "Explore with sample data.",
  proc_card_demo_desc:
    "Use simulated documents to experience PocketMind AI. No real data is processed in this mode.",
  proc_card_demo_p1: "No personal data required",
  proc_card_demo_p2: "Great for evaluation",
  proc_card_demo_p3: "See example insights",
  proc_confirm_mode_label: "Processing mode",
  proc_confirm_privacy_label: "Privacy status",
  proc_confirm_privacy_on_device: "On device only",
  proc_confirm_privacy_stays: "Your data stays on this device.",
  proc_confirm_privacy_cloud: "Cloud processing",
  proc_confirm_privacy_cloud_desc: "External model inference.",
  proc_confirm_privacy_simulated: "Simulated data",
  proc_confirm_privacy_simulated_desc: "Sample documents only.",
  proc_flow_step1_title: "1. Add document",
  proc_flow_step1_desc: "Upload or select a file",
  proc_flow_step2_title: "2. Process",
  proc_flow_step2_desc: "Using your chosen mode",
  proc_flow_step3_title: "3. Extract & structure",
  proc_flow_step3_desc: "Information organized with confidence scores",
  proc_flow_step4_title: "4. Verified insights",
  proc_flow_step4_desc: "Review structured results",
  proc_sample_output_title: "Sample output",
  proc_sample_invoice: "Invoice number",
  proc_sample_date: "Date",
  proc_sample_amount: "Total amount",
  proc_sample_vendor: "Vendor",
  proc_sample_verified: "Verified",
  proc_sample_uncertain: "Uncertain",
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = { [Key in TranslationKey]: string };
