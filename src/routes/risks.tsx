import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Risks — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="risks" />,
});
