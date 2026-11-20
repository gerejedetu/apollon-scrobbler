/** Same rules as the API (shared from core), worded for the form. */
import { isValidUserName } from "@scrobbler/core";

export const MIN_PASSWORD = 8;

export function validateUserName(name: string): string | null {
  if (name.length > 64) return "64 caractères maximum.";
  if (isValidUserName(name)) return null;
  return "Lettres, chiffres, « _ », « . » ou « - » uniquement.";
}
