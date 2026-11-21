import type { Entity } from "../../api/index.ts";
import { m } from "../../paraglide/messages.js";

/** The three top lists, by their French path segment. */
export const KINDS = {
  artistes: { entity: "artists", title: m.tab_artists },
  albums: { entity: "releases", title: m.tab_albums },
  titres: { entity: "recordings", title: m.tab_tracks },
} as const satisfies Record<string, { entity: Entity; title: () => string }>;

export type Kind = keyof typeof KINDS;

export const isKind = (value: string): value is Kind => value in KINDS;
