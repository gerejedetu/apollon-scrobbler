import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { TrackPage } from "../../../../features/library/index.ts";
import { utcOffset } from "../../../../lib/timezone.ts";

export const Route = createFileRoute("/u/$userName/titres/$artist/$track")({
  validateSearch: (search: Record<string, unknown>): { album?: string } => ({
    album: typeof search.album === "string" && search.album ? search.album : undefined,
  }),
  loader: ({ params }) =>
    api.library.track(params.userName, params.artist, params.track, {
      range: "all_time",
      utcOffset: utcOffset(),
    }),
  head: ({ params }) => ({ meta: [{ title: `${params.track} · ${params.artist} · Needle` }] }),
  component: () => (
    <TrackPage
      userName={Route.useParams().userName}
      track={Route.useLoaderData()}
      album={Route.useSearch().album}
    />
  ),
});
