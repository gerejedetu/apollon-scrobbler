import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "../auth/index.ts";
import { AuthLayout, SignUpForm } from "../features/auth/index.ts";
import { m } from "../paraglide/messages.js";

export const Route = createFileRoute("/inscription")({
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  head: () => ({ meta: [{ title: `${m.title_signup()} · Needle` }] }),
  component: () => (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  ),
});
