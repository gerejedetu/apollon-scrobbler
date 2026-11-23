import { createFileRoute } from "@tanstack/react-router";
import type { Range } from "../../../../api/index.ts";
import { loadOverview, Overview } from "../../../../features/apollon/index.ts";
import { FavouritesProvider } from "../../../../features/favourites/index.ts";
import { isRange } from "../../../../lib/ranges.ts";
import { pageTitle } from "../../../../ui/brand/index.ts";

interface Search {
  artistes?: Range;
  albums?: Range;
  titres?: Range;
}

/** The profile's overview (Aperçu): the home of a profile. */
export const Route = createFileRoute("/u/$userName/_profile/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    artistes: isRange(search.artistes) ? search.artistes : undefined,
    albums: isRange(search.albums) ? search.albums : undefined,
    titres: isRange(search.titres) ? search.titres : undefined,
  }),
  loaderDeps: ({ search }) => ({
    artists: search.artistes ?? "this_month",
    albums: search.albums ?? "this_month",
    tracks: search.titres ?? "this_month",
  }),
  loader: ({ params, deps }) => loadOverview(params.userName, deps),
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.userName) }] }),
  component: Home,
});

function Home() {
  const { userName } = Route.useParams();
  const { viewer } = Route.useRouteContext();
  const periods = Route.useLoaderDeps();
  const data = Route.useLoaderData();
  const owner = viewer !== null && viewer.userName.toLowerCase() === userName.toLowerCase();
  return (
    <FavouritesProvider
      owner={owner}
      loved={data.favourites.loved}
      obsession={data.favourites.obsession}
    >
      <Overview userName={userName} data={data} selected={periods} />
    </FavouritesProvider>
  );
}
