import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="settings" />,
});
