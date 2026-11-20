import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSignedIn } from "../auth/index.ts";
import { AuthLayout, SignUpForm } from "../features/auth/index.ts";

export const Route = createFileRoute("/inscription")({
  beforeLoad: ({ context }) => redirectIfSignedIn(context.viewer),
  head: () => ({ meta: [{ title: "Inscription · Needle" }] }),
  component: () => (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  ),
});
