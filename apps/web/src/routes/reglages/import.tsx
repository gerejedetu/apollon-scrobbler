import { createFileRoute } from "@tanstack/react-router";
import { ImportSection } from "../../features/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/import")({
  head: () => ({ meta: [{ title: pageTitle(m.ds_import_export(), m.nav_settings()) }] }),
  component: () => <ImportSection me={Route.useRouteContext().me} />,
});
