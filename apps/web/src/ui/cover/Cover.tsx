import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { artworkSources, type Lookup } from "./artwork.ts";
import { coverPattern } from "./pattern.ts";

const frame = css({
  position: "relative",
  width: "100%",
  aspectRatio: "1",
  overflow: "hidden",
  containerType: "inline-size",
  flexShrink: 0,
});
const abs = css({ position: "absolute" });

interface CoverProps {
  /** What the cover stands for (album or artist + album): picks the pattern. */
  seed: string;
  /** Printed on the cover, like a sleeve. Leave out for thumbnails. */
  title?: string;
  /** Round for artists. */
  round?: boolean;
  /** Fixed side in px; fluid (fills the column) when left out. */
  size?: number;
  /** MusicBrainz release MBID: shows the real sleeve when the Cover Art Archive has one. */
  mbid?: string | null;
  /** Otherwise (or if that fails), find the artwork by name. */
  lookup?: Lookup;
  className?: string;
}

/** A square sleeve (round for artists): no radius, no shadow, a motif in two colours. */
export function Cover({ seed, title, round, size, mbid, lookup, className }: CoverProps) {
  const p = coverPattern(seed);
  const fg = { background: p.fg };
  return (
    <div
      aria-hidden="true"
      className={cx(frame, className)}
      style={{
        background: p.bg,
        borderRadius: round ? "50%" : 0,
        width: size,
        height: size,
      }}
    >
      {p.motif === "sun" && (
        <div
          className={abs}
          style={{
            ...fg,
            left: "22%",
            top: "26%",
            width: "56%",
            height: "56%",
            borderRadius: "50%",
          }}
        />
      )}
      {p.motif === "ring" && (
        <div
          className={abs}
          style={{
            left: "18%",
            top: "14%",
            width: "64%",
            height: "64%",
            borderRadius: "50%",
            boxSizing: "border-box",
            border: `5cqw solid ${p.fg}`,
          }}
        />
      )}
      {p.motif === "arch" && (
        <div
          className={abs}
          style={{
            ...fg,
            left: "16%",
            right: "16%",
            bottom: 0,
            height: "62%",
            borderRadius: "999px 999px 0 0",
          }}
        />
      )}
      {p.motif === "split" && (
        <div className={abs} style={{ ...fg, left: 0, top: 0, width: "46%", height: "100%" }} />
      )}
      {p.motif === "stripes" && (
        <div
          className={abs}
          style={{
            left: "12%",
            right: "12%",
            top: "16%",
            height: "52%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...fg, height: "9%" }} />
          ))}
        </div>
      )}
      {title ? (
        <span
          className={cx(
            abs,
            css({
              left: "8%",
              right: "8%",
              bottom: "7%",
              fontFamily: "display",
              fontStretch: "62%",
              fontSize: "13cqw",
              fontWeight: "900",
              lineHeight: 0.95,
              textTransform: "uppercase",
              overflowWrap: "anywhere",
            }),
          )}
          style={{ color: p.ink }}
        >
          {title}
        </span>
      ) : null}
      <Artwork
        sources={artworkSources(mbid, lookup, size !== undefined && size <= 64 ? 250 : 500)}
      />
    </div>
  );
}

/** The real sleeve over the pattern: tries each source in turn (also failures before hydration), else nothing. */
function Artwork({ sources }: { sources: string[] }) {
  const key = sources.join("|");
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => setIndex(0), [key]);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setIndex((i) => i + 1);
  }, [key, index]);
  const src = sources[index];
  if (!src) return null;
  return (
    <img
      ref={ref}
      key={src}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setIndex((i) => i + 1)}
      className={css({
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      })}
    />
  );
}
