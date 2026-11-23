import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { KeysSection } from "../../features/apollon/index.ts";
import { keysOf } from "../../features/tokens/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/cles")({
  loader: async () => keysOf(await api.tokens.list()),
  head: () => ({ meta: [{ title: pageTitle(m.settings_tokens(), m.nav_settings()) }] }),
  component: () => <KeysSection me={Route.useRouteContext().me} keys={Route.useLoaderData()} />,
});
