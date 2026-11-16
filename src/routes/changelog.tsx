import { createFileRoute, Link } from "@tanstack/react-router";
import { ChangelogPage } from "@/components/pocketmind/ChangelogPage";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — PocketMind AI" },
      {
        name: "description",
        content: "Release history for PocketMind AI — every version, what changed, and when.",
      },
    ],
  }),
  component: ChangelogPage,
});
