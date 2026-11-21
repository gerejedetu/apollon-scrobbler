import {
  createFileRoute,
  type ErrorComponentProps,
  notFound,
  Outlet,
} from "@tanstack/react-router";
import { api, isNotFound } from "../../../api/index.ts";
import { HiddenProfile, RouteError } from "../../../features/errors/index.ts";
import { AppHeader, MobileTabBar } from "../../../features/navigation/index.ts";
import { Page } from "../../../ui/layout/index.ts";

/** A user's pages (library, history, stats) share the app header; the viewer may be anyone. */
export const Route = createFileRoute("/u/$userName")({
  // One cheap call tells whether the profile can be read; the API 404s for private and unknown ones alike,
  // and this route's error screen then covers every page of the profile.
  loader: async ({ params }) => {
    try {
      return await api.listens.nowPlaying(params.userName);
    } catch (e) {
      // Router's notFound survives server rendering (an ApiError would arrive as a plain Error).
      if (isNotFound(e)) throw notFound();
      throw e;
    }
  },
  staleTime: 60_000,
  component: UserPages,
  errorComponent: UserError,
  notFoundComponent: Hidden,
});

function Hidden() {
  const { viewer } = Route.useRouteContext();
  return (
    <Page header={<AppHeader userName={viewer?.userName ?? null} />}>
      <HiddenProfile signedIn={viewer !== null} />
    </Page>
  );
}

/** The API answers 404 for private and unknown profiles alike: one screen for both. */
function UserError(props: ErrorComponentProps) {
  const { viewer } = Route.useRouteContext();
  return (
    <Page header={<AppHeader userName={viewer?.userName ?? null} />}>
      {isNotFound(props.error) ? (
        <HiddenProfile signedIn={viewer !== null} />
      ) : (
        <RouteError {...props} />
      )}
    </Page>
  );
}

function UserPages() {
  const { viewer } = Route.useRouteContext();
  return (
    <Page
      header={<AppHeader userName={viewer?.userName ?? null} />}
      tabBar={viewer ? <MobileTabBar userName={viewer.userName} /> : undefined}
    >
      <Outlet />
    </Page>
  );
}
