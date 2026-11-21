import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../api/index.ts";
import { WrappedPage } from "../../../features/wrapped/index.ts";
import { utcOffset } from "../../../lib/timezone.ts";
import { m } from "../../../paraglide/messages.js";

export const Route = createFileRoute("/u/$userName/bilan")({
  validateSearch: (search: Record<string, unknown>): { annee?: number } => {
    const year = Number(search.annee);
    return { annee: Number.isInteger(year) && year > 1900 && year < 3000 ? year : undefined };
  },
  loaderDeps: ({ search }) => ({ year: search.annee }),
  loader: async ({ params, deps }) => {
    const offset = utcOffset();
    const wrapped = await api.stats.wrapped(params.userName, {
      year: deps.year,
      utcOffset: offset,
    });
    const first = await api.stats.summary(params.userName, {
      range: "all_time",
      utcOffset: offset,
    });
    return {
      wrapped,
      firstYear: first.firstListenedAt
        ? new Date(first.firstListenedAt * 1000).getUTCFullYear()
        : wrapped.year,
    };
  },
  head: ({ params }) => ({
    meta: [{ title: `${m.title_wrapped_of({ user: params.userName })} · Needle` }],
  }),
  component: () => {
    const { wrapped, firstYear } = Route.useLoaderData();
    return (
      <WrappedPage userName={Route.useParams().userName} wrapped={wrapped} firstYear={firstYear} />
    );
  },
});
