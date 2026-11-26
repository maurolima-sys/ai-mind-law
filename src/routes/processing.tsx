import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Processing — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="processing" />,
});
