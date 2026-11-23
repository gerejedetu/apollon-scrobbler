import { createFileRoute } from "@tanstack/react-router";
import { requireViewer } from "../auth/index.ts";
import { ScrobblePage } from "../features/scrobble/index.ts";
import { Shell } from "../features/shell/index.ts";
import { Page } from "../ui/apollon/index.ts";
import { m } from "../paraglide/messages.js";
import { pageTitle } from "../ui/brand/index.ts";

/** Add a listen by hand. */
export const Route = createFileRoute("/scrobbler")({
  beforeLoad: ({ context, location }) => ({ me: requireViewer(context.viewer, location.href) }),
  head: () => ({ meta: [{ title: pageTitle(m.title_scrobble()) }] }),
  component: Scrobbler,
});

function Scrobbler() {
  const { me } = Route.useRouteContext();
  return (
    <Shell viewer={me} profile={{ userName: me.userName, accent: me.accent ?? null }}>
      <Page>
        <div className="ap-narrow ap-stack">
          <ScrobblePage userName={me.userName} />
        </div>
      </Page>
    </Shell>
  );
}
