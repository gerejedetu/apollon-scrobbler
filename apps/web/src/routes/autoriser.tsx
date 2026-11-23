import { createFileRoute } from "@tanstack/react-router";
import { api, isNotFound } from "../api/index.ts";
import { requireViewer } from "../auth/index.ts";
import { ConsentPage } from "../features/oauth/index.ts";
import { m } from "../paraglide/messages.js";
import { pageTitle } from "../ui/brand/index.ts";

/** Consent page of the OAuth flow (Better Auth's `consentPage`): the signed query stays in the URL. */
export const Route = createFileRoute("/autoriser")({
  validateSearch: (search: Record<string, unknown>) => search,
  beforeLoad: ({ context, location }) => ({ me: requireViewer(context.viewer, location.href) }),
  loaderDeps: ({ search }) => ({
    clientId: typeof search.client_id === "string" ? search.client_id : "",
  }),
  loader: async ({ deps }) => {
    if (!deps.clientId) return { clientName: null };
    try {
      const client = await api.oauth.publicClient(deps.clientId);
      return { clientName: client.client_name ?? null };
    } catch (e) {
      if (isNotFound(e)) return { clientName: null };
      throw e;
    }
  },
  head: () => ({ meta: [{ title: pageTitle(m.title_consent()) }] }),
  component: Consent,
});

function Consent() {
  const { clientName } = Route.useLoaderData();
  const { me } = Route.useRouteContext();
  return <ConsentPage clientName={clientName} userName={me.userName} />;
}
