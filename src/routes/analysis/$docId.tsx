import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/analysis/$docId")({
  head: () => ({
    meta: [{ title: "Document analysis — PocketMind AI" }],
  }),
  component: DocumentAnalysisRoute,
});

function DocumentAnalysisRoute() {
  const { docId } = Route.useParams();

  return <PocketMindApp key={docId} initialScreen="analysis" initialDocumentId={docId} />;
}
