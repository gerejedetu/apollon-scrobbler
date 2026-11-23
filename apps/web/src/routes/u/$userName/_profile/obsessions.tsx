import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../api/index.ts";
import { ObsessionsPage } from "../../../../features/apollon/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../features/favourites/index.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

/** Obsessions: the current one and the earlier ones. */
export const Route = createFileRoute("/u/$userName/_profile/obsessions")({
  loader: async ({ params }) => {
    const [history, favourites, nowPlaying, last] = await Promise.all([
      api.favourites.obsessions(params.userName, { limit: 100 }),
      loadFavourites(params.userName),
      api.listens.nowPlaying(params.userName),
      api.listens.list(params.userName, { limit: 1 }),
    ]);
    return { history, favourites, candidate: nowPlaying.nowPlaying ?? last.listens[0] ?? null };
  },
  head: ({ params }) => ({ meta: [{ title: pageTitle(m.ds_tab_obsessions(), params.userName) }] }),
  component: Obsessions,
});

function Obsessions() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const { history, favourites, candidate } = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
      <ObsessionsPage
        userName={userName}
        items={history.items}
        total={history.total}
        longest={history.longest}
        candidate={
          candidate
            ? {
                ...candidate,
                album: candidate.album ?? null,
                mbids: { recording: null, release: candidate.mbids?.release ?? null },
              }
            : null
        }
      />
    </FavouritesProvider>
  );
}
