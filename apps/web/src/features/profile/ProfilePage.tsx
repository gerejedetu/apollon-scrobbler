import { css } from "styled-system/css";
import type { Me, Range } from "../../api/index.ts";
import { Main } from "../../ui/layout/index.ts";
import type { ProfileData } from "./data.ts";
import { ProfileHeader, ProfileTabs } from "./ProfileHeader.tsx";
import {
  MilestoneList,
  NowPlayingCard,
  RecentActivity,
  RecentListens,
  Rotation,
  StreakFigures,
  TopAlbums,
} from "./sections.tsx";

/** The library ("Bibliothèque"): profile header, tabs, then tops and listens beside a side column. */
export function ProfilePage({
  userName,
  data,
  me,
  range,
}: {
  userName: string;
  data: ProfileData;
  me: Me | null;
  range: Range;
}) {
  return (
    <Main gap={28}>
      <ProfileHeader userName={userName} summary={data.summary} me={me} />
      <ProfileTabs userName={userName} summary={data.summary} />
      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        })}
      >
        <div
          className={css({
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "40px",
          })}
        >
          <TopAlbums userName={userName} top={data.top} range={range} />
          <Rotation userName={userName} onRepeat={data.onRepeat} />
          <RecentListens
            userName={userName}
            listens={data.listens.listens}
            nowPlaying={data.nowPlaying.nowPlaying}
          />
        </div>
        <aside
          className={css({
            flex: "1 1 260px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          })}
        >
          <NowPlayingCard nowPlaying={data.nowPlaying.nowPlaying} />
          <MilestoneList milestones={data.milestones} />
          <RecentActivity days={data.days} />
          <StreakFigures streaks={data.streaks} />
        </aside>
      </div>
    </Main>
  );
}
