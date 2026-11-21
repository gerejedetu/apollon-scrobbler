import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "../auth/index.ts";
import { AuthLayout, SignUpForm } from "../features/auth/index.ts";
import { m } from "../paraglide/messages.js";
import { pageTitle } from "../ui/brand/index.ts";

export const Route = createFileRoute("/inscription")({
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  head: () => ({ meta: [{ title: pageTitle(m.title_signup()) }] }),
  component: () => (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  ),
});
