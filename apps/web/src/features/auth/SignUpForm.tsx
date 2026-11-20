import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { css } from "styled-system/css";
import {
  authClient,
  type AuthFailure,
  describeAuthError,
  forgetViewer,
  loadViewer,
} from "../../auth/index.ts";
import { Button, Field, Notice } from "../../ui/primitives/index.ts";
import { formText } from "./form.ts";
import { authFoot, authForm, authTitle } from "./layout.tsx";
import { MIN_PASSWORD, validateUserName } from "./validation.ts";

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
    <>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textAlign: "center",
          mb: "8px",
        })}
      >
        <h1 className={authTitle}>Crée ton carnet d'écoute</h1>
        <p className={css({ m: 0, fontSize: "13px", lineHeight: "20px", color: "muted" })}>
          Un compte, et chaque titre que tu écoutes sera enregistré ici.
        </p>
      </div>
      {failure && failure.field === undefined ? (
        <Notice tone="error">{failure.message}</Notice>
      ) : null}
      <form className={authForm} onSubmit={onSubmit}>
        <Field
          label="Nom d'utilisateur"
          name="username"
          autoComplete="username"
          placeholder="ex. jules"
          required
          value={userName}
          onChange={(e) => setUserName(e.target.value.trim())}
          error={nameError ?? fieldError("username")}
          hint={
            <>
              Il apparaît dans l'adresse de ton profil : needle/
              <b className={css({ color: "ink", fontWeight: "500" })}>{userName || "jules"}</b>
            </>
          }
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ton adresse e-mail"
          required
          error={fieldError("email")}
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`${MIN_PASSWORD} caractères minimum`}
          minLength={MIN_PASSWORD}
          required
          error={fieldError("password")}
        />
        <Button
          type="submit"
          className={css({ mt: "8px" })}
          disabled={pending || Boolean(nameError)}
        >
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
      <p className={authFoot}>
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </>
  );
}
