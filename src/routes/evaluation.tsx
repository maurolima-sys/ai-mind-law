import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState("");
  const [signOutPending, setSignOutPending] = useState(false);

  async function handleSignOut() {
    setSignOutPending(true);
    setSignOutError("");
    try {
      const { error } = await signOut();
      if (error) throw error;
    } catch {
      setSignOutError("Could not sign out. Please try again.");
      setSignOutPending(false);
      return;
    }

    try {
      await navigate({ to: "/", hash: "", replace: true });
    } catch {
      setSignOutError("Signed out, but could not navigate home. Open the home page manually.");
      setSignOutPending(false);
    }
  }

  if (!user)
    return (
      <div className="p-6">
        {signOutError ? (
          <p role="alert">
            {signOutError} <a href="/">Home</a>
          </p>
        ) : (
          <p>Sign in to access the evaluation workspace.</p>
        )}
      </div>
    );
  return (
    <EvaluationWorkspace
      key={user.id}
      userId={user.id}
      email={user.email}
      onSignOut={() => void handleSignOut()}
      signOutError={signOutError}
      signOutPending={signOutPending}
    />
  );
}
