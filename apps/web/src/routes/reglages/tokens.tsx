import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { keysOf, TokensPage } from "../../features/tokens/index.ts";

export const Route = createFileRoute("/reglages/tokens")({
  loader: async () => keysOf(await api.tokens.list()),
  head: () => ({ meta: [{ title: "Tokens d'API · Needle" }] }),
  component: () => <TokensPage keys={Route.useLoaderData()} />,
});
