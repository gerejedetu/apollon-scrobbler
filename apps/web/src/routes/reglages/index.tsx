import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { SettingsPage } from "../../features/apollon/index.ts";
import { keysOf } from "../../features/tokens/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

/** Settings: profile, appearance, API keys, instance, import, sign-out. */
export const Route = createFileRoute("/reglages/")({
  loader: async ({ context }) => {
    const [keys, instance] = await Promise.all([
      api.tokens.list().then(keysOf),
      context.me.owner ? api.instance.get().catch(() => null) : Promise.resolve(null),
    ]);
    return { keys, instance };
  },
  head: () => ({ meta: [{ title: pageTitle(m.nav_settings()) }] }),
  component: () => {
    const { keys, instance } = Route.useLoaderData();
    return <SettingsPage me={Route.useRouteContext().me} keys={keys} instance={instance} />;
  },
});
