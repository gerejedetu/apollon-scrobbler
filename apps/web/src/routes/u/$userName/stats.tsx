import { createFileRoute } from "@tanstack/react-router";
import type { Range } from "../../../api/index.ts";
import { loadStats, StatsPage } from "../../../features/stats/index.ts";
import { isRange } from "../../../lib/ranges.ts";
import { m } from "../../../paraglide/messages.js";
import { pageTitle } from "../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/stats")({
  validateSearch: (search: Record<string, unknown>): { periode?: Range } => ({
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "this_month" }),
  loader: ({ params, deps }) => loadStats(params.userName, deps.range),
  head: ({ params }) => ({
    meta: [{ title: pageTitle(m.title_stats_of({ user: params.userName })) }],
  }),
  component: () => (
    <StatsPage
      userName={Route.useParams().userName}
      range={Route.useLoaderDeps().range}
      data={Route.useLoaderData()}
    />
  ),
});
