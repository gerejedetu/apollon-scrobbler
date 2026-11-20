import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { TrackPage } from "../../../../features/library/index.ts";
import { textParam } from "../../../../lib/ranges.ts";
import { utcOffset } from "../../../../lib/timezone.ts";

export const Route = createFileRoute("/u/$userName/titres/$artist/$track")({
  validateSearch: (search: Record<string, unknown>): { album?: string; mbid?: string } => ({
    album: textParam(search.album),
    mbid: textParam(search.mbid),
  }),
  loader: ({ params }) =>
    api.library.track(params.userName, params.artist, params.track, {
      range: "all_time",
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
      />
    );
  },
});
