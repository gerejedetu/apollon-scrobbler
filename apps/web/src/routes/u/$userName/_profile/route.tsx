import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProfileBanner, loadBanner } from "../../../../features/apollon/index.ts";

/** The profile's tab pages (Aperçu, Rapports, Bibliothèque, Coups de cœur, Obsessions, Lauriers): the banner. */
export const Route = createFileRoute("/u/$userName/_profile")({
  loader: ({ params }) => loadBanner(params.userName),
  staleTime: 60_000,
  component: Banner,
});

function Banner() {
  const { userName } = Route.useParams();
  const banner = Route.useLoaderData();
  return (
    <>
      <ProfileBanner userName={userName} banner={banner} />
      <Outlet />
    </>
  );
}
