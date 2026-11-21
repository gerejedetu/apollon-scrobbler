import { createFileRoute } from "@tanstack/react-router";
import { requireViewer } from "../auth/index.ts";
import { AppHeader, MobileTabBar } from "../features/navigation/index.ts";
import { ScrobblePage } from "../features/scrobble/index.ts";
import { Main, Page } from "../ui/layout/index.ts";
import { m } from "../paraglide/messages.js";

export const Route = createFileRoute("/scrobbler")({
  beforeLoad: ({ context, location }) => ({ me: requireViewer(context.viewer, location.href) }),
  head: () => ({ meta: [{ title: `${m.title_scrobble()} · Needle` }] }),
  component: Scrobbler,
});

function Scrobbler() {
  const { me } = Route.useRouteContext();
  return (
    <Page
      header={<AppHeader userName={me.userName} />}
      tabBar={<MobileTabBar userName={me.userName} />}
    >
      <Main narrow={560} gap={28} padding="32px 24px 72px">
        <ScrobblePage userName={me.userName} />
      </Main>
    </Page>
  );
}
