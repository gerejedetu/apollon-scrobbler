import { describe, expect, test } from "vite-plus/test";
import { describeAuthError } from "../../auth/errors.ts";
import { validateUserName } from "./validation.ts";

describe("username", () => {
  test("API rules", () => {
    expect(validateUserName("jules")).toBeNull();
    expect(validateUserName("j.u-l_es9")).toBeNull();
    expect(validateUserName("jules dupont")).toMatch(/uniquement/);
    expect(validateUserName("x".repeat(65))).toBe("64 caractères maximum.");
  });
});

describe("auth errors", () => {
  test("known codes are worded and tied to a field", () => {
    expect(describeAuthError({ code: "USERNAME_IS_ALREADY_TAKEN" })).toEqual({
      message: "Ce nom est déjà pris.",
      field: "username",
    });
    expect(describeAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" }).message).toBe(
      "E-mail ou mot de passe incorrect.",
    );
  });
  test("rate limits and unknown codes", () => {
    expect(describeAuthError({ status: 429 }).message).toMatch(/Trop d'essais/);
    expect(describeAuthError({ code: "X", message: "Boom" })).toEqual({
      message: "Boom",
      field: undefined,
    });
  });
});
