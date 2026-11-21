import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettings } from "../../features/settings/index.ts";
import { m } from "../../paraglide/messages.js";

export const Route = createFileRoute("/reglages/")({
  head: () => ({ meta: [{ title: `${m.nav_settings()} · Needle` }] }),
  component: () => <ProfileSettings me={Route.useRouteContext().me} />,
});
