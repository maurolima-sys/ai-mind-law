export const en = {
  // ── Navigation ───────────────────────────────────────────────────────────────
  nav_dashboard: "Dashboard",
  nav_analysis: "Document analysis",
  nav_compliance: "Compliance matrix",
  nav_processing: "Processing & privacy",

  // ── Screen titles / subtitles ────────────────────────────────────────────────
  screen_overview_title: "Your document intelligence workspace",
  screen_overview_subtitle:
    "Turn complex tenders into reviewable findings, with source evidence attached.",
  screen_analysis_title: "Document analysis",
  screen_analysis_subtitle: "Review extracted findings beside their source pages.",
  screen_compliance_title: "Compliance matrix",
  screen_compliance_subtitle:
    "Track each requirement against evidence and your team's review status.",
  screen_processing_title: "Choose how your document is processed",
  screen_processing_subtitle:
    "Text is extracted in this browser. You control whether AI may process it in the cloud.",

  // ── Processing mode labels ───────────────────────────────────────────────────
  mode_on_device: "On-device",
  mode_cloud: "Cloud",
  mode_cloud_fallback: "Cloud fallback",
  mode_hybrid: "Hybrid",
  mode_demo: "Demo mode",
  mode_not_analyzed: "Not analyzed",

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebar_workspace: "Workspace",
  sidebar_privacy_title: "Privacy by choice",
  sidebar_privacy_note: "Cloud use is always explicit.",
  sidebar_user_workspace: "Procurement workspace",
  sidebar_user_session: "Local browser session",

  // ── Topbar ───────────────────────────────────────────────────────────────────
  search_placeholder: "Search documents, requirements, risks...",
  search_aria: "Search current workspace",
  search_clear: "Clear search",
  firebase_not_configured: "Firebase setup required",
  firebase_connected: "Firebase AI Logic: Connected",
  firebase_configured: "Firebase configured · not yet verified",

  // ── Global button ────────────────────────────────────────────────────────────
  btn_add_document: "Add a document",

  // ── Demo banner ──────────────────────────────────────────────────────────────
  demo_banner_title: "Illustrative sample",

  // ── Overview — metrics ───────────────────────────────────────────────────────
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

  // ── Overview — documents table ───────────────────────────────────────────────
  table_col_document: "Document",
  table_col_pages: "Pages",
  table_col_processing: "Processing",
  table_col_status: "Status",
  status_prepared_sample: "Prepared sample",
  status_ai_analysed: "AI-analysed sample",
  status_analyzed: "Analyzed",
  status_not_analyzed: "Not analyzed",
  docs_empty_title: "No matching documents",
  docs_empty_detail: "Try a different search term.",
  docs_showing: "Showing {{shown}} of {{total}} documents",
  docs_open_analysis: "Open current analysis",

  // ── Overview — upload tile ───────────────────────────────────────────────────
  upload_tile_title: "Upload a tender",
  upload_tile_detail: "Extract text locally, with optional external OCR for scanned PDFs.",
  upload_tile_cta: "Choose processing mode",
  upload_tile_note: "PDF only · maximum 20 MB · optional external OCR for scanned PDFs",

  // ── Overview — review queue ──────────────────────────────────────────────────
  review_queue_title: "Review queue",
  review_queue_subtitle: "Findings that need human attention.",
  review_source_verified: "Source verified · page {{page}}",
  review_evidence_needs: "Evidence needs verification",
  review_all_done: "All requirements are reviewed.",
  review_empty: "Analyze a document to create a review queue.",

  // ── Analysis — filter chips ──────────────────────────────────────────────────
  filter_all: "All findings",
  filter_requirements: "Requirements",
  filter_deadlines: "Deadlines",
  filter_specifications: "Specifications",
  filter_risks: "Risks",
  filter_missing: "Missing & inconsistencies",

  // ── Analysis — source panel ──────────────────────────────────────────────────
  source_panel_title: "Extracted source text",
  source_panel_title_full: "Source document",
  source_llamaparse_paginated: "Text extracted by LlamaParse.",
  source_llamaparse_unpaginated: "LlamaParse text; original page boundaries are unavailable.",
  source_pdfjs: "Text extracted locally in this browser.",
  source_pdfjs_full: "Page text extracted in this browser.",
  source_llamaparse_full: "Page text extracted by LlamaParse.",
  source_prev_page: "Previous page",
  source_next_page: "Next page",
  source_page_of: "Page {{page}} of {{total}}",
  source_no_page_numbers: "Page numbers unavailable",
  source_pagination_unavailable: "Pagination unavailable",
  source_no_text: "No text is available for this page.",
  source_disclaimer:
    "Extracted text may need manual verification against the original PDF.",

  // ── Analysis — pre-analysis ──────────────────────────────────────────────────
  pre_analysis_title: "Ask about this document",
  pre_analysis_subtitle:
    "Review the text extracted in your browser and ask a question before running a full analysis.",
  pre_analysis_cta: "Run full analysis",

  // ── Analysis — document toolbar ──────────────────────────────────────────────
  toolbar_fictional_sample: "Fictional sample",
  toolbar_pdf_document: "PDF document",
  toolbar_pages: "pages",
  toolbar_pagination_unverified: "Pagination unverified",
  toolbar_llamaparse_badge: "Text: external OCR (LlamaParse)",
  toolbar_export_json: "Export JSON",

  // ── Analysis — warnings ──────────────────────────────────────────────────────
  warning_demo_prepared:
    "This prepared analysis is simulated and illustrative; it was not generated from the sample text.",
  warning_demo_ai:
    "This AI analysis uses fictional sample text, not a real procurement document.",
  warning_llamaparse_no_pages:
    "LlamaParse did not provide page numbers. Citations cannot be page-verified; findings are flagged for human review.",

  // ── Analysis — inference report ──────────────────────────────────────────────
  inference_title: "Analysis run",
  inference_processing_source: "Processing source:",
  inference_firebase_label: "Firebase AI Logic",
  inference_firebase_not_used: "Not used",
  inference_firebase_connected: "Connected · response received",
  inference_model_label: "Model",
  inference_evidence_label: "Evidence mode",
  inference_evidence_value: "Page-linked excerpts · checked against extracted text",
  inference_demo_label: "Demo data",
  inference_yes: "Yes",
  inference_no: "No",

  // ── Analysis — summary ───────────────────────────────────────────────────────
  summary_title: "Document summary",

  // ── Analysis — finding cards ─────────────────────────────────────────────────
  finding_date_not_specified: "Date not specified",
  finding_no_source_page: "No source page",
  finding_source_verified: "Source verified",
  finding_verify_source: "Verify source",
  finding_confidence: "{{pct}}% confidence",

  // ── Analysis — findings panel ─────────────────────────────────────────────────
  findings_title: "Findings",
  findings_count: "{{shown}} shown · {{total}} total",
  findings_illustrative: "Illustrative",
  findings_ai_generated: "AI-generated · review required",
  findings_empty_search: "No findings match your search",
  findings_empty_category: "No findings in this category",
  findings_empty_hint: "Change the filter or search a different term.",
  findings_disclaimer:
    "AI findings are suggestions. Verify every cited passage before relying on it.",

  // ── Analysis — empty state ────────────────────────────────────────────────────
  empty_analysis_title: "No analysis for this document yet",
  empty_analysis_detail:
    "Choose an on-device or hybrid processing mode to extract findings from a PDF.",
  empty_analysis_cta: "Open processing options",

  // ── Compliance — toolbar ──────────────────────────────────────────────────────
  compliance_search_hint: "Search from the workspace bar...",
  compliance_all_categories: "All categories",
  compliance_all_statuses: "All statuses",
  compliance_status_pending: "Pending",
  compliance_status_reviewed: "Reviewed",
  compliance_status_satisfied: "Satisfied",
  compliance_status_unclear: "Unclear",
  compliance_export_csv: "Export CSV",

  // ── Compliance — matrix ───────────────────────────────────────────────────────
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
  compliance_footer_session: "Review status is held in this browser session only.",
  compliance_empty_title: "No requirements match these filters",
  compliance_empty_detail: "Adjust the filters or search terms.",
  compliance_demo_warning:
    "Sample requirements and review results are fictional and illustrative.",

  // ── Compliance — evidence panel ───────────────────────────────────────────────
  evidence_panel_title: "Source evidence",
  evidence_panel_subtitle: "Selected requirement",
  evidence_no_excerpt: "No source excerpt was returned. Verify this requirement manually.",
  evidence_notes_label: "Review notes",
  evidence_notes_placeholder: "Add a note for your review...",
  evidence_select_hint: "Select a requirement to inspect its evidence.",

  // ── Processing — topline ──────────────────────────────────────────────────────
  processing_topline: "Processing options",
  processing_steps: "01 / 03",

  // ── Processing — mode cards ───────────────────────────────────────────────────
  mode_card_local_title: "On-device only",
  mode_card_local_badge: "PRIVATE",
  mode_card_local_heading: "Keep inference on this device",
  mode_card_local_desc:
    "PDF text is extracted in your browser. Firebase AI Logic asks Chrome's on-device model to analyze it. If that model is unavailable, the request fails instead of moving to cloud.",
  mode_card_local_p1: "No cloud fallback",
  mode_card_local_p2: "Requires supported desktop Chrome",
  mode_card_local_p3: "Firebase App Check still applies",

  mode_card_cloud_title: "Cloud AI",
  mode_card_cloud_badge: "GEMINI",
  mode_card_cloud_heading: "Analyze with Gemini 3.8 Flash",
  mode_card_cloud_desc:
    "Send extracted PDF text to Google's cloud through Firebase AI Logic. This mode uses cloud inference only and does not fall back to on-device processing.",
  mode_card_cloud_p1: "Direct cloud inference",
  mode_card_cloud_p2: "Requires your explicit consent",
  mode_card_cloud_p3: "Firebase App Check required",

  mode_card_hybrid_title: "Hybrid inference",
  mode_card_hybrid_badge: "ON-DEVICE FIRST",
  mode_card_hybrid_heading: "Prefer on-device, allow fallback",
  mode_card_hybrid_desc:
    "Firebase AI Logic tries the available on-device model first. If unavailable, the SDK may send extracted text to Gemini 3.8 Flash in Google's cloud.",
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

  // ── Processing — cloud consent ────────────────────────────────────────────────
  consent_cloud_title: "I explicitly allow cloud AI processing for this session.",
  consent_cloud_detail:
    "Extracted text from this PDF will be sent to Gemini through Firebase AI Logic. This setting resets when the page is reloaded.",
  consent_hybrid_title: "I explicitly allow cloud fallback for this session.",
  consent_hybrid_detail:
    "If the on-device model is unavailable, extracted text from this PDF may be sent to Google's Gemini service through Firebase AI Logic. This setting resets when the page is reloaded.",

  // ── Processing — file drop ────────────────────────────────────────────────────
  file_input_aria: "Choose a PDF document",
  file_replace: "Replace",
  file_stored: "stored in this browser session",
  drop_title: "Drop a tender PDF here",
  drop_or: "or select a file from your device",
  drop_choose: "Choose PDF",
  drop_note: "PDF only · maximum 20 MB · scanned PDFs may use optional external OCR",

  // ── Processing — external OCR ─────────────────────────────────────────────────
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

  // ── Processing — error / progress ─────────────────────────────────────────────
  error_dismiss: "Dismiss error",
  progress_default: "Preparing analysis...",

  // ── Processing — Firebase setup notice ────────────────────────────────────────
  firebase_setup_title: "Firebase setup is needed for live analysis.",
  firebase_setup_desc:
    "Configure a Firebase web app, enable Firebase AI Logic, and set App Check before running a live model call. Follow the setup steps in README.md.",

  // ── Processing — runtime status ───────────────────────────────────────────────
  runtime_firebase_label: "Firebase AI Logic",
  runtime_not_configured: "Not configured",
  runtime_connected: "Connected · a response was received",
  runtime_configured_no_response: "Configured · no live response yet",
  runtime_processing_source: "Processing source",
  runtime_demo_mode: "Demo mode · AI not used",
  runtime_not_run: "Not run",
  runtime_demo_data: "Demo data",

  // ── Processing — footer ───────────────────────────────────────────────────────
  footer_selected_mode: "Selected mode",
  footer_source_reporting: "Source reporting",
  footer_source_reporting_value: "Actual inference source appears with the results",
  footer_mode_demo: "Sample data",
  footer_mode_local: "On-device only",
  footer_mode_cloud: "Cloud AI · consent required",
  footer_mode_hybrid: "Hybrid · consent required",
  footer_status_demo: "No real document is processed.",
  footer_status_local: "No cloud fallback will be used.",
  footer_status_cloud_ok: "Cloud processing consent is enabled for this session.",
  footer_status_cloud_pending: "Enable cloud consent above to continue.",
  footer_status_hybrid_ok: "Cloud fallback consent is enabled for this session.",
  footer_status_hybrid_pending: "Enable cloud consent above to continue.",

  // ── Processing — footer actions ───────────────────────────────────────────────
  btn_explore_sample: "Explore sample analysis",
  btn_ask_pdf: "Ask about this PDF",
  btn_extract_text: "Extract text only",
  btn_analyze_sample: "Analyze fictional sample",
  btn_analyze_pdf: "Analyze PDF",
  btn_processing: "Processing...",

  // ── Processing — process flow ─────────────────────────────────────────────────
  flow_title: "From document to reviewable findings",
  flow_subtitle: "Every finding links back to a source excerpt so a person can verify it.",
  flow_step1_title: "Choose PDF",
  flow_step1_detail: "File stays in browser",
  flow_step2_title: "Process text",
  flow_step2_detail: "Selected mode applies",
  flow_step3_title: "Verify findings",
  flow_step3_detail: "Source excerpts checked",
  flow_step4_title: "Human review",
  flow_step4_detail: "Decisions stay yours",
  flow_current_sample: "Current workspace document:",

  // ── DocumentQaPanel ───────────────────────────────────────────────────────────
  qa_title: "Ask this document",
  qa_subtitle: "Ask follow-up questions and review every answer against its sources.",
  qa_document_grounded: "Document-grounded",
  qa_privacy_note:
    "Questions use the selected AI mode. Cloud and hybrid fallback require your existing Firebase consent. The PDF is never sent to Firecrawl.",
  qa_review_consent: "Review cloud consent",
  qa_mode_note:
    "Choose on-device, cloud, or hybrid processing before asking. The prepared sample is illustrative and is not a real tender.",
  qa_choose_mode: "Choose a mode",
  qa_empty_title: "Start with a question about a requirement, rule, or missing detail.",
  qa_empty_detail:
    "Answers separate what the PDF says from working hypotheses and questions that still need verification.",
  qa_role_user: "You",
  qa_role_assistant: "PocketMind",
  qa_hypotheses: "Working hypotheses",
  qa_unresolved: "Still to verify",
  qa_citations_title: "Document evidence",
  qa_page_unavailable: "Page reference unavailable",
  qa_citation_verified: "Verified in extracted text",
  qa_citation_unverified: "Verify against the PDF",
  qa_research_title: "Search results · verify authority and current status",
  qa_research_cited: "Cited in answer",
  qa_research_not_cited: "Not cited in answer",
  qa_research_no_date: "Publication date not provided",
  qa_research_no_sources:
    "Firecrawl returned no sources; this answer uses the document only.",
  qa_sending_research: "Searching sources and preparing an evidence-based answer…",
  qa_sending_document: "Checking the document and preparing an answer…",
  qa_research_checking: "Checking availability…",
  qa_research_available: "Optional · requires separate consent",
  qa_research_unavailable: "Not configured on the server",
  qa_research_error_status: "Availability could not be checked",
  qa_research_error_msg:
    "External research availability could not be checked. Try reloading or ask from the document only.",
  qa_jurisdiction_label: "Research jurisdiction",
  qa_jurisdiction_placeholder: "e.g. Brazil — State of Amazonas; Law 1,762/1986",
  qa_country_label: "Country code",
  qa_country_placeholder: "BR",
  qa_research_privacy1:
    "Only your question, country code, and jurisdiction are sent to Firecrawl; the PDF is not.",
  qa_research_privacy2:
    "External research accepts questions up to 300 characters and jurisdictions up to 150.",
  qa_research_consent:
    "I consent to sending this question, country code, and jurisdiction to Firecrawl for external research.",
  qa_composer_aria: "Ask a question about this document",
  qa_composer_placeholder: "Ask a question about this document…",
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

  // ── GuidedTour ────────────────────────────────────────────────────────────────
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
    "Turn complex tender PDFs into reviewable findings — with a link to the source page for each one. This short tour walks the full flow in about 90 seconds, using the preloaded sample tender. No setup needed.",
  tour_step1_title: "Four areas, one workspace",
  tour_step1_body:
    "Move between Dashboard, Document analysis, Compliance matrix, and Processing & privacy from this sidebar.",
  tour_step2_title: "Your workspace at a glance",
  tour_step2_body:
    "Documents in the session, requirements extracted, critical risks flagged for review, and pending reviews.",
  tour_step3_title: "The sample tender is ready",
  tour_step3_body:
    "NB-2026-114 Smart LED Street Lighting is preloaded and labeled illustrative — no Firebase setup needed to explore it.",
  tour_step4_title: "Choose how it's processed",
  tour_step4_body:
    "On-device, Cloud, Hybrid, or Sample data. Cloud and hybrid need your explicit consent. The tour uses Sample data — no upload, no model call.",
  tour_step5_title: "Findings, beside their source",
  tour_step5_body:
    "Requirements, deadlines, specifications, risks, and missing information — each quotes its excerpt. Click the Page link to jump to the source. Green means verified against the text.",
  tour_step6_title: "Verify against the original",
  tour_step6_body:
    "The source page sits beside the findings so you can confirm every excerpt yourself. AI findings are suggestions — verify before you rely on them.",
  tour_step7_title: "Track every requirement",
  tour_step7_body:
    "Filter by category, inspect the evidence, set a review status (Pending → Reviewed → Satisfied, or Unclear), add notes, and export to CSV.",
  tour_step8_title: "Privacy by choice. Decisions stay yours.",
  tour_step8_body:
    "PDF text is extracted in your browser; cloud use is always your explicit choice. When you're ready, choose Sample data and Explore sample analysis to try the full flow yourself.",

  // ── CSV export ────────────────────────────────────────────────────────────────
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
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = typeof en;
