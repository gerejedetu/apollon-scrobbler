import { css } from "styled-system/css";
import type { Range } from "../../api/index.ts";
import { localDate } from "../../lib/format/index.ts";
import { Main } from "../../ui/layout/index.ts";
import { DiversityCard, SessionsCard, StreakCard } from "./Cards.tsx";
import { ClockBand } from "./ClockBand.tsx";
import { previousLabel } from "./copy.ts";
import { Daily } from "./Daily.tsx";
import type { StatsData } from "./data.ts";
import { Hero } from "./Hero.tsx";
import { Kpis } from "./Kpis.tsx";
import { FirstTimes, ForgottenList, OnThisDayList, WrappedCta } from "./Lists.tsx";
import { Trends } from "./Trends.tsx";

/** The stats page, top to bottom as in the design. */
export function StatsPage({
  userName,
  range,
  data,
}: {
  userName: string;
  range: Range;
  data: StatsData;
}) {
  const daily = (data.activity.days ?? []).map((d) => d.listenCount);
  const year = localDate(data.summary.to).getUTCFullYear();
  return (
    <Main gap={72} padding="16px 24px 64px">
      <Hero userName={userName} range={range} summary={data.summary} compare={data.compare} />
      <Kpis compare={data.compare} summary={data.summary} daily={daily} />
      <Daily activity={data.activity} range={range} />
      <ClockBand clock={data.clock} />
      {data.trends ? (
        <Trends
          trends={data.trends}
          currentLabel="cette période"
          previousLabel={previousLabel(range)}
        />
      ) : null}
      <section
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        })}
      >
        <StreakCard streaks={data.streaks} last30={data.last30} />
        <DiversityCard diversity={data.diversity} topArtist={data.topArtist} />
        <SessionsCard sessions={data.sessions} oneShots={data.oneShots} />
      </section>
      <FirstTimes userName={userName} discoveries={data.discoveries} />
      <ForgottenList userName={userName} forgotten={data.forgotten} />
      <OnThisDayList onThisDay={data.onThisDay} />
      <WrappedCta userName={userName} year={year} />
    </Main>
  );
}
