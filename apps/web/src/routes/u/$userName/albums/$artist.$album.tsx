import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { AlbumPage } from "../../../../features/library/index.ts";
import { textParam } from "../../../../lib/ranges.ts";

export const Route = createFileRoute("/u/$userName/albums/$artist/$album")({
  validateSearch: (search: Record<string, unknown>): { mbid?: string } => ({
    mbid: textParam(search.mbid),
  }),
  loader: ({ params }) =>
    api.library.album(params.userName, params.artist, params.album, { range: "all_time" }),
  head: ({ params }) => ({ meta: [{ title: `${params.album} · ${params.artist} · Needle` }] }),
  component: () => (
    <AlbumPage
      userName={Route.useParams().userName}
      album={Route.useLoaderData()}
      mbid={Route.useSearch().mbid}
    />
  ),
});
