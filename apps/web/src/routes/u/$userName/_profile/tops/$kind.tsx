import { createFileRoute, notFound } from "@tanstack/react-router";
import { api, type Range } from "../../../../../api/index.ts";
import { LibraryTop, TOP_PAGE } from "../../../../../features/apollon/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../../features/favourites/index.ts";
import { isKind, KINDS } from "../../../../../features/tops/index.ts";
import { isRange } from "../../../../../lib/ranges.ts";
import { m } from "../../../../../paraglide/messages.js";
import { pageTitle } from "../../../../../ui/brand/index.ts";

/** Library › Artistes, Albums, Titres: the whole ranking of a period. */
export const Route = createFileRoute("/u/$userName/_profile/tops/$kind")({
  validateSearch: (search: Record<string, unknown>): { periode?: Range } => ({
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "this_month" }),
  loader: async ({ params, deps }) => {
    if (!isKind(params.kind)) throw notFound();
    const [top, favourites] = await Promise.all([
      api.stats.top(params.userName, KINDS[params.kind].entity, {
        range: deps.range,
        limit: TOP_PAGE,
      }),
      loadFavourites(params.userName),
    ]);
    return { top, favourites, kind: params.kind };
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
  const { top, favourites, kind } = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
      <LibraryTop
        key={`${kind}/${range}`}
        userName={userName}
        kind={kind}
        range={range}
        first={top}
      />
    </FavouritesProvider>
  );
}
