# Localization — PocketMind AI

## Política linguística (confirmada)

| Configuração | Decisão |
|---|---|
| Idioma padrão da interface | **Inglês** |
| Idioma das respostas da IA | **Automático — segue o idioma da pergunta** |
| Idiomas da v1 | **EN + PT + ES simultaneamente** |

## Três camadas linguísticas

| Camada | Escopo |
|---|---|
| Interface language | Menus, botões, labels, erros, estados, exportações |
| Preferred response language | Idioma das respostas da IA (automático por defeito) |
| Document language | Idioma original do documento — nunca traduzido |

**Regra fundamental:** traduzir a explicação, nunca modificar a evidência original.

## Exemplo de fluxo multilíngue

- Documento: EN — "Tenderers must hold a valid electrical contractor licence."
- Pergunta: PT — "Que licença é obrigatória?"
- Resposta: PT — explicação em português
- Evidência: EN — excerto original preservado, página verificada

## Fases de implementação

1. **Auditoria** — inventariar todos os textos hardcoded (concluída — ver secção abaixo)
2. **i18n da interface** — sistema centralizado de traduções (EN / PT / ES)
3. **Inteligência linguística** — prompts detetam idioma da pergunta, respondem no idioma correto, preservam JSON estruturado e evidências originais
4. **Documentos multilíngues** — testar tenders em PT, EN, ES com atenção a terminologia jurídica, datas, valores
5. **Testes de consistência** — matriz completa de combinações interface × pergunta × documento × resposta esperada

## Auditoria de textos — inventário completo

### PocketMindApp.tsx

**Navegação (navigation array)**
- "Dashboard", "Document analysis", "Compliance matrix", "Processing & privacy"

**screenCopy (títulos e subtítulos por ecrã)**
- overview: "Your document intelligence workspace" / "Turn complex tenders into reviewable findings, with source evidence attached."
- analysis: "Document analysis" / "Review extracted findings beside their source pages."
- compliance: "Compliance matrix" / "Track each requirement against evidence and your team's review status."
- processing: "Choose how your document is processed" / "Text is extracted in this browser. You control whether AI may process it in the cloud."

**modeLabel (etiquetas de fonte de processamento)**
- "On-device", "Cloud", "Cloud fallback", "Hybrid", "Demo mode", "Not analyzed"

**Sidebar**
- "Workspace", "Privacy by choice", "Cloud use is always explicit.", "Procurement workspace", "Local browser session"

**Topbar**
- Search placeholder: "Search documents, requirements, risks..."
- aria-label: "Search current workspace", "Clear search"
- Firebase status labels: "Firebase setup required", "Firebase AI Logic: Connected", "Firebase configured · not yet verified"

**Botão global**
- "Add a document"

**Demo banner**
- "Illustrative sample" + DEMO_LABEL

**OverviewScreen**
- Metric labels: "Documents in workspace", "Files in this browser session", "Sample requirements", "Requirements extracted", "Illustrative prepared findings", "AI findings from fictional text", "with source-verified excerpts", "Critical risks", "Flagged for human review", "Pending reviews", "Requirements awaiting a decision"
- Table headers: "Document", "Pages", "Processing", "Status"
- Status badges: "Prepared sample", "AI-analysed sample", "Analyzed", "Not analyzed"
- Empty state: "No matching documents", "Try a different search term."
- Panel footer: "Showing X of Y documents", "Open current analysis"
- Upload tile: "Upload a tender", "Extract text locally, with optional external OCR for scanned PDFs.", "Choose processing mode", "PDF only · maximum 20 MB · optional external OCR for scanned PDFs"
- Review queue: "Review queue", "Findings that need human attention.", "Source verified · page X", "Evidence needs verification", "All requirements are reviewed.", "Analyze a document to create a review queue."

**AnalysisScreen**
- Filter chips: "All findings", "Requirements", "Deadlines", "Specifications", "Risks", "Missing & inconsistencies"
- Source panel: "Extracted source text", "Text extracted by LlamaParse.", "LlamaParse text; original page boundaries are unavailable.", "Text extracted locally in this browser.", "Previous page", "Next page", "Page X of Y", "Page numbers unavailable", "Pagination unavailable", "No text is available for this page.", "Extracted text may need manual verification against the original PDF."
- Pre-analysis heading: "Ask about this document", "Review the text extracted in your browser and ask a question before running a full analysis.", "Run full analysis"
- Document toolbar: "Fictional sample", "PDF document", "pages", "Pagination unverified", "Text: external OCR (LlamaParse)", "Export JSON"
- Demo warning: "This prepared analysis is simulated and illustrative; it was not generated from the sample text.", "This AI analysis uses fictional sample text, not a real procurement document."
- LlamaParse warning: "LlamaParse did not provide page numbers. Citations cannot be page-verified; findings are flagged for human review."
- Analysis run section: "Analysis run", "Processing source:", "Firebase AI Logic", "Not used", "Connected · response received", "Model", "Evidence mode", "Page-linked excerpts · checked against extracted text", "Demo data", "Yes", "No"
- Summary strip: "Document summary"
- Finding cards: "Date not specified", "No source page", "Source verified", "Verify source", "X% confidence"
- Findings panel: "Findings", "X shown · Y total", "Illustrative", "AI-generated · review required", "No findings match your search", "No findings in this category", "Change the filter or search a different term.", "AI findings are suggestions. Verify every cited passage before relying on it."
- EmptyAnalysis: "No analysis for this document yet", "Choose an on-device or hybrid processing mode to extract findings from a PDF.", "Open processing options"

**ComplianceScreen**
- Toolbar: "Search from the workspace bar...", "All categories", "All statuses", "Pending", "Reviewed", "Satisfied", "Unclear", "Export CSV"
- Matrix summary: "X requirements", "with verified evidence", "shown"
- Table headers: "Requirement", "Category", "Mandatory", "Evidence", "Page", "Review status"
- Cell values: "Verified", "Check excerpt", "Not provided", "Yes", "No"
- Panel footer: "Review status is held in this browser session only."
- Evidence panel: "Source evidence", "Selected requirement", "No source excerpt was returned. Verify this requirement manually.", "Review notes", placeholder "Add a note for your review...", "Select a requirement to inspect its evidence."
- Demo warning: "Sample requirements and review results are fictional and illustrative."
- Empty state: "No requirements match these filters", "Adjust the filters or search terms."

**ProcessingScreen**
- Topline: "Processing options", "01 / 03"
- Mode cards:
  - "On-device only" / "PRIVATE" / "Keep inference on this device" / description + 3 bullet points
  - "Cloud AI" / "GEMINI" / "Analyze with Gemini 3.8 Flash" / description + 3 bullet points
  - "Hybrid inference" / "ON-DEVICE FIRST" / "Prefer on-device, allow fallback" / description + 3 bullet points
  - "Sample data" / "DEMO" / "Explore prepared findings" / description + 3 bullet points
- Cloud consent labels (cloud e hybrid variants)
- File drop: "Choose a PDF document", "Replace", "Drop a tender PDF here", "or select a file from your device", "Choose PDF", "PDF only · maximum 20 MB · scanned PDFs may use optional external OCR", "stored in this browser session"
- External OCR panel: "This looks like a scanned PDF.", description, "Analyze the text available in this browser", "Checking whether external OCR is enabled...", "External OCR is not enabled." + description, "Check again", "Could not check connector availability.", "Retry check", OCR consent label, "Extract with LlamaParse", "Extracting and analyzing..."
- Error banner: dismiss aria-label "Dismiss error"
- Progress: "Preparing analysis..."
- Firebase setup notice: "Firebase setup is needed for live analysis." + description
- Runtime status: "Firebase AI Logic", "Not configured", "Connected · a response was received", "Configured · no live response yet", "Processing source", "Demo mode · AI not used", "Not run", "Demo data"
- Footer: "Selected mode", "Source reporting", "Actual inference source appears with the results", mode labels, consent status strings
- Footer actions: "Explore sample analysis", "Ask about this PDF", "Extract text only", "Analyze fictional sample", "Analyze PDF", "Processing...", consent/status strings
- Process flow: "From document to reviewable findings", "Every finding links back to a source excerpt so a person can verify it.", "Choose PDF", "File stays in browser", "Process text", "Selected mode applies", "Verify findings", "Source excerpts checked", "Human review", "Decisions stay yours"
- Current sample: "Current workspace document:"

### DocumentQaPanel.tsx

- Panel heading: "Ask this document", "Ask follow-up questions and review every answer against its sources.", "Document-grounded"
- Privacy note: "Questions use the selected AI mode. Cloud and hybrid fallback require your existing Firebase consent. The PDF is never sent to Firecrawl.", "Review cloud consent"
- Mode note: "Choose on-device, cloud, or hybrid processing before asking. The prepared sample is illustrative and is not a real tender.", "Choose a mode"
- Empty state: "Start with a question about a requirement, rule, or missing detail.", "Answers separate what the PDF says from working hypotheses and questions that still need verification."
- Message roles: "You", "PocketMind"
- Hypothesis section: "Working hypotheses"
- Unresolved section: "Still to verify"
- Citations section: "Document evidence", "Page reference unavailable", "Verified in extracted text", "Verify against the PDF"
- Research sources: "Search results · verify authority and current status", "Cited in answer", "Not cited in answer", "Publication date not provided"
- Research fallback: "Firecrawl returned no sources; this answer uses the document only."
- Sending state: "Searching sources and preparing an evidence-based answer…", "Checking the document and preparing an answer…"
- Research availability: "Checking availability…", "Optional · requires separate consent", "Not configured on the server", "Availability could not be checked"
- Research fields: "Research jurisdiction", placeholder, "Country code", placeholder, privacy notes
- Research consent label
- Error: "External research availability could not be checked. Try reloading or ask from the document only."
- Composer: aria-label "Ask a question about this document", placeholder "Ask a question about this document…"
- Voice buttons: "Use voice to draft a question", "Voice input is not supported by this browser", "Stop listening", "Use microphone", "Stop reading answer", "Read answer aloud", "Stop reading", "Read answer aloud"
- Voice note: "Your browser may use its own speech service. Nothing is sent to AI until you submit.", "Voice input is unavailable in this browser; you can type."
- Send button: "Send question"
- Research toggle: "Include external research (Firecrawl)"
- Pagination note: "This document has no verified page mapping. Answers may quote extracted text, but page citations are withheld."
- Error messages (runtime): voice error, on-device too large, generic

### GuidedTour.tsx

- Tour step titles e bodies (9 passos)
- Badges: "Welcome", "Step X of Y"
- Buttons: "Close tour", "Skip tour", "Back to app", "Previous step", "Start tour", "Done", "Next"

### csv.ts

- CSV column headers: "Requirement", "Category", "Mandatory", "Evidence", "Page", "Evidence verified", "Review status", "Notes"
- Cell values: "Mandatory", "Optional", "Evidence not available", "Yes", "No"

### tenderAnalysis.ts (prompts da IA)

- buildPrompt: instrução em inglês para o modelo — **não traduzir** (JSON schema keys, instrução técnica)
- Progress messages: "Preparing Firebase AI Logic cloud analysis", "Preparing the on-device model", "Downloading the on-device model (X%)", "On-device unavailable; Firebase AI Logic will try cloud fallback.", "Analyzing text section X of Y", "On-device unavailable; using cloud fallback for section X", "Verifying cited evidence"
- Error messages: "No selectable text was found...", "On-device inference is unavailable.", "Firebase AI Logic did not return any analysis results."
- Engine/model labels: "Firebase AI Logic · on-device + cloud", "Chrome on-device model", "Gemini 3.8 Flash"

### documentQa.ts (prompts da IA)

- buildQuestionPrompt (compact e full): instrução em inglês para o modelo — **não traduzir**
- "Reply in the question's language" / "Reply in the language of the question" — já instrui o modelo a responder no idioma da pergunta ✅
- Error messages: "Enter a question about this document.", "No extracted document text is available.", "The answer could not be parsed:", "The answer did not match the required format:"

### sampleTender.ts

- DEMO_LABEL: "DEMO DATA — Illustrative analysis, not extracted from a real procurement document."
- Document name: "NB-2026-114 Smart LED Street Lighting Tender (sample).pdf"
- Analysis summary (EN)
- All requirement descriptions, deadline descriptions, specification details, risk titles/explanations (EN)
- missing[] e inconsistencies[] arrays (EN)

## Matriz de testes

| Interface | Pergunta | Documento | Resposta esperada |
|---|---|---|---|
| EN | EN | EN | EN |
| PT | PT | EN | PT |
| EN | PT | PT | PT |
| ES | ES | EN | ES |
| PT | EN | ES | PT (idioma preferido) |
| EN | ES | PT | EN (idioma preferido) |

## Regras de implementação

- Nomes de campos do schema JSON nunca são traduzidos
- Citações originais permanecem intactas
- Páginas das evidências continuam corretas após tradução
- Tradução não altera valores, datas ou obrigações
- Textos PT/ES são mais longos — testar responsividade em conjunto com alterações de layout
- Não misturar alterações funcionais de i18n com alterações de layout responsivo
- Os prompts da IA (buildPrompt, buildQuestionPrompt) permanecem em inglês — são instruções técnicas ao modelo, não UI
- documentQa.ts já instrui o modelo a responder no idioma da pergunta — comportamento correto para v1
- DEMO_LABEL e dados do sampleTender.ts ficam em EN na v1 (documento fictício é EN)

## Relação com o hackathon

Suporte multilíngue reforça a proposta de valor para juízes internacionais e diferencia o projeto na categoria Best Web/Chrome. Não é requisito técnico do #BuildHybridAI 2026, mas contribui para a qualidade da submissão.

## Prioridade atual

**Bloqueador antes de iniciar i18n:** validar App Check + Firebase AI Logic em produção (https://ai-mind-law.vercel.app). A localização é fase de refinamento — começa após o gate técnico estar aprovado.
