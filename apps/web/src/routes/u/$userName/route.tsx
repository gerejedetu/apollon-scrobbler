import {
  createFileRoute,
  type ErrorComponentProps,
  notFound,
  Outlet,
} from "@tanstack/react-router";
import { api, isNotFound } from "../../../api/index.ts";
import { loadInstance } from "../../../auth/instance.ts";
import { HiddenProfile, RouteError } from "../../../features/errors/index.ts";
import { Shell } from "../../../features/shell/index.ts";

/** A user's pages share the frame and the owner's colour; the viewer may be anyone. */
export const Route = createFileRoute("/u/$userName")({
  // The public card tells whether the profile can be read: the API 404s for private and unknown ones
  // alike, and this route's error screen then covers every page of the profile.
  loader: async ({ params }) => {
    try {
      const [profile, instance] = await Promise.all([
        api.me.profile(params.userName),
        loadInstance(),
      ]);
      return { profile, signupOpen: instance.signupOpen };
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
    <Shell viewer={viewer}>
      <HiddenProfile signedIn={viewer !== null} />
    </Shell>
  );
}

/** The API answers 404 for private and unknown profiles alike: one screen for both. */
function UserError(props: ErrorComponentProps) {
  const { viewer } = Route.useRouteContext();
  return (
    <Shell viewer={viewer}>
      {isNotFound(props.error) ? (
        <HiddenProfile signedIn={viewer !== null} />
      ) : (
        <RouteError {...props} />
      )}
    </Shell>
  );
}

function UserPages() {
  const { viewer } = Route.useRouteContext();
  const { profile, signupOpen } = Route.useLoaderData();
  return (
    <Shell viewer={viewer} profile={profile} signupOpen={signupOpen}>
      <Outlet />
    </Shell>
  );
}
