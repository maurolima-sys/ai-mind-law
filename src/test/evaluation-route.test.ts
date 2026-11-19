import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/services/supabase", () => ({
  getSupabase: () => ({ auth: { getSession } }),
}));

import { Route } from "@/routes/evaluation";

const guard = Route.options.beforeLoad!;
const context = {} as NonNullable<Parameters<typeof guard>[0]>;

afterEach(() => {
  vi.unstubAllEnvs();
  getSession.mockReset();
});

describe("evaluation route guard", () => {
  it("blocks a disabled route without querying authentication", async () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "false");
    await expect(guard(context)).rejects.toMatchObject({ isNotFound: true });
    expect(getSession).not.toHaveBeenCalled();
  });

  it("requires a session when enabled", async () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "true");
    getSession.mockResolvedValueOnce({ data: { session: null } });
    await expect(guard(context)).rejects.toMatchObject({ isNotFound: true });
    getSession.mockResolvedValueOnce({ data: { session: { user: { id: "test" } } } });
    await expect(guard(context)).resolves.toBeUndefined();
  });
});
