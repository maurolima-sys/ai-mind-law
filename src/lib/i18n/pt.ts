import type { Translations } from "./en";

export const pt: Translations = {
  nav_dashboard: "Painel",
  nav_analysis: "Análise documental",
  nav_compliance: "Matriz de conformidade",
  nav_processing: "Processamento e privacidade",

  screen_overview_title: "O seu espaço de trabalho documental",
  screen_overview_subtitle:
    "Transforme concursos complexos em conclusões verificáveis, com evidências de origem anexadas.",
  screen_analysis_title: "Análise documental",
  screen_analysis_subtitle: "Reveja as conclusões extraídas ao lado das páginas de origem.",
  screen_compliance_title: "Matriz de conformidade",
  screen_compliance_subtitle:
    "Acompanhe cada requisito face às evidências e ao estado de revisão da sua equipa.",
  screen_processing_title: "Escolha como o documento é processado",
  screen_processing_subtitle:
    "O texto é extraído neste browser. Você controla se a IA pode processá-lo na nuvem.",

  mode_on_device: "No dispositivo",
  mode_cloud: "Nuvem",
  mode_cloud_fallback: "Fallback para nuvem",
  mode_hybrid: "Híbrido",
  mode_demo: "Modo demonstração",
  mode_not_analyzed: "Não analisado",

  sidebar_workspace: "Espaço de trabalho",
  sidebar_privacy_title: "Privacidade por escolha",
  sidebar_privacy_note: "O uso da nuvem é sempre explícito.",
  sidebar_user_workspace: "Espaço de contratação pública",
  sidebar_user_session: "Sessão local do browser",

  search_placeholder: "Pesquisar documentos, requisitos, riscos...",
  search_aria: "Pesquisar no espaço de trabalho",
  search_clear: "Limpar pesquisa",
  firebase_not_configured: "Configuração Firebase necessária",
  firebase_connected: "Firebase AI Logic: Ligado",
  firebase_configured: "Firebase configurado · ainda não verificado",

  btn_add_document: "Adicionar documento",

  demo_banner_title: "Amostra ilustrativa",

  metric_docs_label: "Documentos no espaço de trabalho",
  metric_docs_detail: "Ficheiros nesta sessão do browser",
  metric_reqs_label_sample: "Requisitos de amostra",
  metric_reqs_label_real: "Requisitos extraídos",
  metric_reqs_detail_demo: "Conclusões ilustrativas preparadas",
  metric_reqs_detail_ai: "Conclusões de IA de texto fictício",
  metric_reqs_detail_verified: "com excertos verificados na origem",
  metric_risks_label: "Riscos críticos",
  metric_risks_detail: "Sinalizados para revisão humana",
  metric_pending_label: "Revisões pendentes",
  metric_pending_detail: "Requisitos a aguardar decisão",

  table_col_document: "Documento",
  table_col_pages: "Páginas",
  table_col_processing: "Processamento",
  table_col_status: "Estado",
  status_prepared_sample: "Amostra preparada",
  status_ai_analysed: "Amostra analisada por IA",
  status_analyzed: "Analisado",
  status_not_analyzed: "Não analisado",
  docs_empty_title: "Nenhum documento encontrado",
  docs_empty_detail: "Tente um termo de pesquisa diferente.",
  docs_showing: "A mostrar {{shown}} de {{total}} documentos",
  docs_open_analysis: "Abrir análise atual",

  upload_tile_title: "Carregar concurso",
  upload_tile_detail: "Extraia texto localmente, com OCR externo opcional para PDFs digitalizados.",
  upload_tile_cta: "Escolher modo de processamento",
  upload_tile_note: "Apenas PDF · máximo 20 MB · OCR externo opcional para PDFs digitalizados",

  review_queue_title: "Fila de revisão",
  review_queue_subtitle: "Conclusões que precisam de atenção humana.",
  review_source_verified: "Origem verificada · página {{page}}",
  review_evidence_needs: "Evidência necessita verificação",
  review_all_done: "Todos os requisitos foram revistos.",
  review_empty: "Analise um documento para criar uma fila de revisão.",

  filter_all: "Todas as conclusões",
  filter_requirements: "Requisitos",
  filter_deadlines: "Prazos",
  filter_specifications: "Especificações",
  filter_risks: "Riscos",
  filter_missing: "Em falta e inconsistências",

  source_panel_title: "Texto de origem extraído",
  source_panel_title_full: "Documento de origem",
  source_llamaparse_paginated: "Texto extraído pelo LlamaParse.",
  source_llamaparse_unpaginated:
    "Texto LlamaParse; os limites de página originais não estão disponíveis.",
  source_pdfjs: "Texto extraído localmente neste browser.",
  source_pdfjs_full: "Texto da página extraído neste browser.",
  source_llamaparse_full: "Texto da página extraído pelo LlamaParse.",
  source_prev_page: "Página anterior",
  source_next_page: "Página seguinte",
  source_page_of: "Página {{page}} de {{total}}",
  source_no_page_numbers: "Números de página indisponíveis",
  source_pagination_unavailable: "Paginação indisponível",
  source_no_text: "Não há texto disponível para esta página.",
  source_disclaimer:
    "O texto extraído pode necessitar de verificação manual face ao PDF original.",

  pre_analysis_title: "Pergunte sobre este documento",
  pre_analysis_subtitle:
    "Reveja o texto extraído no seu browser e faça uma pergunta antes de executar uma análise completa.",
  pre_analysis_cta: "Executar análise completa",

  toolbar_fictional_sample: "Amostra fictícia",
  toolbar_pdf_document: "Documento PDF",
  toolbar_pages: "páginas",
  toolbar_pagination_unverified: "Paginação não verificada",
  toolbar_llamaparse_badge: "Texto: OCR externo (LlamaParse)",
  toolbar_export_json: "Exportar JSON",

  warning_demo_prepared:
    "Esta análise preparada é simulada e ilustrativa; não foi gerada a partir do texto de amostra.",
  warning_demo_ai:
    "Esta análise de IA utiliza texto de amostra fictício, não um documento de contratação real.",
  warning_llamaparse_no_pages:
    "O LlamaParse não forneceu números de página. As citações não podem ser verificadas por página; as conclusões estão sinalizadas para revisão humana.",

  inference_title: "Execução da análise",
  inference_processing_source: "Fonte de processamento:",
  inference_firebase_label: "Firebase AI Logic",
  inference_firebase_not_used: "Não utilizado",
  inference_firebase_connected: "Ligado · resposta recebida",
  inference_model_label: "Modelo",
  inference_evidence_label: "Modo de evidência",
  inference_evidence_value: "Excertos ligados a páginas · verificados face ao texto extraído",
  inference_demo_label: "Dados de demonstração",
  inference_yes: "Sim",
  inference_no: "Não",

  summary_title: "Resumo do documento",

  finding_date_not_specified: "Data não especificada",
  finding_no_source_page: "Sem página de origem",
  finding_source_verified: "Origem verificada",
  finding_verify_source: "Verificar origem",
  finding_confidence: "{{pct}}% de confiança",

  findings_title: "Conclusões",
  findings_count: "{{shown}} mostradas · {{total}} no total",
  findings_illustrative: "Ilustrativo",
  findings_ai_generated: "Gerado por IA · revisão necessária",
  findings_empty_search: "Nenhuma conclusão corresponde à pesquisa",
  findings_empty_category: "Nenhuma conclusão nesta categoria",
  findings_empty_hint: "Altere o filtro ou pesquise um termo diferente.",
  findings_disclaimer:
    "As conclusões da IA são sugestões. Verifique cada passagem citada antes de a utilizar.",

  empty_analysis_title: "Ainda não há análise para este documento",
  empty_analysis_detail:
    "Escolha um modo de processamento no dispositivo ou híbrido para extrair conclusões de um PDF.",
  empty_analysis_cta: "Abrir opções de processamento",

  compliance_search_hint: "Pesquisar na barra do espaço de trabalho...",
  compliance_all_categories: "Todas as categorias",
  compliance_all_statuses: "Todos os estados",
  compliance_status_pending: "Pendente",
  compliance_status_reviewed: "Revisto",
  compliance_status_satisfied: "Satisfeito",
  compliance_status_unclear: "Pouco claro",
  compliance_export_csv: "Exportar CSV",

  compliance_col_requirement: "Requisito",
  compliance_col_category: "Categoria",
  compliance_col_mandatory: "Obrigatório",
  compliance_col_evidence: "Evidência",
  compliance_col_page: "Página",
  compliance_col_review_status: "Estado de revisão",
  compliance_verified: "Verificado",
  compliance_check_excerpt: "Verificar excerto",
  compliance_not_provided: "Não fornecido",
  compliance_mandatory_yes: "Sim",
  compliance_mandatory_no: "Não",
  compliance_summary_reqs: "{{count}} requisitos",
  compliance_summary_verified: "com evidência verificada",
  compliance_summary_shown: "mostrados",
  compliance_footer_session: "O estado de revisão é guardado apenas nesta sessão do browser.",
  compliance_empty_title: "Nenhum requisito corresponde a estes filtros",
  compliance_empty_detail: "Ajuste os filtros ou os termos de pesquisa.",
  compliance_demo_warning:
    "Os requisitos de amostra e os resultados de revisão são fictícios e ilustrativos.",

  evidence_panel_title: "Evidência de origem",
  evidence_panel_subtitle: "Requisito selecionado",
  evidence_no_excerpt: "Nenhum excerto de origem foi devolvido. Verifique este requisito manualmente.",
  evidence_notes_label: "Notas de revisão",
  evidence_notes_placeholder: "Adicione uma nota para a sua revisão...",
  evidence_select_hint: "Selecione um requisito para inspecionar a sua evidência.",

  processing_topline: "Opções de processamento",
  processing_steps: "01 / 03",

  mode_card_local_title: "Apenas no dispositivo",
  mode_card_local_badge: "PRIVADO",
  mode_card_local_heading: "Manter a inferência neste dispositivo",
  mode_card_local_desc:
    "O texto do PDF é extraído no seu browser. O Firebase AI Logic pede ao modelo no dispositivo do Chrome para o analisar. Se esse modelo não estiver disponível, o pedido falha em vez de passar para a nuvem.",
  mode_card_local_p1: "Sem fallback para a nuvem",
  mode_card_local_p2: "Requer Chrome de secretária suportado",
  mode_card_local_p3: "Firebase App Check ainda se aplica",

  mode_card_cloud_title: "IA na nuvem",
  mode_card_cloud_badge: "GEMINI",
  mode_card_cloud_heading: "Analisar com Gemini 2.0 Flash",
  mode_card_cloud_desc:
    "Envie o texto extraído do PDF para a nuvem da Google através do Firebase AI Logic. Este modo utiliza apenas inferência na nuvem e não recorre ao processamento no dispositivo.",
  mode_card_cloud_p1: "Inferência direta na nuvem",
  mode_card_cloud_p2: "Requer o seu consentimento explícito",
  mode_card_cloud_p3: "Firebase App Check necessário",

  mode_card_hybrid_title: "Inferência híbrida",
  mode_card_hybrid_badge: "DISPOSITIVO PRIMEIRO",
  mode_card_hybrid_heading: "Preferir no dispositivo, permitir fallback",
  mode_card_hybrid_desc:
    "O Firebase AI Logic tenta primeiro o modelo disponível no dispositivo. Se não estiver disponível, o SDK pode enviar o texto extraído para o Gemini 2.0 Flash na nuvem da Google.",
  mode_card_hybrid_p1: "Fonte real mostrada após análise",
  mode_card_hybrid_p2: "Uso da nuvem requer o seu consentimento",
  mode_card_hybrid_p3: "App Check necessário",

  mode_card_demo_title: "Dados de amostra",
  mode_card_demo_badge: "DEMO",
  mode_card_demo_heading: "Explorar conclusões preparadas",
  mode_card_demo_desc:
    "Veja o concurso fictício de iluminação pública de Northbridge e a sua análise preparada. Não ocorre nenhum carregamento ou chamada ao modelo neste modo.",
  mode_card_demo_p1: "Sem necessidade de configurar Firebase",
  mode_card_demo_p2: "Nenhum documento real processado",
  mode_card_demo_p3: "Amostra claramente identificada",

  consent_cloud_title: "Autorizo explicitamente o processamento de IA na nuvem para esta sessão.",
  consent_cloud_detail:
    "O texto extraído deste PDF será enviado para o Gemini através do Firebase AI Logic. Esta definição é reposta quando a página é recarregada.",
  consent_hybrid_title: "Autorizo explicitamente o fallback para a nuvem para esta sessão.",
  consent_hybrid_detail:
    "Se o modelo no dispositivo não estiver disponível, o texto extraído deste PDF pode ser enviado para o serviço Gemini da Google através do Firebase AI Logic. Esta definição é reposta quando a página é recarregada.",

  file_input_aria: "Escolher um documento PDF",
  file_replace: "Substituir",
  file_stored: "guardado nesta sessão do browser",
  drop_title: "Largue aqui um PDF de concurso",
  drop_or: "ou selecione um ficheiro do seu dispositivo",
  drop_choose: "Escolher PDF",
  drop_note: "Apenas PDF · máximo 20 MB · PDFs digitalizados podem usar OCR externo opcional",

  ocr_scanned_title: "Este parece ser um PDF digitalizado.",
  ocr_scanned_desc:
    "Pode enviar este ficheiro para o LlamaParse para extração de texto externa. O Firebase AI Logic analisará o texto extraído a seguir.",
  ocr_analyze_extracted: "Analisar o texto disponível neste browser",
  ocr_checking: "A verificar se o OCR externo está ativado...",
  ocr_disabled_title: "O OCR externo não está ativado.",
  ocr_disabled_desc: "Ligue o conector da Plataforma LlamaParse a este projeto no Lovable.",
  ocr_check_again: "Verificar novamente",
  ocr_error: "Não foi possível verificar a disponibilidade do conector.",
  ocr_retry: "Tentar novamente",
  ocr_consent_title: "Consinto o envio deste PDF para o LlamaParse para OCR externo.",
  ocr_consent_detail:
    "Este consentimento é separado do consentimento de nuvem do Firebase. O PDF é enviado para o LlamaParse mesmo quando a inferência no dispositivo está selecionada.",
  ocr_extract_btn: "Extrair com LlamaParse",
  ocr_extracting: "A extrair e a analisar...",

  error_dismiss: "Dispensar erro",
  progress_default: "A preparar análise...",

  firebase_setup_title: "É necessária a configuração do Firebase para análise em direto.",
  firebase_setup_desc:
    "Configure uma aplicação web Firebase, ative o Firebase AI Logic e configure o App Check antes de executar uma chamada ao modelo em direto. Siga os passos de configuração no README.md.",

  runtime_firebase_label: "Firebase AI Logic",
  runtime_not_configured: "Não configurado",
  runtime_connected: "Ligado · uma resposta foi recebida",
  runtime_configured_no_response: "Configurado · ainda sem resposta em direto",
  runtime_processing_source: "Fonte de processamento",
  runtime_demo_mode: "Modo demonstração · IA não utilizada",
  runtime_not_run: "Não executado",
  runtime_demo_data: "Dados de demonstração",

  footer_selected_mode: "Modo selecionado",
  footer_source_reporting: "Reporte de origem",
  footer_source_reporting_value: "A fonte de inferência real aparece com os resultados",
  footer_mode_demo: "Dados de amostra",
  footer_mode_local: "Apenas no dispositivo",
  footer_mode_cloud: "IA na nuvem · consentimento necessário",
  footer_mode_hybrid: "Híbrido · consentimento necessário",
  footer_status_demo: "Nenhum documento real é processado.",
  footer_status_local: "Não será utilizado fallback para a nuvem.",
  footer_status_cloud_ok: "O consentimento de processamento na nuvem está ativo para esta sessão.",
  footer_status_cloud_pending: "Ative o consentimento de nuvem acima para continuar.",
  footer_status_hybrid_ok: "O consentimento de fallback para a nuvem está ativo para esta sessão.",
  footer_status_hybrid_pending: "Ative o consentimento de nuvem acima para continuar.",

  btn_explore_sample: "Explorar análise de amostra",
  btn_ask_pdf: "Perguntar sobre este PDF",
  btn_extract_text: "Extrair apenas texto",
  btn_analyze_sample: "Analisar amostra fictícia",
  btn_analyze_pdf: "Analisar PDF",
  btn_processing: "A processar...",

  flow_title: "Do documento a conclusões verificáveis",
  flow_subtitle:
    "Cada conclusão está ligada a um excerto de origem para que uma pessoa possa verificá-la.",
  flow_step1_title: "Escolher PDF",
  flow_step1_detail: "Ficheiro fica no browser",
  flow_step2_title: "Processar texto",
  flow_step2_detail: "Modo selecionado aplicado",
  flow_step3_title: "Verificar conclusões",
  flow_step3_detail: "Excertos de origem verificados",
  flow_step4_title: "Revisão humana",
  flow_step4_detail: "Decisões ficam suas",
  flow_current_sample: "Documento atual no espaço de trabalho:",

  qa_title: "Pergunte a este documento",
  qa_subtitle: "Faça perguntas de acompanhamento e reveja cada resposta face às suas fontes.",
  qa_document_grounded: "Baseado no documento",
  qa_privacy_note:
    "As perguntas utilizam o modo de IA selecionado. O fallback de nuvem e híbrido requer o seu consentimento Firebase existente. O PDF nunca é enviado para o Firecrawl.",
  qa_review_consent: "Rever consentimento de nuvem",
  qa_mode_note:
    "Escolha o processamento no dispositivo, na nuvem ou híbrido antes de perguntar. A amostra preparada é ilustrativa e não é um concurso real.",
  qa_choose_mode: "Escolher um modo",
  qa_empty_title: "Comece com uma pergunta sobre um requisito, regra ou detalhe em falta.",
  qa_empty_detail:
    "As respostas separam o que o PDF diz das hipóteses de trabalho e das questões que ainda precisam de verificação.",
  qa_role_user: "Você",
  qa_role_assistant: "PocketMind",
  qa_hypotheses: "Hipóteses de trabalho",
  qa_unresolved: "Ainda a verificar",
  qa_citations_title: "Evidência documental",
  qa_page_unavailable: "Referência de página indisponível",
  qa_citation_verified: "Verificado no texto extraído",
  qa_citation_unverified: "Verificar face ao PDF",
  qa_research_title: "Resultados de pesquisa · verificar autoridade e estado atual",
  qa_research_cited: "Citado na resposta",
  qa_research_not_cited: "Não citado na resposta",
  qa_research_no_date: "Data de publicação não fornecida",
  qa_research_no_sources:
    "O Firecrawl não devolveu fontes; esta resposta utiliza apenas o documento.",
  qa_sending_research: "A pesquisar fontes e a preparar uma resposta baseada em evidências…",
  qa_sending_document: "A verificar o documento e a preparar uma resposta…",
  qa_research_checking: "A verificar disponibilidade…",
  qa_research_available: "Opcional · requer consentimento separado",
  qa_research_unavailable: "Não configurado no servidor",
  qa_research_error_status: "Não foi possível verificar a disponibilidade",
  qa_research_error_msg:
    "Não foi possível verificar a disponibilidade da pesquisa externa. Tente recarregar ou pergunte apenas com base no documento.",
  qa_jurisdiction_label: "Jurisdição de pesquisa",
  qa_jurisdiction_placeholder: "ex. Brasil — Estado do Amazonas; Lei 1.762/1986",
  qa_country_label: "Código do país",
  qa_country_placeholder: "BR",
  qa_research_privacy1:
    "Apenas a sua pergunta, código do país e jurisdição são enviados para o Firecrawl; o PDF não é enviado.",
  qa_research_privacy2:
    "A pesquisa externa aceita perguntas até 300 caracteres e jurisdições até 150.",
  qa_research_consent:
    "Consinto o envio desta pergunta, código do país e jurisdição para o Firecrawl para pesquisa externa.",
  qa_composer_aria: "Faça uma pergunta sobre este documento",
  qa_composer_placeholder: "Faça uma pergunta sobre este documento…",
  qa_voice_title: "Usar voz para redigir uma pergunta",
  qa_voice_unsupported: "A entrada de voz não é suportada por este browser",
  qa_voice_stop: "Parar de ouvir",
  qa_voice_use: "Usar microfone",
  qa_speak_stop: "Parar de ler a resposta",
  qa_speak_read: "Ler resposta em voz alta",
  qa_voice_note:
    "O seu browser pode usar o seu próprio serviço de voz. Nada é enviado para a IA até submeter.",
  qa_voice_unavailable: "A entrada de voz não está disponível neste browser; pode escrever.",
  qa_send: "Enviar pergunta",
  qa_research_toggle: "Incluir pesquisa externa (Firecrawl)",
  qa_pagination_note:
    "Este documento não tem mapeamento de páginas verificado. As respostas podem citar texto extraído, mas as citações de página são omitidas.",

  tour_badge_welcome: "Bem-vindo",
  tour_badge_step: "Passo {{step}} de {{total}}",
  tour_close: "Fechar visita guiada",
  tour_skip: "Saltar visita guiada",
  tour_back_to_app: "Voltar à aplicação",
  tour_prev: "Passo anterior",
  tour_start: "Iniciar visita guiada",
  tour_done: "Concluído",
  tour_next: "Seguinte",

  tour_step0_title: "Bem-vindo ao PocketMind AI",
  tour_step0_body:
    "Transforme PDFs de concursos complexos em conclusões verificáveis — com uma ligação à página de origem para cada uma. Esta visita guiada percorre o fluxo completo em cerca de 90 segundos, usando o concurso de amostra pré-carregado. Não é necessária configuração.",
  tour_step1_title: "Quatro áreas, um espaço de trabalho",
  tour_step1_body:
    "Navegue entre Painel, Análise documental, Matriz de conformidade e Processamento e privacidade a partir desta barra lateral.",
  tour_step2_title: "O seu espaço de trabalho de relance",
  tour_step2_body:
    "Documentos na sessão, requisitos extraídos, riscos críticos sinalizados para revisão e revisões pendentes.",
  tour_step3_title: "O concurso de amostra está pronto",
  tour_step3_body:
    "NB-2026-114 Smart LED Street Lighting está pré-carregado e identificado como ilustrativo — não é necessária configuração Firebase para o explorar.",
  tour_step4_title: "Escolha como é processado",
  tour_step4_body:
    "No dispositivo, Nuvem, Híbrido ou Dados de amostra. Nuvem e híbrido precisam do seu consentimento explícito. A visita guiada usa Dados de amostra — sem carregamento, sem chamada ao modelo.",
  tour_step5_title: "Conclusões, ao lado da origem",
  tour_step5_body:
    "Requisitos, prazos, especificações, riscos e informação em falta — cada um cita o seu excerto. Clique na ligação Página para saltar para a origem. Verde significa verificado face ao texto.",
  tour_step6_title: "Verificar face ao original",
  tour_step6_body:
    "A página de origem fica ao lado das conclusões para que possa confirmar cada excerto por si mesmo. As conclusões da IA são sugestões — verifique antes de as utilizar.",
  tour_step7_title: "Acompanhe cada requisito",
  tour_step7_body:
    "Filtre por categoria, inspecione a evidência, defina um estado de revisão (Pendente → Revisto → Satisfeito, ou Pouco claro), adicione notas e exporte para CSV.",
  tour_step8_title: "Privacidade por escolha. As decisões ficam suas.",
  tour_step8_body:
    "O texto do PDF é extraído no seu browser; o uso da nuvem é sempre a sua escolha explícita. Quando estiver pronto, escolha Dados de amostra e Explorar análise de amostra para experimentar o fluxo completo.",

  csv_col_requirement: "Requisito",
  csv_col_category: "Categoria",
  csv_col_mandatory: "Obrigatório",
  csv_col_evidence: "Evidência",
  csv_col_page: "Página",
  csv_col_evidence_verified: "Evidência verificada",
  csv_col_review_status: "Estado de revisão",
  csv_col_notes: "Notas",
  csv_mandatory: "Obrigatório",
  csv_optional: "Opcional",
  csv_evidence_na: "Evidência não disponível",
  csv_yes: "Sim",
  csv_no: "Não",
};
