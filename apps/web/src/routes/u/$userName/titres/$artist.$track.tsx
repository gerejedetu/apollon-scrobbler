import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { TrackPage } from "../../../../features/library/index.ts";
import { isRange, textParam } from "../../../../lib/ranges.ts";
import { utcOffset } from "../../../../lib/timezone.ts";

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
    api.library.track(params.userName, params.artist, params.track, {
      range: deps.range,
      utcOffset: utcOffset(),
    }),
  head: ({ params }) => ({ meta: [{ title: `${params.track} · ${params.artist} · Needle` }] }),
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
