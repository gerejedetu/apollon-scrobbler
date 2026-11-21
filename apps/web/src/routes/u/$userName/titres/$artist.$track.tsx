import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { emptyTrack, orEmpty, TrackPage } from "../../../../features/library/index.ts";
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
  loader: ({ params, deps }) =>
    orEmpty(
      api.library.track(params.userName, params.artist, params.track, {
        range: deps.range,
        utcOffset: utcOffset(),
      }),
      () => emptyTrack(params.artist, params.track, deps.range),
    ),
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.track, params.artist) }] }),
  component: () => {
    const { album, mbid } = Route.useSearch();
    return (
      <TrackPage
        userName={Route.useParams().userName}
        track={Route.useLoaderData()}
        album={album}
        mbid={mbid}
        range={Route.useLoaderDeps().range}
      />
    );
  },
});
