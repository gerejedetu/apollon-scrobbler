import { createFileRoute } from "@tanstack/react-router";
import {
  isReportPeriod,
  loadReport,
  type ReportPeriod,
  Reports,
} from "../../../../features/apollon/index.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

/** Reports: ?periode=semaine|mois|annee, ?precedente=1 for the last complete one. */
export const Route = createFileRoute("/u/$userName/_profile/rapports")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { periode?: ReportPeriod; precedente?: boolean } => ({
    periode: isReportPeriod(search.periode) ? search.periode : undefined,
    precedente:
      search.precedente === true || search.precedente === "1" || search.precedente === "true"
        ? true
        : undefined,
  }),
  loaderDeps: ({ search }) => ({
    period: search.periode ?? "semaine",
    past: search.precedente === true,
  }),
  loader: ({ params, deps }) => loadReport(params.userName, deps.period, deps.past),
  head: ({ params }) => ({ meta: [{ title: pageTitle(m.ds_nav_reports(), params.userName) }] }),
  component: Report,
});

function Report() {
  const { userName } = Route.useParams();
  const { period, past } = Route.useLoaderDeps();
  return <Reports userName={userName} period={period} past={past} data={Route.useLoaderData()} />;
}
