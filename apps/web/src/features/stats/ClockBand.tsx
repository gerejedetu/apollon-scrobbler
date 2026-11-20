import { css } from "styled-system/css";
import type { Clock } from "../../api/index.ts";
import { barWidth, formatShare } from "../../lib/format/index.ts";
import { HourClock } from "../../ui/charts/index.ts";
import { dayPart, shareBetween, weekdayName, weekdayShort } from "./copy.ts";

/** The black band: the 24-hour clock, "Tu es du soir.", and listens per weekday. */
export function ClockBand({ clock }: { clock: Clock }) {
  const hours = Array.from(
    { length: 24 },
    (_, h) => clock.hours.find((x) => x.hour === h)?.listenCount ?? 0,
  );
  if (hours.every((h) => h === 0)) return null;
  const favourite = hours.indexOf(Math.max(...hours));
  const part = dayPart(favourite);
  const share = shareBetween(hours, part.from, part.to);
  const weekdays = clock.weekdays;
  const maxDay = Math.max(...weekdays.map((w) => w.listenCount));
  const busiest = weekdays.find((w) => w.listenCount === maxDay);
  const quietest = weekdays.reduce((a, b) => (b.listenCount < a.listenCount ? b : a), weekdays[0]!);
  return (
    <section
      className={css({
        bg: "ink",
        color: "page",
        p: "40px",
        display: "flex",
        flexWrap: "wrap",
        gap: "40px",
        alignItems: "center",
      })}
    >
      <HourClock hours={hours} favourite={favourite} />
      <div
        className={css({
          flex: "1 1 320px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        })}
      >
        <h2 className={css({ m: 0, textStyle: "wide", fontSize: "36px", lineHeight: 1.05 })}>
          {part.title}
        </h2>
        <p className={css({ m: 0, fontSize: "15px", lineHeight: "23px", color: "nightMuted" })}>
          {formatShare(share, 0)} de tes écoutes tombent entre {part.from} h et{" "}
          {part.to === 24 ? "minuit" : `${part.to} h`}.
          {busiest && quietest && busiest !== quietest
            ? ` Le ${weekdayName(busiest.weekday)} est ton jour le plus chargé, le ${weekdayName(quietest.weekday)} le plus calme.`
            : ""}
        </p>
        <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
          {weekdays.map((w) => (
            <div
              key={w.weekday}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "12px",
              })}
            >
              <span className={css({ width: "30px", color: "nightMuted" })}>
                {weekdayShort(w.weekday)}
              </span>
              <div className={css({ flex: 1, height: "10px", bg: "nightTrack" })}>
                <div
                  className={css({ height: "10px" })}
                  style={{
                    width: barWidth(w.listenCount, maxDay),
                    background: w === busiest ? "#F7B52C" : "#FFFFFF",
                  }}
                />
              </div>
              <span className={css({ width: "32px", textAlign: "right", color: "nightMuted" })}>
                {w.listenCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
