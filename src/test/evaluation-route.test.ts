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
  vi.unstubAllGlobals();
  getSession.mockReset();
});

describe("evaluation route guard", () => {
  it("blocks a disabled route on the client without querying authentication", () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "false");
    expect(() => guard(context)).toThrow();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("allows an enabled route on the client without querying authentication", () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "true");
    expect(() => guard(context)).not.toThrow();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("allows the enabled route to render a public shell on the server", () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "true");
    vi.stubGlobal("window", undefined);
    expect(() => guard(context)).not.toThrow();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("allows the disabled route to render a shell on the server — client will block", () => {
    vi.stubEnv("VITE_ENABLE_EVALUATION_DASHBOARD", "false");
    vi.stubGlobal("window", undefined);
    // Server has no window; flag check is skipped. Client-side beforeLoad blocks.
    expect(() => guard(context)).not.toThrow();
    expect(getSession).not.toHaveBeenCalled();
  });
});
