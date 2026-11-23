import { createFileRoute } from "@tanstack/react-router";
import { LaurelsPage, loadLaurels } from "../../../../features/apollon/index.ts";
import { m } from "../../../../paraglide/messages.js";
import { pageTitle } from "../../../../ui/brand/index.ts";

/** Lauriers: rewards earned by listening. */
export const Route = createFileRoute("/u/$userName/_profile/lauriers")({
  loader: ({ params }) => loadLaurels(params.userName),
  head: ({ params }) => ({ meta: [{ title: pageTitle(m.ds_tab_laurels(), params.userName) }] }),
  component: () => <LaurelsPage laurels={Route.useLoaderData()} />,
});
