import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireViewer } from "../../auth/index.ts";
import { Shell } from "../../features/shell/index.ts";

/** Settings need a signed-in account; they sit in the frame with the viewer's own colour. */
export const Route = createFileRoute("/reglages")({
  beforeLoad: ({ context, location }) => ({ me: requireViewer(context.viewer, location.href) }),
  component: Settings,
});

function Settings() {
  const { me } = Route.useRouteContext();
  return (
    <Shell viewer={me} profile={{ userName: me.userName, accent: me.accent ?? null }}>
      <Outlet />
    </Shell>
  );
}
