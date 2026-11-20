import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettings } from "../../features/settings/index.ts";

export const Route = createFileRoute("/reglages/")({
  head: () => ({ meta: [{ title: "Réglages · Needle" }] }),
  component: () => <ProfileSettings me={Route.useRouteContext().me} />,
});
