import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../api/index.ts";
import { SearchPage, type SearchOnly } from "../../../features/apollon/index.ts";
import { textParam } from "../../../lib/ranges.ts";
import { m } from "../../../paraglide/messages.js";
import { pageTitle } from "../../../ui/brand/index.ts";

const ONLY = ["artists", "albums", "tracks"] as const;

/** Search a profile's library: ?q= the words, ?seul= one kind. */
export const Route = createFileRoute("/u/$userName/recherche")({
  validateSearch: (search: Record<string, unknown>): { q?: string; seul?: SearchOnly } => ({
    q: textParam(search.q),
    seul: ONLY.includes(search.seul as SearchOnly) ? (search.seul as SearchOnly) : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ params, deps }) =>
    deps.q ? api.favourites.search(params.userName, { q: deps.q, limit: 20 }) : null,
  head: () => ({ meta: [{ title: pageTitle(m.ds_search_title()) }] }),
  component: Search,
});

function Search() {
  const { userName } = Route.useParams();
  const { q, seul } = Route.useSearch();
  return (
    <SearchPage
      key={q ?? ""}
      userName={userName}
      query={q ?? ""}
      only={seul}
      results={Route.useLoaderData()}
    />
  );
}
