/**
 * Placeholder artwork: the API has no images, so every album gets a square pattern picked from its name.
 * Same name, same cover, everywhere. Palettes and motifs come from the design's "Pochettes" board.
 */
export type Motif = "sun" | "ring" | "arch" | "split" | "stripes";

export interface CoverPattern {
  bg: string;
  fg: string;
  ink: string;
  motif: Motif;
}

const PALETTES: Omit<CoverPattern, "motif">[] = [
  { bg: "#141414", fg: "#E8E3D9", ink: "#E8E3D9" },
  { bg: "#F2542D", fg: "#F5DFBB", ink: "#1A1A1A" },
  { bg: "#2E4A62", fg: "#E9C46A", ink: "#F5F0E6" },
  { bg: "#E9D8F4", fg: "#7B2CBF", ink: "#2A0E45" },
  { bg: "#0F3D33", fg: "#C5F82A", ink: "#F2F2F2" },
  { bg: "#D9D9D9", fg: "#111111", ink: "#111111" },
  { bg: "#F4D35E", fg: "#0D3B66", ink: "#0D3B66" },
  { bg: "#8E2B2B", fg: "#F7E1D7", ink: "#F7E1D7" },
  { bg: "#1D2B2A", fg: "#9FB8AD", ink: "#E6EFEA" },
  { bg: "#3B1E54", fg: "#F2A7C3", ink: "#F7EAF0" },
  { bg: "#C7D3DD", fg: "#2E4A62", ink: "#14212B" },
  { bg: "#3E6259", fg: "#E9C46A", ink: "#F2F2F2" },
];

const MOTIFS: Motif[] = ["sun", "ring", "arch", "split", "stripes"];

/** FNV-1a: small, stable and well spread for short strings. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function coverPattern(key: string): CoverPattern {
  const h = hash(key.toLowerCase());
  const palette = PALETTES[h % PALETTES.length] ?? PALETTES[0]!;
  const motif = MOTIFS[(h >>> 16) % MOTIFS.length] ?? "sun";
  return { ...palette, motif };
}

/** A solid tone for small swatches (artist avatars, track thumbnails). */
export const coverTone = (key: string) => coverPattern(key).bg;
