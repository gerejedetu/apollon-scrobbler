import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { artworkSources, type Lookup } from "./artwork.ts";

const frame = css({
  position: "relative",
  width: "100%",
  aspectRatio: "1",
  overflow: "hidden",
  containerType: "inline-size",
  flexShrink: 0,
});

interface CoverProps {
  /** Round for artists. */
  round?: boolean;
  /** Fixed side in px; fluid (fills the column) when left out. */
  size?: number;
  /** MusicBrainz release MBID: shows the real sleeve when the Cover Art Archive has one. */
  mbid?: string | null;
  /** Otherwise (or if that fails), find the artwork by name. */
  lookup?: Lookup;
  /** Last resort: the thumbnail of the YouTube video the listen was played from. */
  youtube?: string | null;
  className?: string;
}

/**
 * A square sleeve (round for artists). Until real artwork loads, or when none exists anywhere, a neutral
 * tile: grey with a music note, from theme tokens so it fits light and dark mode alike.
 */
export function Cover({ round, size, mbid, lookup, youtube, className }: CoverProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(frame, css({ bg: "chip", color: "placeholder" }), className)}
      style={{ borderRadius: round ? "50%" : 0, width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={css({
          position: "absolute",
          left: "32%",
          top: "32%",
          width: "36%",
          height: "36%",
        })}
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <Artwork
        sources={artworkSources(
          mbid,
          lookup,
          size !== undefined && size <= 64 ? 250 : 500,
          youtube,
        )}
      />
    </div>
  );
}

/**
 * The real sleeve over the placeholder: tries each source in turn (also failures before hydration), else nothing.
 * A name lookup (/covers) that fails is retried once a few seconds later: on a first visit a page asks for many
 * new covers at once and the artwork provider may be briefly over quota.
 */
function Artwork({ sources }: { sources: string[] }) {
  const key = sources.join("|");
  const [index, setIndex] = useState(0);
  const [retried, setRetried] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setIndex(0);
    setRetried(false);
  }, [key]);
  const failed = () => {
    const current = sources[index];
    const isLast = index === sources.length - 1;
    if (isLast && !retried && current?.startsWith("/covers?")) {
      setRetried(true);
      return;
    }
    setIndex((i) => i + 1);
  };
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) failed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, index]);
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (!retried) return;
    setDelayed(true);
    const t = setTimeout(() => setDelayed(false), 4000);
    return () => clearTimeout(t);
  }, [retried]);
  const base = sources[index];
  if (!base || delayed) return null;
  const src = retried && index === sources.length - 1 ? `${base}&retry=1` : base;
  return (
    <img
      ref={ref}
      key={src}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={failed}
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
