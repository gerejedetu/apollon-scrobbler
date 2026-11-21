/** Same rules as the API (shared from core), worded for the form. */
import { isValidUserName } from "@scrobbler/core";
import { m } from "../../paraglide/messages.js";

export const MIN_PASSWORD = 8;

export function validateUserName(name: string): string | null {
  if (name.length > 64) return m.username_too_long();
  if (isValidUserName(name)) return null;
  return m.username_chars();
}
