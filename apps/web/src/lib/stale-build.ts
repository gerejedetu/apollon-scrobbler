/**
 * After a deploy, a tab opened earlier still asks for the previous build's code chunks, which no longer
 * exist: the next client-side navigation fails with "Failed to fetch dynamically imported module".
 * That is not an error to show: load the page again, once, and it comes with the new build.
 */
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i;
const GUARD = "stale_build_reload";

export const isStaleBuildError = (error: unknown) =>
  error instanceof Error && CHUNK_ERROR.test(`${error.name} ${error.message}`);

/** Reloads the page once per minute at most (a real outage must not loop). Returns false if it did not. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(GUARD) ?? 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(GUARD, String(Date.now()));
  } catch {
    // No storage: still reload, the browser's own error page stops a loop.
  }
  window.location.reload();
  return true;
}

/** Vite reports failed chunk preloads with this event (hover prefetch, route chunks). */
export function watchForNewBuild(): () => void {
  const onError = (e: Event) => {
    if (reloadForNewBuild()) e.preventDefault();
  };
  window.addEventListener("vite:preloadError", onError);
  return () => window.removeEventListener("vite:preloadError", onError);
}
