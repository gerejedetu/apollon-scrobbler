import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { AlbumPage, emptyAlbum, orEmpty } from "../../../../features/library/index.ts";
import { isRange, textParam } from "../../../../lib/ranges.ts";
import { pageTitle } from "../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/albums/$artist/$album")({
  validateSearch: (search: Record<string, unknown>): { mbid?: string; periode?: Range } => ({
    mbid: textParam(search.mbid),
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "all_time" }),
  loader: ({ params, deps }) =>
    orEmpty(
      api.library.album(params.userName, params.artist, params.album, { range: deps.range }),
      () => emptyAlbum(params.artist, params.album, deps.range),
    ),
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
