import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireViewer } from "../../auth/index.ts";
import { SettingsLayout } from "../../features/settings/index.ts";

/** Settings need a signed-in account. */
export const Route = createFileRoute("/reglages")({
  beforeLoad: ({ context, location }) => ({ me: requireViewer(context.viewer, location.href) }),
  component: Settings,
});

function Settings() {
  const { me } = Route.useRouteContext();
  return (
    <SettingsLayout userName={me.userName}>
      <Outlet />
    </SettingsLayout>
  );
}
