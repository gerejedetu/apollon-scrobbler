import { css } from "styled-system/css";

const bars = css({
  display: "inline-flex",
  alignItems: "flex-end",
  gap: "2px",
  height: "14px",
  flexShrink: 0,
});
const bar = css({
  width: "3px",
  height: "100%",
  bg: "violet",
  borderRadius: "1px",
  transformOrigin: "bottom",
  animation: "equalize 900ms ease-in-out infinite",
  // Still bars at mixed heights when the viewer asked for less motion.
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

/** The bars play at different speeds and offsets; the still heights are used without animation. */
const BARS = [
  { delay: "-200ms", duration: "800ms", still: 0.5 },
  { delay: "-500ms", duration: "1000ms", still: 1 },
  { delay: "-100ms", duration: "700ms", still: 0.7 },
  { delay: "-350ms", duration: "900ms", still: 0.85 },
];

/** "Playing now": moving music bars, announced as `label` to assistive tech. */
export function Equalizer({ label }: { label: string }) {
  return (
    <span role="img" aria-label={label} className={bars}>
      {BARS.map((b, i) => (
        <span
          key={i}
          className={bar}
          style={{
            animationDelay: b.delay,
            animationDuration: b.duration,
            transform: `scaleY(${b.still})`,
          }}
        />
      ))}
    </span>
  );
}
