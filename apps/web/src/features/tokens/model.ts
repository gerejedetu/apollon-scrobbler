import type { ApiKey } from "../../api/index.ts";
import { m } from "../../paraglide/messages.js";

/** Better Auth has answered both `{ apiKeys }` and a bare array across versions: accept either. */
export function keysOf(answer: { apiKeys: ApiKey[] } | ApiKey[]): ApiKey[] {
  const keys = Array.isArray(answer) ? answer : answer.apiKeys;
  return [...keys].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** "nd_8Kq2…": the start of a key, enough to tell keys apart. */
export const keyPreview = (key: Pick<ApiKey, "start">) => (key.start ? `${key.start}…` : "…");

export const keyName = (key: Pick<ApiKey, "name">) => key.name?.trim() || m.unnamed();

export const TOKEN_NAME_MAX = 32;
