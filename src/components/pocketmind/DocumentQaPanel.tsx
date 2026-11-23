import {
  ChevronDown,
  ExternalLink,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { answerDocumentQuestion } from "@/lib/services/documentQa";
import {
  checkLegalResearchAvailability,
  searchLegalSources,
} from "@/lib/services/legalResearch.functions";
import type { LegalResearchSource } from "@/lib/services/legalResearch";
import type { ChatCitation, DocumentFormat, InferencePreference } from "@/lib/types";
import type { InferenceSource } from "@/lib/services/inferenceSource";
import { useLocale, useT } from "@/lib/i18n";

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type QaMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      citations: ChatCitation[];
      hypotheses: string[];
      unresolvedQuestions: string[];
      researchSources: LegalResearchSource[];
      citedResearchSourceIds: string[];
      researchAttempted: boolean;
      engine: string;
      inferenceSource: InferenceSource;
    };

type ResearchAvailability = "checking" | "available" | "unavailable" | "error";

function documentJurisdiction(pages: string[]) {
  const text = pages.join(" ");
  if (/ASSEMBLEIA LEGISLATIVA DO ESTADO DO AMAZONAS/i.test(text)) {
    return {
      country: "BR",
      jurisdiction: "Brazil — State of Amazonas; Laws 2,400/1996 and 1,762/1986",
    };
  }
  return { country: "", jurisdiction: "" };
}

// ─── Suggested questions dropdown ────────────────────────────────────────────

const SUGGESTION_KEYS = [
  "qa_suggestions_q1",
  "qa_suggestions_q2",
  "qa_suggestions_q3",
  "qa_suggestions_q4",
  "qa_suggestions_q5",
  "qa_suggestions_q6",
] as const;

function SuggestedQuestions({
  onSelect,
  disabled,
}: {
  onSelect: (question: string) => void;
  disabled: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pm-qa-suggestions" ref={containerRef}>
      <button
        type="button"
        className={`pm-qa-suggestions-btn${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ChevronDown size={14} className="pm-qa-suggestions-chevron" aria-hidden="true" />
        {t("qa_suggestions_btn")}
      </button>

      {open && (
        <ul className="pm-qa-suggestions-list" role="listbox" aria-label={t("qa_suggestions_btn")}>
          {SUGGESTION_KEYS.map((key) => {
            const question = t(key);
            return (
              <li key={key} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(question);
                    setOpen(false);
                  }}
                >
                  {question}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DocumentQaPanel({
  documentName,
  pages,
  format,
  sourceLocations,
  draft,
  onDraftChange,
  preference,
  cloudConsent,
  paginationVerified,
  onOpenProcessing,
  onSelectPage,
  onModelResponse,
  voiceInputEnabled = true,
  answerSpeechEnabled = true,
  aiProvider,
}: {
  documentName: string;
  pages: string[];
  format: DocumentFormat;
  sourceLocations: string[];
  draft: string;
  onDraftChange: (draft: string) => void;
  preference: InferencePreference | null;
  cloudConsent: boolean;
  paginationVerified: boolean;
  onOpenProcessing: () => void;
  onSelectPage: (page: number, excerpt?: string) => void;
  onModelResponse: (source: InferenceSource) => void;
  voiceInputEnabled?: boolean;
  answerSpeechEnabled?: boolean;
  aiProvider?: import("@/lib/preferences").AiProvider;
}) {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [researchAvailability, setResearchAvailability] =
    useState<ResearchAvailability>("checking");
  const initialJurisdiction = documentJurisdiction(pages);
  const [country, setCountry] = useState(initialJurisdiction.country);
  const [jurisdiction, setJurisdiction] = useState(initialJurisdiction.jurisdiction);
  const [speechInputAvailable, setSpeechInputAvailable] = useState(false);
  const [speechOutputAvailable, setSpeechOutputAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    let active = true;
    const speechWindow = window as SpeechRecognitionWindow;
    setSpeechInputAvailable(
      Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition),
    );
    setSpeechOutputAvailable(
      "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
    );

    void checkLegalResearchAvailability()
      .then((available) => {
        if (active) setResearchAvailability(available ? "available" : "unavailable");
      })
      .catch(() => {
        if (active) setResearchAvailability("error");
      });

    return () => {
      active = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (voiceInputEnabled) return;
    recognitionRef.current?.abort();
    setIsListening(false);
  }, [voiceInputEnabled]);

  useEffect(() => {
    if (answerSpeechEnabled) return;
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
  }, [answerSpeechEnabled]);

  const needsCloudConsent = preference === "cloud" || preference === "hybrid";

  function startVoiceInput() {
    if (!voiceInputEnabled) return;
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    try {
      const recognition = new Recognition();
      recognition.lang = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (transcript) {
          onDraftChange([draft.trim(), transcript].filter(Boolean).join(" "));
          setErrorMessage("");
        }
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        setErrorMessage(`Voice input failed (${event.error}). You can type your question instead.`);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setErrorMessage("");
    } catch (error) {
      setIsListening(false);
      const detail = error instanceof Error ? error.message : "The microphone could not start.";
      setErrorMessage(detail);
    }
  }

  function toggleAnswerSpeech(message: Extract<QaMessage, { role: "assistant" }>) {
    if (!answerSpeechEnabled || !speechOutputAvailable) return;
    if (speakingMessageId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-US";
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setErrorMessage("The browser could not read this answer aloud.");
    };
    setSpeakingMessageId(message.id);
    window.speechSynthesis.speak(utterance);
  }

  function selectCitationSource(sourceIndex: number | null | undefined, excerpt: string) {
    if (sourceIndex !== null && sourceIndex !== undefined) onSelectPage(sourceIndex, excerpt);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || isSending) return;
    if (!pages.some((page) => page.trim())) {
      setErrorMessage(t("qa_error_no_text"));
      return;
    }
    if (!preference) {
      setErrorMessage(t("qa_error_mode"));
      return;
    }
    if (needsCloudConsent && !cloudConsent) {
      setErrorMessage(t("qa_error_cloud_consent"));
      return;
    }
    if (
      researchEnabled &&
      (!researchConsent ||
        researchAvailability !== "available" ||
        question.length > 300 ||
        !/^[A-Za-z]{2}$/.test(country.trim()) ||
        jurisdiction.trim().length < 2 ||
        jurisdiction.trim().length > 150)
    ) {
      setErrorMessage(t("qa_error_research"));
      return;
    }

    const userMessage: QaMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    setIsSending(true);
    setErrorMessage("");

    try {
      const researchSources = researchEnabled
        ? await searchLegalSources({
            data: {
              consent: true,
              question,
              jurisdiction: jurisdiction.trim(),
              country: country.trim().toUpperCase(),
            },
          })
        : [];
      const answer = await answerDocumentQuestion(question, pages, preference, {
        history,
        researchSources,
        format,
        sourceLocations,
        paginationVerified,
        onInference: onModelResponse,
        ...(aiProvider !== undefined ? { aiProvider } : {}),
      });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer.answer,
          citations: answer.citations,
          hypotheses: answer.hypotheses,
          unresolvedQuestions: answer.unresolvedQuestions,
          researchSources: answer.researchSources,
          citedResearchSourceIds: answer.citedResearchSourceIds,
          researchAttempted: researchEnabled,
          engine: answer.engine,
          inferenceSource: answer.inferenceSource,
        },
      ]);
      onDraftChange("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(
        preference === "local" && /input is too large/i.test(detail)
          ? "The on-device model rejected this request as too large. Try a shorter question or choose Cloud AI in Processing & privacy and explicitly enable cloud consent. No cloud fallback was used."
          : `The question could not be answered. ${detail}`,
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="pm-panel pm-qa-panel" aria-labelledby="pm-qa-title">
      <div className="pm-panel-heading pm-qa-heading">
        <div>
          <h2 id="pm-qa-title">{t("qa_title")}</h2>
          <p>{t("qa_subtitle")}</p>
        </div>
        <span className="pm-qa-document" title={documentName}>
          <FileText size={14} /> {t("qa_document_grounded")}
        </span>
      </div>
      <div className="pm-qa-privacy">
        <p>{t("qa_privacy_note")}</p>
        {needsCloudConsent && !cloudConsent && (
          <button type="button" className="pm-text-button" onClick={onOpenProcessing}>
            {t("qa_review_consent")}
          </button>
        )}
      </div>
      {!preference && (
        <p className="pm-qa-mode-note">
          {t("qa_mode_note")}
          <button type="button" className="pm-text-button" onClick={onOpenProcessing}>
            {t("qa_choose_mode")}
          </button>
        </p>
      )}

      {/* ── Suggested questions ── */}
      <SuggestedQuestions
        onSelect={(q) => {
          onDraftChange(q);
          setErrorMessage("");
        }}
        disabled={isSending}
      />

      <div
        className="pm-qa-messages"
        role="log"
        aria-label={t("qa_answer_region")}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <div className="pm-qa-empty">
            <strong>{t("qa_empty_title")}</strong>
            <span>{t("qa_empty_detail")}</span>
          </div>
        ) : (
          messages.map((message) => (
            <article className={`pm-qa-message pm-qa-message--${message.role}`} key={message.id}>
              <div className="pm-qa-message-head">
                <strong>
                  {message.role === "user" ? t("qa_role_user") : t("qa_role_assistant")}
                </strong>
                {message.role === "assistant" && (
                  <>
                    <span>
                      {message.engine} · {t("inference_processing_source")}{" "}
                      {t(message.inferenceSource === "ON_DEVICE" ? "mode_on_device" : "mode_cloud")}
                    </span>
                    {answerSpeechEnabled && (
                      <button
                        type="button"
                        className="pm-icon-button pm-qa-speak"
                        onClick={() => toggleAnswerSpeech(message)}
                        disabled={!speechOutputAvailable}
                        aria-label={
                          speakingMessageId === message.id ? t("qa_speak_stop") : t("qa_speak_read")
                        }
                        title={
                          speakingMessageId === message.id ? t("qa_speak_stop") : t("qa_speak_read")
                        }
                      >
                        {speakingMessageId === message.id ? (
                          <VolumeX size={15} />
                        ) : (
                          <Volume2 size={15} />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
              <p>{message.content}</p>
              {message.role === "assistant" && message.hypotheses.length > 0 && (
                <div className="pm-qa-followup-list">
                  <strong>{t("qa_hypotheses")}</strong>
                  <ul>
                    {message.hypotheses.map((hypothesis, index) => (
                      <li key={`${message.id}-hypothesis-${index}`}>{hypothesis}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.role === "assistant" && message.unresolvedQuestions.length > 0 && (
                <div className="pm-qa-followup-list">
                  <strong>{t("qa_unresolved")}</strong>
                  <ul>
                    {message.unresolvedQuestions.map((question, index) => (
                      <li key={`${message.id}-unresolved-${index}`}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.role === "assistant" && message.citations.length > 0 && (
                <div className="pm-qa-citations" aria-label={t("qa_citations_title")}>
                  <strong>{t("qa_citations_title")}</strong>
                  {message.citations.map((citation, index) => (
                    <div className="pm-qa-citation" key={`${message.id}-citation-${index}`}>
                      {citation.sourceIndex ? (
                        <button
                          type="button"
                          className="pm-page-link"
                          onClick={() =>
                            selectCitationSource(citation.sourceIndex, citation.excerpt)
                          }
                        >
                          {citation.page !== null
                            ? `Page ${citation.page}`
                            : (citation.sourceLocation ?? `Source section ${citation.sourceIndex}`)}
                        </button>
                      ) : (
                        <span className="pm-muted-label">{t("qa_page_unavailable")}</span>
                      )}
                      <blockquote>{citation.excerpt}</blockquote>
                      <span className={citation.verified ? "is-verified" : "is-unverified"}>
                        {citation.verified
                          ? t("qa_citation_verified")
                          : t("qa_citation_unverified")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {message.role === "assistant" && message.researchSources.length > 0 && (
                <div className="pm-qa-research-sources" aria-label={t("qa_research_title")}>
                  <strong>{t("qa_research_title")}</strong>
                  {message.researchSources.map((source) => (
                    <article key={`${message.id}-${source.id}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title} <ExternalLink size={12} />
                      </a>
                      <span>
                        {message.citedResearchSourceIds.includes(source.id)
                          ? t("qa_research_cited")
                          : t("qa_research_not_cited")}
                      </span>
                      <span>{source.publishedDate ?? t("qa_research_no_date")}</span>
                      {source.description && <p>{source.description}</p>}
                    </article>
                  ))}
                </div>
              )}
              {message.role === "assistant" &&
                message.researchAttempted &&
                message.researchSources.length === 0 && (
                  <p className="pm-qa-mic-note">{t("qa_research_no_sources")}</p>
                )}
            </article>
          ))
        )}
        {isSending && (
          <div className="pm-qa-pending" role="status">
            <LoaderCircle size={16} className="pm-qa-spinner" />
            <span>{researchEnabled ? t("qa_sending_research") : t("qa_sending_document")}</span>
          </div>
        )}
      </div>

      {researchAvailability === "error" && (
        <p className="pm-qa-inline-error" role="status">
          {t("qa_research_error_msg")}
        </p>
      )}
      {researchEnabled && (
        <div className="pm-qa-research-fields">
          <label htmlFor="pm-qa-jurisdiction">{t("qa_jurisdiction_label")}</label>
          <input
            id="pm-qa-jurisdiction"
            value={jurisdiction}
            maxLength={180}
            onChange={(event) => setJurisdiction(event.currentTarget.value)}
            placeholder={t("qa_jurisdiction_placeholder")}
            disabled={isSending}
          />
          <label htmlFor="pm-qa-country">{t("qa_country_label")}</label>
          <input
            id="pm-qa-country"
            value={country}
            maxLength={2}
            onChange={(event) => setCountry(event.currentTarget.value.toUpperCase())}
            placeholder={t("qa_country_placeholder")}
            disabled={isSending}
          />
          <p>{t("qa_research_privacy1")}</p>
          <p>{t("qa_research_privacy2")}</p>
          <label className="pm-qa-research-consent">
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(event) => setResearchConsent(event.currentTarget.checked)}
              disabled={isSending || researchAvailability !== "available"}
            />
            <span>{t("qa_research_consent")}</span>
          </label>
        </div>
      )}

      {errorMessage && (
        <p className="pm-qa-inline-error" role="alert">
          {errorMessage}
        </p>
      )}

      <form className="pm-qa-composer" onSubmit={(event) => void submitQuestion(event)}>
        <label className="pm-sr-only" htmlFor="pm-qa-question">
          {t("qa_composer_aria")}
        </label>
        <textarea
          id="pm-qa-question"
          value={draft}
          onChange={(event) => {
            onDraftChange(event.currentTarget.value);
            setErrorMessage("");
          }}
          placeholder={t("qa_composer_placeholder")}
          rows={3}
          maxLength={1500}
          disabled={isSending}
        />
        <div className="pm-qa-compose-tools">
          <div className="pm-qa-compose-options">
            {voiceInputEnabled && (
              <>
                <button
                  type="button"
                  className={`pm-button pm-button--outline${isListening ? " is-listening" : ""}`}
                  onClick={startVoiceInput}
                  disabled={!speechInputAvailable || isSending}
                  aria-pressed={isListening}
                  title={speechInputAvailable ? t("qa_voice_title") : t("qa_voice_unsupported")}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  {isListening ? t("qa_voice_stop") : t("qa_voice_use")}
                </button>
                {speechInputAvailable && (
                  <span className="pm-qa-mic-note">{t("qa_voice_note")}</span>
                )}
              </>
            )}
          </div>
          <button
            type="submit"
            className="pm-button pm-button--primary"
            disabled={isSending || !draft.trim()}
          >
            {isSending ? <LoaderCircle size={15} className="pm-qa-spinner" /> : <Send size={15} />}
            {t("qa_send")}
          </button>
        </div>
        <div className="pm-qa-research-toggle">
          <label>
            <input
              type="checkbox"
              checked={researchEnabled}
              onChange={(event) => {
                setResearchEnabled(event.currentTarget.checked);
                setResearchConsent(false);
                setErrorMessage("");
              }}
              disabled={isSending || researchAvailability !== "available"}
            />
            <span>{t("qa_research_toggle")}</span>
          </label>
          <span>
            {researchAvailability === "checking"
              ? t("qa_research_checking")
              : researchAvailability === "available"
                ? t("qa_research_available")
                : researchAvailability === "unavailable"
                  ? t("qa_research_unavailable")
                  : t("qa_research_error_status")}
          </span>
        </div>
        {voiceInputEnabled && !speechInputAvailable && (
          <p className="pm-qa-mic-note">{t("qa_voice_unavailable")}</p>
        )}
        {answerSpeechEnabled && !speechOutputAvailable && (
          <p className="pm-qa-mic-note">{t("qa_voice_output_unavailable")}</p>
        )}
      </form>

      {format === "pdf" && !paginationVerified && (
        <p className="pm-qa-pagination-note">{t("qa_pagination_note")}</p>
      )}
    </section>
  );
}
