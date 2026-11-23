import { createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { InstanceSection } from "../../features/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

/** The instance's own settings: its owner only. */
export const Route = createFileRoute("/reglages/instance")({
  beforeLoad: ({ context }) => {
    if (!context.me.owner) throw redirect({ to: "/reglages/profil", replace: true });
  },
  loader: () => api.instance.get(),
  head: () => ({ meta: [{ title: pageTitle(m.ds_instance(), m.nav_settings()) }] }),
  component: () => (
    <InstanceSection me={Route.useRouteContext().me} instance={Route.useLoaderData()} />
  ),
});
