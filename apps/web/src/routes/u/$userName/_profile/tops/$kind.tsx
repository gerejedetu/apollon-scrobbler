import { createFileRoute, notFound } from "@tanstack/react-router";
import { api, type Range } from "../../../../../api/index.ts";
import { ProfileHeader, ProfileTabs } from "../../../../../features/profile/index.ts";
import { isKind, KINDS, TOP_PAGE, TopsPage } from "../../../../../features/tops/index.ts";
import { isRange } from "../../../../../lib/ranges.ts";
import { utcOffset } from "../../../../../lib/timezone.ts";
import { Main } from "../../../../../ui/layout/index.ts";
import { m } from "../../../../../paraglide/messages.js";
import { pageTitle } from "../../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/_profile/tops/$kind")({
  validateSearch: (search: Record<string, unknown>): { periode?: Range } => ({
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "this_month" }),
  loader: async ({ params, deps }) => {
    if (!isKind(params.kind)) throw notFound();
    const [summary, top] = await Promise.all([
      api.stats.summary(params.userName, { range: "all_time", utcOffset: utcOffset() }),
      api.stats.top(params.userName, KINDS[params.kind].entity, {
        range: deps.range,
        limit: TOP_PAGE,
      }),
    ]);
    return { summary, top, kind: params.kind };
  },
  head: ({ params }) => ({
    meta: [
      {
        title: pageTitle(
          m.title_tops_of({
            kind: isKind(params.kind) ? KINDS[params.kind].title() : "Tops",
            user: params.userName,
          }),
        ),
      },
    ],
  }),
  component: Tops,
});

function Tops() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const { range } = Route.useLoaderDeps();
  const { summary, top, kind } = Route.useLoaderData();
  const me = viewer && viewer.userName.toLowerCase() === userName.toLowerCase() ? viewer : null;
  return (
    <Main gap={28}>
      <ProfileHeader userName={userName} summary={summary} me={me} />
      <ProfileTabs userName={userName} summary={summary} />
      <TopsPage
        key={`${kind}/${range}`}
        userName={userName}
        kind={kind}
        range={range}
        first={top}
      />
    </Main>
  );
}
