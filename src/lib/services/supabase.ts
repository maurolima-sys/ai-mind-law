import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase client is only available in the browser");
  }
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
    if (!url || !key)
      throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY.");
    _client = createClient(url, key);
  }
  return _client;
}

/** Returns true only when both env vars are present (build-time check). */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
  return Boolean(url && key);
}
