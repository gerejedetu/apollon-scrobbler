import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import {
  authClient,
  describeAuthError,
  forgetViewer,
  oauthRedirect,
  safeRedirect,
} from "../../auth/index.ts";
import { Notice } from "../../ui/primitives/index.ts";
import { Button, TextField } from "../../ui/apollon/index.ts";
import { formText } from "./form.ts";
import { AuthLayout, authFoot, authForm } from "./layout.tsx";
import { m } from "../../paraglide/messages.js";

/** "Connexion à Apollon": e-mail and password, then back where the visitor was going. */
export function SignInForm({
  created,
  redirectTo,
  signupOpen = true,
}: {
  created?: boolean;
  redirectTo?: string;
  /** Hides the "create an account" link when the instance takes no new accounts. */
  signupOpen?: boolean;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { data: session, error } = await authClient.signIn.email({
      email: formText(data, "email"),
      password: formText(data, "password"),
    });
    setPending(false);
    if (error || !session) {
      setError(describeAuthError(error).message);
      return;
    }
    // Signing in for an MCP client (claude.ai…): the server answers with the next step of its authorization.
    const resume = oauthRedirect(session);
    if (resume) {
      window.location.assign(resume);
      return;
    }
    forgetViewer();
    await router.invalidate();
    const target = safeRedirect(redirectTo);
    if (target) router.history.push(target);
    else await navigate({ to: "/" });
  }

  return (
    <AuthLayout title={m.signin_submit()}>
      {created && !error ? <Notice tone="success">{m.signin_created()}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <form className={authForm} onSubmit={onSubmit}>
        <TextField
          label={m.field_email()}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={m.field_email_placeholder()}
          required
        />
        <TextField
          label={m.field_password()}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={m.field_password_placeholder()}
          required
        />
        <Button variant="primary" type="submit" disabled={pending}>
          {pending ? m.signin_pending() : m.signin_submit()}
        </Button>
      </form>
      {signupOpen ? (
        <div className={authFoot}>
          {m.signin_no_account()}{" "}
          <Link to="/inscription" className="ap-link">
            {m.signin_create()}
          </Link>
        </div>
      ) : null}
    </AuthLayout>
  );
}
