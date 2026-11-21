import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { keysOf, TokensPage } from "../../features/tokens/index.ts";
import { m } from "../../paraglide/messages.js";

export const Route = createFileRoute("/reglages/tokens")({
  loader: async () => keysOf(await api.tokens.list()),
  head: () => ({ meta: [{ title: `${m.settings_tokens()} · Needle` }] }),
  component: () => <TokensPage keys={Route.useLoaderData()} />,
});
