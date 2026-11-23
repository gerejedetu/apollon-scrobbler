import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import {
  authClient,
  type AuthFailure,
  describeAuthError,
  forgetViewer,
  loadViewer,
} from "../../auth/index.ts";
import { Notice } from "../../ui/primitives/index.ts";
import { Button, TextField } from "../../ui/apollon/index.ts";
import { formText } from "./form.ts";
import { AuthLayout, authFoot, authForm } from "./layout.tsx";
import { MIN_PASSWORD, validateUserName } from "./validation.ts";
import { profilePrefix } from "../../lib/origin.ts";
import { m } from "../../paraglide/messages.js";

/**
 * "Crée ton carnet d'écoute": POST /api/auth/sign-up/email with email, password, name and username.
 * The username is also the display name and the profile address.
 */
export function SignUpForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [pending, setPending] = useState(false);
  const nameError = userName ? validateUserName(userName) : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameError) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setFailure(null);
    const { error } = await authClient.signUp.email({
      email: formText(data, "email"),
      password: formText(data, "password"),
      name: userName,
      username: userName,
    });
    setPending(false);
    if (error) {
      setFailure(describeAuthError(error));
      return;
    }
    // Better Auth signs the new account in unless the server says otherwise: then ask to sign in.
    forgetViewer();
    const viewer = await loadViewer();
    await router.invalidate();
    if (viewer) await navigate({ to: "/reglages/tokens" });
    else await navigate({ to: "/connexion", search: { created: true } });
  }

  const fieldError = (field: AuthFailure["field"]) =>
    failure !== null && failure.field === field ? failure.message : undefined;

  return (
    <AuthLayout title={m.signin_create()} lead={m.signup_intro()}>
      {failure && failure.field === undefined ? (
        <Notice tone="error">{failure.message}</Notice>
      ) : null}
      <form className={authForm} onSubmit={onSubmit}>
        <TextField
          label={m.field_username()}
          name="username"
          autoComplete="username"
          placeholder={m.field_username_placeholder()}
          required
          value={userName}
          onChange={(e) => setUserName(e.target.value.trim())}
          error={nameError ?? fieldError("username")}
          hint={`${m.username_help()} ${profilePrefix()}${userName || "jules"}`}
        />
        <TextField
          label={m.field_email()}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={m.field_email_placeholder()}
          required
          error={fieldError("email")}
        />
        <TextField
          label={m.field_password()}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={m.field_password_min({ count: MIN_PASSWORD })}
          minLength={MIN_PASSWORD}
          required
          error={fieldError("password")}
        />
        <Button variant="primary" type="submit" disabled={pending || Boolean(nameError)}>
          {pending ? m.signup_pending() : m.signup_submit()}
        </Button>
      </form>
      <div className={authFoot}>
        {m.signup_have_account()}{" "}
        <Link to="/connexion" className="ap-link">
          {m.signin_submit()}
        </Link>
      </div>
    </AuthLayout>
  );
}
