import { createFileRoute, redirect } from "@tanstack/react-router";

/** API keys now live on the settings page. */
export const Route = createFileRoute("/reglages/tokens")({
  beforeLoad: () => {
    throw redirect({ to: "/reglages", hash: "cles", replace: true });
  },
});
