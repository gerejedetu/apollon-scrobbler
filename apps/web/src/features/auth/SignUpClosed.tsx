import { Link } from "@tanstack/react-router";
import { m } from "../../paraglide/messages.js";
import { authFoot, authTitle } from "./layout.tsx";

/** Shown instead of the sign-up form when the instance takes no new accounts. */
export function SignUpClosed() {
  return (
    <>
      <h1 className={authTitle}>{m.signup_closed_title()}</h1>
      <p className={authFoot} style={{ fontSize: 14, textAlign: "left" }}>
        {m.signup_closed_body()}
      </p>
      <p className={authFoot}>
        <Link to="/connexion">{m.signin_submit()}</Link>
      </p>
    </>
  );
}
