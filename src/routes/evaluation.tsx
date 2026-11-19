import { useEffect, useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { EvaluationWorkspace } from "@/components/pocketmind/EvaluationWorkspace";
import { evaluationEnabled } from "@/lib/evaluation";

export const Route = createFileRoute("/evaluation")({
  head: () => ({ meta: [{ title: "Evaluation — PocketMind AI" }] }),
  beforeLoad: () => {
    // Only block on the client — server must render the HTML shell.
    if (
      typeof window !== "undefined" &&
      !evaluationEnabled(import.meta.env["VITE_ENABLE_EVALUATION_DASHBOARD"], import.meta.env.DEV)
    )
      throw notFound();
  },
  component: EvaluationPage,
});

function EvaluationPage() {
  const { user, loading, error, signOut } = useAuth();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState("");
  const [signOutPending, setSignOutPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

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

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );

  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {error ?? "Redirecting to sign in…"}
        </p>
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
