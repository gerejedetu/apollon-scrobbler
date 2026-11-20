/** Route guards: send signed-out visitors to sign-in (and back afterwards), signed-in ones away from it. */
import { redirect } from "@tanstack/react-router";
import type { Me } from "../api/index.ts";
import type { Viewer } from "./viewer.ts";

export function requireViewer(viewer: Viewer, from: string): Me {
  if (!viewer) throw redirect({ to: "/connexion", search: { redirect: from } });
  return viewer;
}

export function redirectIfSignedIn(viewer: Viewer): void {
  if (viewer) throw redirect({ to: "/u/$userName", params: { userName: viewer.userName } });
}

/** Only same-site paths are followed after sign-in. */
export function safeRedirect(target: unknown): string | null {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
    ? target
    : null;
}
