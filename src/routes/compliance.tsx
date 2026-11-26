import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance matrix — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="compliance" />,
});
