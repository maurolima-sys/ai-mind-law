import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="library" />,
});
