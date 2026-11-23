import type { ReactNode } from "react";
import { AuthLayout as DsAuthLayout } from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";

/** Classes of the account screens' form parts (design system: AuthLayout). */
export const authForm = "ap-auth__fields";
export const authFoot = "ap-auth__alt";

/**
 * The account screens (design system: AuthLayout): a black half with one sentence and the count bars, the
 * form on the white half. Full page: no top bar.
 */
export function AuthLayout({
  title,
  lead,
  quote,
  children,
}: {
  title: string;
  lead?: string;
  quote?: string;
  children: ReactNode;
}) {
  return (
    <DsAuthLayout title={title} lead={lead} quote={quote ?? m.ds_auth_quote()}>
      {children}
    </DsAuthLayout>
  );
}
