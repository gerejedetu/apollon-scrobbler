import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "../auth/index.ts";
import { AuthLayout, SignInForm } from "../features/auth/index.ts";
import { m } from "../paraglide/messages.js";

interface Search {
  redirect?: string;
  created?: boolean;
}

export const Route = createFileRoute("/connexion")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    created: search.created === true || search.created === "true" ? true : undefined,
  }),
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  head: () => ({ meta: [{ title: `${m.title_signin()} · Needle` }] }),
  component: SignIn,
});

function SignIn() {
  const { redirect, created } = Route.useSearch();
  return (
    <AuthLayout>
      <SignInForm created={created} redirectTo={redirect} />
    </AuthLayout>
  );
}
