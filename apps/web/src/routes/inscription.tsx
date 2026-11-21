import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "../auth/index.ts";
import { loadInstance } from "../auth/instance.ts";
import { AuthLayout, SignUpClosed, SignUpForm } from "../features/auth/index.ts";
import { m } from "../paraglide/messages.js";
import { pageTitle } from "../ui/brand/index.ts";

export const Route = createFileRoute("/inscription")({
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  loader: () => loadInstance(),
  head: () => ({ meta: [{ title: pageTitle(m.title_signup()) }] }),
  component: SignUp,
});

function SignUp() {
  const { signupOpen } = Route.useLoaderData();
  return <AuthLayout>{signupOpen ? <SignUpForm /> : <SignUpClosed />}</AuthLayout>;
}
