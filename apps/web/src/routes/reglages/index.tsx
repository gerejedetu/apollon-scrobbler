import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettings } from "../../features/settings/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/")({
  head: () => ({ meta: [{ title: pageTitle(m.nav_settings()) }] }),
  component: () => <ProfileSettings me={Route.useRouteContext().me} />,
});
