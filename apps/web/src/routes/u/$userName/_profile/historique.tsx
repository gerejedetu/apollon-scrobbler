import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { LibraryListens } from "../../../../features/apollon/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../features/favourites/index.ts";
import { PAGE_SIZE, parseHistorySearch } from "../../../../features/listens/index.ts";
import { utcOffset } from "../../../../lib/timezone.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

/** Library › Scrobbles: the history, newest first (or from a date with ?avant=). */
export const Route = createFileRoute("/u/$userName/_profile/historique")({
  validateSearch: parseHistorySearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const offset = utcOffset();
    const [summary, page, nowPlaying, favourites, month] = await Promise.all([
      api.stats.summary(params.userName, { range: "all_time", utcOffset: offset }),
      api.listens.list(params.userName, { before: deps.avant, limit: PAGE_SIZE }),
      api.listens.nowPlaying(params.userName),
      loadFavourites(params.userName),
      api.stats.activity(params.userName, {
        range: "this_month",
        granularity: "day",
        utcOffset: offset,
      }),
    ]);
    return {
      summary,
      page,
      nowPlaying: nowPlaying.nowPlaying,
      favourites,
      month: month.days ?? [],
    };
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
  const { summary, page, nowPlaying, favourites, month } = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
      <LibraryListens
        key={search.avant ?? "latest"}
        userName={userName}
        first={page}
        total={summary.listenCount}
        averagePerDay={summary.averagePerDay}
        nowPlaying={nowPlaying}
        startAt={search.avant}
        month={month}
      />
    </FavouritesProvider>
  );
}
