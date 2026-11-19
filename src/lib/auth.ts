import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/services/supabase";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
        error: null,
      });
    });
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false, error: null });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    setState((s) => ({ ...s, loading: false, error: error?.message ?? null }));
    return !error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { error } = await getSupabase().auth.signUp({ email, password });
    setState((s) => ({ ...s, loading: false, error: error?.message ?? null }));
    return !error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/evaluation` },
    });
    if (error) setState((s) => ({ ...s, error: error.message }));
  }, []);

  const signOut = useCallback(async () => {
    return getSupabase().auth.signOut();
  }, []);

  return { ...state, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut };
}
