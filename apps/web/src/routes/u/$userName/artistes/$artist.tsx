import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { ArtistPage } from "../../../../features/library/index.ts";
import { isRange } from "../../../../lib/ranges.ts";
import { utcOffset } from "../../../../lib/timezone.ts";
import { pageTitle } from "../../../../ui/brand/index.ts";

export const Route = createFileRoute("/u/$userName/artistes/$artist")({
  validateSearch: (search: Record<string, unknown>): { periode?: Range } => ({
    periode: isRange(search.periode) ? search.periode : undefined,
  }),
  loaderDeps: ({ search }) => ({ range: search.periode ?? "all_time" }),
  loader: async ({ params: { userName, artist: name }, deps: { range } }) => {
    const offset = utcOffset();
    const timeline = (granularity: "week" | "month" | "year") =>
      // The timeline is "the last 12 months" whatever the period picked above.
      api.library.timeline(userName, name, { range: "all_time", granularity, utcOffset: offset });
    const [artist, month, week, year, summary] = await Promise.all([
      api.library.artist(userName, name, { range, limit: 10 }),
      timeline("month"),
      timeline("week"),
      timeline("year"),
      api.stats.summary(userName, { range, utcOffset: offset }),
    ]);
    return { artist, timelines: { month, week, year }, summary };
  },
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.artist) }] }),
  component: () => {
    const { userName } = Route.useParams();
    const { range } = Route.useLoaderDeps();
    return <ArtistPage userName={userName} range={range} data={Route.useLoaderData()} />;
  },
});
