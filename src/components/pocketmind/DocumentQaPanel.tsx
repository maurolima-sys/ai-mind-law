import {
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
import type { ChatCitation, InferencePreference } from "@/lib/types";

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

export function DocumentQaPanel({
  documentName,
  pages,
  preference,
  cloudConsent,
  paginationVerified,
  onOpenProcessing,
  onSelectPage,
  onModelResponse,
}: {
  documentName: string;
  pages: string[];
  preference: InferencePreference | null;
  cloudConsent: boolean;
  paginationVerified: boolean;
  onOpenProcessing: () => void;
  onSelectPage: (page: number) => void;
  onModelResponse: () => void;
}) {
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [draft, setDraft] = useState("");
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

  const needsCloudConsent = preference === "cloud" || preference === "hybrid";
  const canSend =
    Boolean(preference) &&
    pages.some((page) => page.trim()) &&
    (!needsCloudConsent || cloudConsent) &&
    (!researchEnabled ||
      (researchAvailability === "available" &&
        researchConsent &&
        draft.trim().length <= 300 &&
        /^[A-Za-z]{2}$/.test(country.trim()) &&
        jurisdiction.trim().length >= 2 &&
        jurisdiction.trim().length <= 150));

  function startVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    try {
      const recognition = new Recognition();
      recognition.lang = navigator.language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (transcript) {
          setDraft((current) => [current.trim(), transcript].filter(Boolean).join(" "));
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
    if (!speechOutputAvailable) return;
    if (speakingMessageId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = navigator.language;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setErrorMessage("The browser could not read this answer aloud.");
    };
    setSpeakingMessageId(message.id);
    window.speechSynthesis.speak(utterance);
  }

  function selectCitationPage(page: number | null) {
    if (page !== null) onSelectPage(page);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || isSending) return;
    if (!preference) {
      setErrorMessage("Choose an AI processing mode before asking a question.");
      return;
    }
    if (needsCloudConsent && !cloudConsent) {
      setErrorMessage("Enable cloud consent in Processing & privacy, or choose on-device only.");
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
      setErrorMessage("Complete the external-research consent and jurisdiction fields first.");
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
        paginationVerified,
        onInference: onModelResponse,
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
        },
      ]);
      setDraft("");
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
          <h2 id="pm-qa-title">Ask this document</h2>
          <p>Ask follow-up questions and review every answer against its sources.</p>
        </div>
        <span className="pm-qa-document" title={documentName}>
          <FileText size={14} /> Document-grounded
        </span>
      </div>

      <div className="pm-qa-privacy">
        <p>
          Questions use the selected AI mode. Cloud and hybrid fallback require your existing
          Firebase consent. The PDF is never sent to Firecrawl.
        </p>
        {needsCloudConsent && !cloudConsent && (
          <button type="button" className="pm-text-button" onClick={onOpenProcessing}>
            Review cloud consent
          </button>
        )}
      </div>
      {!preference && (
        <p className="pm-qa-mode-note">
          Choose on-device, cloud, or hybrid processing before asking. The prepared sample is
          illustrative and is not a real tender.
          <button type="button" className="pm-text-button" onClick={onOpenProcessing}>
            Choose a mode
          </button>
        </p>
      )}

      {messages.length === 0 ? (
        <div className="pm-qa-empty">
          <strong>Start with a question about a requirement, rule, or missing detail.</strong>
          <span>
            Answers separate what the PDF says from working hypotheses and questions that still need
            verification.
          </span>
        </div>
      ) : (
        <div className="pm-qa-messages" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <article className={`pm-qa-message pm-qa-message--${message.role}`} key={message.id}>
              <div className="pm-qa-message-head">
                <strong>{message.role === "user" ? "You" : "PocketMind"}</strong>
                {message.role === "assistant" && (
                  <>
                    <span>{message.engine}</span>
                    <button
                      type="button"
                      className="pm-icon-button pm-qa-speak"
                      onClick={() => toggleAnswerSpeech(message)}
                      disabled={!speechOutputAvailable}
                      aria-label={
                        speakingMessageId === message.id
                          ? "Stop reading answer"
                          : "Read answer aloud"
                      }
                      title={
                        speakingMessageId === message.id ? "Stop reading" : "Read answer aloud"
                      }
                    >
                      {speakingMessageId === message.id ? (
                        <VolumeX size={15} />
                      ) : (
                        <Volume2 size={15} />
                      )}
                    </button>
                  </>
                )}
              </div>
              <p>{message.content}</p>
              {message.role === "assistant" && message.hypotheses.length > 0 && (
                <div className="pm-qa-followup-list">
                  <strong>Working hypotheses</strong>
                  <ul>
                    {message.hypotheses.map((hypothesis, index) => (
                      <li key={`${message.id}-hypothesis-${index}`}>{hypothesis}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.role === "assistant" && message.unresolvedQuestions.length > 0 && (
                <div className="pm-qa-followup-list">
                  <strong>Still to verify</strong>
                  <ul>
                    {message.unresolvedQuestions.map((question, index) => (
                      <li key={`${message.id}-unresolved-${index}`}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.role === "assistant" && message.citations.length > 0 && (
                <div className="pm-qa-citations" aria-label="Document citations">
                  <strong>Document evidence</strong>
                  {message.citations.map((citation, index) => (
                    <div className="pm-qa-citation" key={`${message.id}-citation-${index}`}>
                      {citation.page !== null ? (
                        <button
                          type="button"
                          className="pm-page-link"
                          onClick={() => selectCitationPage(citation.page)}
                        >
                          Page {citation.page}
                        </button>
                      ) : (
                        <span className="pm-muted-label">Page reference unavailable</span>
                      )}
                      <blockquote>{citation.excerpt}</blockquote>
                      <span className={citation.verified ? "is-verified" : "is-unverified"}>
                        {citation.verified
                          ? "Verified in extracted text"
                          : "Verify against the PDF"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {message.role === "assistant" && message.researchSources.length > 0 && (
                <div className="pm-qa-research-sources" aria-label="External research sources">
                  <strong>Search results · verify authority and current status</strong>
                  {message.researchSources.map((source) => (
                    <article key={`${message.id}-${source.id}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title} <ExternalLink size={12} />
                      </a>
                      <span>
                        {message.citedResearchSourceIds.includes(source.id)
                          ? "Cited in answer"
                          : "Not cited in answer"}
                      </span>
                      <span>{source.publishedDate ?? "Publication date not provided"}</span>
                      {source.description && <p>{source.description}</p>}
                    </article>
                  ))}
                </div>
              )}
              {message.role === "assistant" &&
                message.researchAttempted &&
                message.researchSources.length === 0 && (
                  <p className="pm-qa-mic-note">
                    Firecrawl returned no sources; this answer uses the document only.
                  </p>
                )}
            </article>
          ))}
          {isSending && (
            <div className="pm-qa-pending" role="status">
              <LoaderCircle size={16} className="pm-qa-spinner" />
              <span>
                {researchEnabled
                  ? "Searching sources and preparing an evidence-based answer…"
                  : "Checking the document and preparing an answer…"}
              </span>
            </div>
          )}
        </div>
      )}

      {researchAvailability === "error" && (
        <p className="pm-qa-inline-error" role="status">
          External research availability could not be checked. Try reloading or ask from the
          document only.
        </p>
      )}
      {researchEnabled && (
        <div className="pm-qa-research-fields">
          <label htmlFor="pm-qa-jurisdiction">Research jurisdiction</label>
          <input
            id="pm-qa-jurisdiction"
            value={jurisdiction}
            maxLength={180}
            onChange={(event) => setJurisdiction(event.currentTarget.value)}
            placeholder="e.g. Brazil — State of Amazonas; Law 1,762/1986"
            disabled={isSending}
          />
          <label htmlFor="pm-qa-country">Country code</label>
          <input
            id="pm-qa-country"
            value={country}
            maxLength={2}
            onChange={(event) => setCountry(event.currentTarget.value.toUpperCase())}
            placeholder="BR"
            disabled={isSending}
          />
          <p>
            Only your question, country code, and jurisdiction are sent to Firecrawl; the PDF is
            not.
          </p>
          <p>
            External research accepts questions up to 300 characters and jurisdictions up to 150.
          </p>
          <label className="pm-qa-research-consent">
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(event) => setResearchConsent(event.currentTarget.checked)}
              disabled={isSending || researchAvailability !== "available"}
            />
            <span>
              I consent to sending this question, country code, and jurisdiction to Firecrawl for
              external research.
            </span>
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
          Ask a question about this document
        </label>
        <textarea
          id="pm-qa-question"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="Ask a question about this document…"
          rows={3}
          maxLength={1500}
          disabled={isSending}
        />
        <div className="pm-qa-compose-tools">
          <div className="pm-qa-compose-options">
            <button
              type="button"
              className={`pm-button pm-button--outline${isListening ? " is-listening" : ""}`}
              onClick={startVoiceInput}
              disabled={!speechInputAvailable || isSending}
              aria-pressed={isListening}
              title={
                speechInputAvailable
                  ? "Use voice to draft a question"
                  : "Voice input is not supported by this browser"
              }
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              {isListening ? "Stop listening" : "Use microphone"}
            </button>
            {speechInputAvailable && (
              <span className="pm-qa-mic-note">
                Your browser may use its own speech service. Nothing is sent to AI until you submit.
              </span>
            )}
          </div>
          <button
            type="submit"
            className="pm-button pm-button--primary"
            disabled={!canSend || isSending || !draft.trim()}
          >
            {isSending ? <LoaderCircle size={15} className="pm-qa-spinner" /> : <Send size={15} />}
            Send question
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
            <span>Include external research (Firecrawl)</span>
          </label>
          <span>
            {researchAvailability === "checking"
              ? "Checking availability…"
              : researchAvailability === "available"
                ? "Optional · requires separate consent"
                : researchAvailability === "unavailable"
                  ? "Not configured on the server"
                  : "Availability could not be checked"}
          </span>
        </div>
        {!speechInputAvailable && (
          <p className="pm-qa-mic-note">
            Voice input is unavailable in this browser; you can type.
          </p>
        )}
      </form>

      {!paginationVerified && (
        <p className="pm-qa-pagination-note">
          This document has no verified page mapping. Answers may quote extracted text, but page
          citations are withheld.
        </p>
      )}
    </section>
  );
}
