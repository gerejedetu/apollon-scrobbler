/** Better Auth error codes, said the Needle way. Unknown codes fall back to the server's message. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  INVALID_USERNAME_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet e-mail.",
  USERNAME_IS_ALREADY_TAKEN: "Ce nom est déjà pris.",
  USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER: "Ce nom est déjà pris.",
  INVALID_USERNAME: "Ce nom n'est pas valide.",
  USERNAME_TOO_SHORT: "Ce nom est trop court.",
  USERNAME_TOO_LONG: "Ce nom est trop long.",
  PASSWORD_TOO_SHORT: "8 caractères minimum.",
  PASSWORD_TOO_LONG: "Ce mot de passe est trop long.",
  INVALID_EMAIL: "Cette adresse e-mail n'est pas valide.",
  EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED: "Les inscriptions sont fermées sur ce serveur.",
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
  if (error?.status === 429) return { message: "Trop d'essais. Réessaie dans une minute." };
  return {
    message: MESSAGES[code] ?? error?.message ?? "Quelque chose n'a pas marché. Réessaie.",
    field: FIELDS[code],
  };
}
