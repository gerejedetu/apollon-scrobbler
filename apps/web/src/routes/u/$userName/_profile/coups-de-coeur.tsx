import { createFileRoute } from "@tanstack/react-router";
import { LovedPage } from "../../../../features/apollon/index.ts";
import { FavouritesProvider, loadFavourites } from "../../../../features/favourites/index.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

/** Coups de cœur: every loved track. */
export const Route = createFileRoute("/u/$userName/_profile/coups-de-coeur")({
  loader: ({ params }) => loadFavourites(params.userName),
  head: ({ params }) => ({ meta: [{ title: pageTitle(m.ds_tab_loved_long(), params.userName) }] }),
  component: Loved,
});

function Loved() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const favourites = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <FavouritesProvider owner={owner} loved={favourites.loved} obsession={favourites.obsession}>
      <LovedPage userName={userName} loved={favourites.loved} total={favourites.total} />
    </FavouritesProvider>
  );
}
