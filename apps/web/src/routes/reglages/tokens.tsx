import { createFileRoute, redirect } from "@tanstack/react-router";

/** The former address of the API keys. */
export const Route = createFileRoute("/reglages/tokens")({
  beforeLoad: () => {
    throw redirect({ to: "/reglages/cles", replace: true });
  },
});
