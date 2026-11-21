import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader, MobileTabBar } from "../../../features/navigation/index.ts";
import { Page } from "../../../ui/layout/index.ts";

/** A user's pages (library, history, stats) share the app header; the viewer may be anyone. */
export const Route = createFileRoute("/u/$userName")({
  component: UserPages,
});

function UserPages() {
  const { viewer } = Route.useRouteContext();
  return (
    <Page
      header={<AppHeader userName={viewer?.userName ?? null} />}
      tabBar={viewer ? <MobileTabBar userName={viewer.userName} /> : undefined}
    >
      <Outlet />
    </Page>
  );
}
