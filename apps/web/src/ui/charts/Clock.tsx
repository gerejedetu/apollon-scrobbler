import { css } from "styled-system/css";

/**
 * 24 spokes around a dial, one per hour, longer when more is played. Midnight at the top.
 * The busiest hour is violet, busy ones yellow, the rest grey (design: "Tu es du soir").
 */
export function HourClock({ hours, favourite }: { hours: number[]; favourite: number }) {
  const max = Math.max(1, ...hours);
  const mark = (style: Record<string, string | number>, text: string) => (
    <span
      className={css({ position: "absolute", fontSize: "10px", color: "nightFaint" })}
      style={style}
    >
      {text}
    </span>
  );
  return (
    <div
      role="img"
      aria-label={`Écoutes par heure, pic à ${favourite} h`}
      className={css({ flex: "0 0 280px", height: "280px", position: "relative", mx: "auto" })}
    >
      {hours.map((v, i) => {
        const share = v / max;
        const color = i === favourite ? "#6E44FF" : share >= 0.6 ? "#F7B52C" : "#4A4A4A";
        return (
          <div
            key={i}
            className={css({
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: "50%",
              width: "8px",
              ml: "-4px",
            })}
            style={{ transformOrigin: "50% 100%", transform: `rotate(${i * 15}deg)` }}
          >
            <div
              className={css({ position: "absolute", left: 0, right: 0, bottom: "52px" })}
              style={{ height: Math.round(share * 76) + 4, background: color }}
            />
          </div>
        );
      })}
      <div
        className={css({
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
        })}
      >
        <span className={css({ textStyle: "narrow", fontSize: "40px", lineHeight: 1 })}>
          {favourite} h
        </span>
        <span className={css({ fontSize: "11px", color: "nightMuted" })}>ton heure</span>
      </div>
      {mark({ top: -2, left: "50%", transform: "translateX(-50%)" }, "0 h")}
      {mark({ right: -6, top: "50%", transform: "translateY(-50%)" }, "6 h")}
      {mark({ bottom: -2, left: "50%", transform: "translateX(-50%)" }, "12 h")}
      {mark({ left: -10, top: "50%", transform: "translateY(-50%)" }, "18 h")}
    </div>
  );
}
