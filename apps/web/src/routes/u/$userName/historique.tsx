import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../api/index.ts";
import { History, HISTORY_PAGE } from "../../../features/listens/index.ts";
import { ProfileHeader, ProfileTabs } from "../../../features/profile/index.ts";
import { utcOffset } from "../../../lib/timezone.ts";
import { Main } from "../../../ui/layout/index.ts";

export const Route = createFileRoute("/u/$userName/historique")({
  loader: async ({ params }) => {
    const [summary, first] = await Promise.all([
      api.stats.summary(params.userName, { range: "all_time", utcOffset: utcOffset() }),
      api.listens.list(params.userName, { limit: HISTORY_PAGE }),
    ]);
    return { summary, first };
  },
  head: ({ params }) => ({ meta: [{ title: `Historique de ${params.userName} · Needle` }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const { summary, first } = Route.useLoaderData();
  const me = viewer && viewer.userName.toLowerCase() === userName.toLowerCase() ? viewer : null;
  return (
    <Main gap={28}>
      <ProfileHeader userName={first.userName || userName} summary={summary} me={me} />
      <ProfileTabs userName={userName} summary={summary} />
      <History key={userName} userName={userName} first={first} />
    </Main>
  );
}
