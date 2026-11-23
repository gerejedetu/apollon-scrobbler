import { Link } from "@tanstack/react-router";
import { EmptyState } from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { AuthLayout, authFoot } from "./layout.tsx";

/** Sign-up when the instance takes no new accounts (design system: PageSignupClosed). */
export function SignUpClosed() {
  return (
    <AuthLayout title={m.signup_closed_title()}>
      <EmptyState icon="close" title={m.ds_closed_title()} text={m.signup_closed_body()} />
      <div className={authFoot}>
        {m.ds_have_account()}{" "}
        <Link to="/connexion" className="ap-link">
          {m.signin_submit()}
        </Link>
      </div>
    </AuthLayout>
  );
}
