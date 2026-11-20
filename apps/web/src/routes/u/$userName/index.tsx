import { createFileRoute } from "@tanstack/react-router";
import type { Range } from "../../../api/index.ts";
import { loadProfile, ProfilePage } from "../../../features/profile/index.ts";
import { isRange } from "../../../lib/ranges.ts";

export const Route = createFileRoute("/u/$userName/")({
  validateSearch: (search: Record<string, unknown>): { periode?: Range } => ({
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "this_month" }),
  loader: ({ params, deps }) => loadProfile(params.userName, deps.range),
  head: ({ params }) => ({ meta: [{ title: `${params.userName} · Needle` }] }),
  component: Profile,
});

function Profile() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const { range } = Route.useLoaderDeps();
  const data = Route.useLoaderData();
  const me = viewer && viewer.userName.toLowerCase() === userName.toLowerCase() ? viewer : null;
  return (
    <ProfilePage userName={data.listens.userName || userName} data={data} me={me} range={range} />
  );
}
