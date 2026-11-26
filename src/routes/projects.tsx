import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — PocketMind AI" }] }),
  component: () => <PocketMindApp initialScreen="projects" />,
});
