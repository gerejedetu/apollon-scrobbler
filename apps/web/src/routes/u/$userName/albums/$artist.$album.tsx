import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { api, isNotFound, type Range } from "../../../../api/index.ts";
import { AlbumPage, emptyAlbum, orEmpty } from "../../../../features/library/index.ts";
import { isRange, textParam } from "../../../../lib/ranges.ts";
import { pageTitle } from "../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/albums/$artist/$album")({
  validateSearch: (search: Record<string, unknown>): { mbid?: string; periode?: Range } => ({
    mbid: textParam(search.mbid),
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "all_time" }),
  loader: async ({ params, deps }) => {
    try {
      return await api.library.album(params.userName, params.artist, params.album, {
        range: deps.range,
      });
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    // Nothing in this period: an empty page only for an album that exists at all.
    if (deps.range !== "all_time") {
      const exists = await orEmpty(
        api.library.album(params.userName, params.artist, params.album).then(() => true),
        () => false,
      );
      if (exists) return emptyAlbum(params.artist, params.album, deps.range);
    }
    // No such album: a track without an album (a cover, a lone upload) is shown as the track it is.
    const isTrack = await orEmpty(
      api.library.track(params.userName, params.artist, params.album).then(() => true),
      () => false,
    );
    if (isTrack) {
      throw redirect({
        to: "/u/$userName/titres/$artist/$track",
        params: { userName: params.userName, artist: params.artist, track: params.album },
        replace: true,
      });
    }
    throw notFound();
  },
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.album, params.artist) }] }),
  component: () => (
    <AlbumPage
      userName={Route.useParams().userName}
      album={Route.useLoaderData()}
      mbid={Route.useSearch().mbid}
      range={Route.useLoaderDeps().range}
    />
  ),
});
