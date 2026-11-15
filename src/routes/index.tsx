import { createFileRoute } from "@tanstack/react-router";

import { PocketMindApp } from "@/components/pocketmind/PocketMindApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PocketMind AI — Tender intelligence" },
      {
        name: "description",
        content:
          "Review procurement tenders with source-linked findings and clear processing controls.",
      },
    ],
  }),
  component: PocketMindApp,
});
