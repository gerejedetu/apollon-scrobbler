import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { TrackDetail } from "../../../../features/apollon/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../features/favourites/index.ts";
import { emptyTrack, orEmpty } from "../../../../features/library/index.ts";
import { isRange, textParam } from "../../../../lib/ranges.ts";
import { utcOffset } from "../../../../lib/timezone.ts";
import { pageTitle } from "../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/titres/$artist/$track")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { album?: string; mbid?: string; periode?: Range } => ({
    album: textParam(search.album),
    mbid: textParam(search.mbid),
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "all_time" }),
  loader: async ({ params, deps }) => {
    const [track, favourites] = await Promise.all([
      orEmpty(
        api.library.track(params.userName, params.artist, params.track, {
          range: deps.range,
          utcOffset: utcOffset(),
        }),
        () => emptyTrack(params.artist, params.track, deps.range),
      ),
      loadFavourites(params.userName),
    ]);
    return { track, favourites };
  },
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.track, params.artist) }] }),
  component: () => {
    const { album, mbid } = Route.useSearch();
    const { userName } = Route.useParams();
    const { viewer } = Route.useRouteContext();
    const { track, favourites } = Route.useLoaderData();
    const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
    return (
      <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
        <TrackDetail userName={userName} track={track} album={album} mbid={mbid} />
      </FavouritesProvider>
    );
  },
});
