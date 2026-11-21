import { m } from "../paraglide/messages.js";
/** Better Auth error codes, said the Apollon way. Unknown codes fall back to the server's message. */
/** Message functions, called when shown so they follow the current language. */
const MESSAGES: Record<string, () => string> = {
  INVALID_EMAIL_OR_PASSWORD: m.auth_err_credentials,
  INVALID_USERNAME_OR_PASSWORD: m.auth_err_credentials,
  USER_ALREADY_EXISTS: m.auth_err_email_taken,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: m.auth_err_email_taken,
  USERNAME_IS_ALREADY_TAKEN: m.auth_err_name_taken,
  USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER: m.auth_err_name_taken,
  INVALID_USERNAME: m.auth_err_name_invalid,
  USERNAME_TOO_SHORT: m.auth_err_name_short,
  USERNAME_TOO_LONG: m.auth_err_name_long,
  PASSWORD_TOO_SHORT: m.auth_err_password_short,
  PASSWORD_TOO_LONG: m.auth_err_password_long,
  INVALID_EMAIL: m.auth_err_email_invalid,
  EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED: m.auth_err_signup_closed,
};

/** Which field of the sign-up form an error belongs to, if any. */
export type AuthField = "username" | "email" | "password";

const FIELDS: Record<string, AuthField> = {
  USERNAME_IS_ALREADY_TAKEN: "username",
  USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER: "username",
  INVALID_USERNAME: "username",
  USERNAME_TOO_SHORT: "username",
  USERNAME_TOO_LONG: "username",
  USER_ALREADY_EXISTS: "email",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "email",
  INVALID_EMAIL: "email",
  PASSWORD_TOO_SHORT: "password",
  PASSWORD_TOO_LONG: "password",
};

export interface AuthFailure {
  message: string;
  field?: AuthField;
}

export function describeAuthError(
  error: { code?: string; message?: string; status?: number } | null | undefined,
): AuthFailure {
  const code = error?.code ?? "";
  if (error?.status === 429) return { message: m.auth_err_rate_limit() };
  return {
    message: MESSAGES[code]?.() ?? error?.message ?? m.error_generic(),
    field: FIELDS[code],
  };
}
