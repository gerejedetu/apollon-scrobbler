import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";
import { NotFound, RouteError } from "./features/errors/index.ts";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    // Hovering links preloads their data: keep it (and visited pages) for a while instead of asking again.
    defaultPreloadStaleTime: 120_000,
    defaultStaleTime: 60_000,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
