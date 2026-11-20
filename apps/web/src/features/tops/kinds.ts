import type { Entity } from "../../api/index.ts";

/** The three top lists, by their French path segment. */
export const KINDS = {
  artistes: { entity: "artists", title: "Artistes" },
  albums: { entity: "releases", title: "Albums" },
  titres: { entity: "recordings", title: "Titres" },
} as const satisfies Record<string, { entity: Entity; title: string }>;

export type Kind = keyof typeof KINDS;

export const isKind = (value: string): value is Kind => value in KINDS;
