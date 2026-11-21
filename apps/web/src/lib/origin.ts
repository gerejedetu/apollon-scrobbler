import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** The host the app is served from ("apollon.example.com"), the same on the server render and in the browser. */
export const siteHost: () => string = createIsomorphicFn()
  .server(() => new URL(getRequest().url).host)
  .client(() => window.location.host);

/** "apollon.example.com/u/": what comes before a user name in a profile's address. */
export const profilePrefix = () => `${siteHost()}/u/`;
