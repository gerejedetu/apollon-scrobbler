import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../api/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../features/favourites/index.ts";
import { HistoryPage, parseHistorySearch } from "../../../features/listens/index.ts";
import { utcOffset } from "../../../lib/timezone.ts";
import { Main } from "../../../ui/layout/index.ts";

export const Route = createFileRoute("/u/$userName/historique")({
  validateSearch: parseHistorySearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const size = deps.taille ?? 50;
    const [summary, page, nowPlaying, favourites] = await Promise.all([
      api.stats.summary(params.userName, { range: "all_time", utcOffset: utcOffset() }),
      api.listens.list(params.userName, { before: deps.avant, after: deps.apres, limit: size }),
      api.listens.nowPlaying(params.userName),
      loadFavourites(params.userName),
    ]);
    return { total: summary.listenCount, page, nowPlaying: nowPlaying.nowPlaying, favourites };
  },
  head: ({ params }) => ({ meta: [{ title: `Historique de ${params.userName} · Needle` }] }),
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
