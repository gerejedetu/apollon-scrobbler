import { Link } from "@tanstack/react-router";
import { estimateListeningMs } from "../../lib/listening-time.ts";
import { css } from "styled-system/css";
import type { Me, Summary } from "../../api/index.ts";
import { formatCompact, formatCount, formatDate, formatHours } from "../../lib/format/index.ts";
import { PencilIcon } from "../../ui/icons.tsx";
import { CountBadge, Stat } from "../../ui/primitives/index.ts";

/** The big round initial, name, membership line and three totals. */
export function ProfileHeader({
  userName,
  summary,
  me,
}: {
  userName: string;
  summary: Summary;
  /** Set when the viewer is this user: shows the edit link and the private status. */
  me: Me | null;
}) {
  const since = me
    ? `Membre depuis ${formatDate(me.createdAt)}`
    : summary.firstListenedAt
      ? `Première écoute le ${formatDate(summary.firstListenedAt)}`
      : null;
  const status = me ? (me.private ? "profil privé" : "profil public") : null;
  const hours = estimateListeningMs(
    summary.listenCount,
    summary.listeningTime.totalMs,
    summary.listeningTime.listensWithDuration,
  );
  return (
    <section
      className={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px" })}
    >
      <div
        aria-hidden="true"
        className={css({
          width: "120px",
          height: "120px",
          flexShrink: 0,
          borderRadius: "60px",
          bg: "avatar",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "avatarInk",
          textStyle: "wide",
          fontSize: "44px",
        })}
      >
        {userName.charAt(0).toUpperCase()}
      </div>
      <div
        className={css({ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "8px" })}
      >
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "14px",
          })}
        >
          <h1 className={css({ m: 0, textStyle: "name" })}>{userName}</h1>
          {me ? (
            <Link
              to="/reglages"
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
                color: "violet",
                fontSize: "13px",
              })}
            >
              <PencilIcon />
              Modifier le profil
            </Link>
          ) : null}
        </div>
        {since ? (
          <span className={css({ fontSize: "13px", color: "muted" })}>
            {[since, status].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </div>
      <div className={css({ display: "flex", gap: "28px" })}>
        <Stat align="center" value={formatCompact(summary.listenCount)} label="ÉCOUTES" />
        <Stat align="center" value={formatCount(summary.artistCount)} label="ARTISTES" />
        {hours > 0 ? (
          <Stat
            align="center"
            value={`≈ ${formatHours(hours)}`}
            label="D'ÉCOUTE"
            title="Estimé : les écoutes sans durée (imports Last.fm) comptent pour une durée moyenne de titre"
          />
        ) : null}
      </div>
    </section>
  );
}

const tab = css({
  pb: "10px",
  textDecoration: "none",
  color: "muted",
  display: "flex",
  gap: "6px",
  alignItems: "center",
  "&[data-status=active]": {
    color: "ink",
    fontWeight: "500",
    borderBottom: "2px solid token(colors.ink)",
    mb: "-1px",
  },
});

/** Profil · Historique · Artistes · Albums · Titres · Stats, with counts. */
export function ProfileTabs({ userName, summary }: { userName: string; summary: Summary }) {
  const params = { userName };
  return (
    <nav
      aria-label="Onglets du profil"
      className={css({
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 22px",
        borderBottom: "1px solid token(colors.rule)",
        fontSize: "13px",
      })}
    >
      <Link to="/u/$userName" params={params} activeOptions={{ exact: true }} className={tab}>
        Profil
      </Link>
      <Link to="/u/$userName/historique" params={params} className={tab}>
        Historique <CountBadge>{formatCompact(summary.listenCount)}</CountBadge>
      </Link>
      <Link to="/u/$userName/tops/$kind" params={{ userName, kind: "artistes" }} className={tab}>
        Artistes <CountBadge>{formatCompact(summary.artistCount)}</CountBadge>
      </Link>
      <Link to="/u/$userName/tops/$kind" params={{ userName, kind: "albums" }} className={tab}>
        Albums <CountBadge>{formatCompact(summary.releaseCount)}</CountBadge>
      </Link>
      <Link to="/u/$userName/tops/$kind" params={{ userName, kind: "titres" }} className={tab}>
        Titres <CountBadge>{formatCompact(summary.recordingCount)}</CountBadge>
      </Link>
      <Link to="/u/$userName/stats" params={params} className={tab}>
        Stats
      </Link>
    </nav>
  );
}
