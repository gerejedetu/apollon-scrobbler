import { createFileRoute } from "@tanstack/react-router";
import { ProfileSection } from "../../features/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/profil")({
  head: () => ({ meta: [{ title: pageTitle(m.tab_profile(), m.nav_settings()) }] }),
  component: () => <ProfileSection me={Route.useRouteContext().me} />,
});
