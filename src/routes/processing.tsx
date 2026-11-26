import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Processing — PocketMind AI" }] }),
  validateSearch: z.object({ doc: z.string().optional() }),
  component: ProcessingRoute,
});

function ProcessingRoute() {
  const { doc } = Route.useSearch();
  return <PocketMindApp initialScreen="processing" {...(doc ? { initialDocumentId: doc } : {})} />;
}
