import { createFileRoute } from "@tanstack/react-router";
import { isOAuthRequest, redirectIfSignedIn } from "../auth/index.ts";
import { loadInstance } from "../auth/instance.ts";
import { SignInForm } from "../features/auth/index.ts";
import { m } from "../paraglide/messages.js";
import { pageTitle } from "../ui/brand/index.ts";

interface Search {
  redirect?: string;
  created?: boolean;
}

export const Route = createFileRoute("/connexion")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    // An MCP client's authorization (signed query): kept as is, the sign-in call sends it back.
    ...(isOAuthRequest(search) ? search : {}),
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    created: search.created === true || search.created === "true" ? true : undefined,
  }),
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  loader: () => loadInstance(),
  head: () => ({ meta: [{ title: pageTitle(m.title_signin()) }] }),
  component: SignIn,
});

function SignIn() {
  const { redirect, created } = Route.useSearch();
  const { signupOpen } = Route.useLoaderData();
  return <SignInForm created={created} redirectTo={redirect} signupOpen={signupOpen} />;
}
