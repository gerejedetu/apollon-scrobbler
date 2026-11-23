import { createFileRoute } from "@tanstack/react-router";
import { api, type Range } from "../../../../api/index.ts";
import { ArtistDetail } from "../../../../features/apollon/index.ts";
import { emptyArtist, emptyTimeline, orEmpty } from "../../../../features/library/index.ts";
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
    const timeline = (granularity: "month") =>
      // The timeline is "the last 12 months" whatever the period picked above.
      orEmpty(
        api.library.timeline(userName, name, { range: "all_time", granularity, utcOffset: offset }),
        () => emptyTimeline(name, granularity),
      );
    const [artist, month, summary] = await Promise.all([
      orEmpty(api.library.artist(userName, name, { range, limit: 10 }), () =>
        emptyArtist(name, range),
      ),
      timeline("month"),
      api.stats.summary(userName, { range, utcOffset: offset }),
    ]);
    return { artist, timeline: month, summary };
  },
  head: ({ params }) => ({ meta: [{ title: pageTitle(params.artist) }] }),
  component: () => {
    const { userName } = Route.useParams();
    const { artist, timeline, summary } = Route.useLoaderData();
    return (
      <ArtistDetail
        userName={userName}
        artist={artist}
        timeline={timeline}
        totalListens={summary.listenCount}
      />
    );
  },
});
