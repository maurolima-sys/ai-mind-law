import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("@/lib/services/supabase", () => ({
  getSupabase: () => ({ auth: { signOut, getSession, onAuthStateChange } }),
}));

import { Route } from "@/routes/evaluation";

function renderRoute() {
  const root = createRootRoute({ component: Outlet });
  const evaluation = createRoute({
    getParentRoute: () => root,
    path: "/evaluation",
    component: Route.options.component,
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <h1>Home page</h1>,
  });
  const login = createRoute({
    getParentRoute: () => root,
    path: "/login",
    component: () => <h1>Login page</h1>,
  });
  const history = createMemoryHistory({ initialEntries: ["/evaluation#overview"] });
  const router = createRouter({ routeTree: root.addChildren([evaluation, home, login]), history });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: { user: { id: "test-user" } } } });
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("evaluation logout", () => {
  it("redirects an unauthenticated hydrated page to login", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    renderRoute();
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(screen.queryByText("Evaluation sections")).not.toBeInTheDocument();
  });

  it("waits for sign out, then replaces the evaluation URL with home", async () => {
    let finishSignOut!: (result: { error: null }) => void;
    signOut.mockReturnValue(new Promise((resolve) => (finishSignOut = resolve)));
    const router = renderRoute();

    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("button", { name: "Signing out…" })).toBeDisabled();
    expect(router.state.location.pathname).toBe("/evaluation");
    expect(router.state.location.hash).toBe("overview");

    act(() => onAuthStateChange.mock.calls[0][0]("SIGNED_OUT", null));
    await act(async () => finishSignOut({ error: null }));
    expect(await screen.findByRole("heading", { name: "Home page" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.hash).toBe("");
    expect(router.history.length).toBe(1);
  });

  it.each([
    ["returned error", () => signOut.mockResolvedValue({ error: new Error("failed") })],
    ["rejected request", () => signOut.mockRejectedValue(new Error("failed"))],
  ])("stays on the workspace and reports a %s", async (_case, configure) => {
    configure();
    const router = renderRoute();
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out");
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled());
    expect(router.state.location.pathname).toBe("/evaluation");
    expect(router.state.location.hash).toBe("overview");
  });
});
