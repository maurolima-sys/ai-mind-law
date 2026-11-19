import { createFileRoute, notFound } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/services/supabase";
import { EvaluationWorkspace } from "@/components/pocketmind/EvaluationWorkspace";
import { evaluationEnabled } from "@/lib/evaluation";

export const Route = createFileRoute("/evaluation")({
  head: () => ({ meta: [{ title: "Evaluation — PocketMind AI" }] }),
  ssr: evaluationEnabled(import.meta.env["VITE_ENABLE_EVALUATION_DASHBOARD"], import.meta.env.DEV)
    ? false
    : true,
  beforeLoad: async () => {
    if (
      !evaluationEnabled(import.meta.env["VITE_ENABLE_EVALUATION_DASHBOARD"], import.meta.env.DEV)
    )
      throw notFound();
    if (typeof window === "undefined") throw notFound();
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) throw notFound();
  },
  component: EvaluationPage,
});

function EvaluationPage() {
  const { user, signOut } = useAuth();
  if (!user) return <p className="p-6">Sign in to access the evaluation workspace.</p>;
  return (
    <EvaluationWorkspace
      key={user.id}
      userId={user.id}
      email={user.email}
      onSignOut={() => void signOut()}
    />
  );
}
