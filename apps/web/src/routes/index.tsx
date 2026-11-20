import { createFileRoute, redirect } from "@tanstack/react-router";

/** The home is your own library; signed out, the sign-in page. */
export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.viewer)
      throw redirect({ to: "/u/$userName", params: { userName: context.viewer.userName } });
    throw redirect({ to: "/connexion" });
  },
});
