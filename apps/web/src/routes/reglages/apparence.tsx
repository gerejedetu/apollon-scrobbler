import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSection } from "../../features/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/apparence")({
  head: () => ({ meta: [{ title: pageTitle(m.ds_appearance(), m.nav_settings()) }] }),
  component: () => <AppearanceSection me={Route.useRouteContext().me} />,
});
