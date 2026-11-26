import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrations — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="integrations" />,
});
