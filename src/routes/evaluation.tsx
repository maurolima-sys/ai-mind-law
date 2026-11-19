import { createFileRoute, notFound } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/services/supabase";

export const Route = createFileRoute("/evaluation")({
  head: () => ({ meta: [{ title: "Evaluation — PocketMind AI" }] }),
  beforeLoad: async () => {
    // Guard: only accessible in the browser with a valid Supabase session.
    // Redirects to /login when authenticated but no session — not yet implemented
    // as a full collaborative workspace. Returns 404 on the server (SSR).
    if (typeof window === "undefined") throw notFound();
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) throw notFound();
  },
  component: EvaluationPage,
});

function EvaluationPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Evaluation workspace</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Collaborative features are not yet implemented. This area is reserved for future team and project functionality.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
