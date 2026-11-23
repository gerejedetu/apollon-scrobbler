import { createFileRoute, redirect } from "@tanstack/react-router";

/** Settings open on their first section. */
export const Route = createFileRoute("/reglages/")({
  beforeLoad: () => {
    throw redirect({ to: "/reglages/profil", replace: true });
  },
});
