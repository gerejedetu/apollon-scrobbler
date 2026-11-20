/**
 * Who is signed in, from GET /v1/me (a 401 means nobody). Route guards read it before each navigation.
 * In the browser the answer is kept until sign-in, sign-out or a settings change calls `forgetViewer()`;
 * on the server every request asks again.
 */
import { api, isUnauthorized, type Me } from "../api/index.ts";

export type Viewer = Me | null;

let cached: Promise<Viewer> | null = null;

async function fetchViewer(): Promise<Viewer> {
  try {
    return await api.me.get();
  } catch (e) {
    if (isUnauthorized(e)) return null;
    throw e;
  }
}

export function loadViewer(): Promise<Viewer> {
  if (typeof window === "undefined") return fetchViewer();
  cached ??= fetchViewer().catch((e: unknown) => {
    cached = null;
    throw e;
  });
  return cached;
}

export function forgetViewer(): void {
  cached = null;
}
