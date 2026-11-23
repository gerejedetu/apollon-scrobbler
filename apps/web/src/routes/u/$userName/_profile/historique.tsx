import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../features/favourites/index.ts";
import { HistoryPage, PAGE_SIZE, parseHistorySearch } from "../../../../features/listens/index.ts";
import { utcOffset } from "../../../../lib/timezone.ts";
import { Main } from "../../../../ui/layout/index.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/_profile/historique")({
  validateSearch: parseHistorySearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const [summary, page, nowPlaying, favourites] = await Promise.all([
      api.stats.summary(params.userName, { range: "all_time", utcOffset: utcOffset() }),
      api.listens.list(params.userName, { before: deps.avant, limit: PAGE_SIZE }),
      api.listens.nowPlaying(params.userName),
      loadFavourites(params.userName),
    ]);
    return { total: summary.listenCount, page, nowPlaying: nowPlaying.nowPlaying, favourites };
  },
  head: ({ params }) => ({
    meta: [{ title: pageTitle(m.title_history_of({ user: params.userName })) }],
  }),
  component: History,
});

function History() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const search = Route.useSearch();
  const { total, page, nowPlaying, favourites } = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <Main gap={28} padding="16px 24px 64px">
      <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
        <HistoryPage
          key={search.avant ?? "latest"}
          userName={userName}
          page={page}
          total={total}
          nowPlaying={nowPlaying}
          search={search}
        />
      </FavouritesProvider>
    </Main>
  );
}
