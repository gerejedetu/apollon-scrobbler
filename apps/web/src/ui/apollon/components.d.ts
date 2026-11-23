// Types of components.js, from the design system's index.d.ts. Components also take the extra props their
// notes mention (visitor, readOnly, href…), hence Extra.
import type * as React from "react";
type Extra = { [prop: string]: any };

// The API's own shapes (the design system mirrors them).
import type { Favourite, Listen, Mbids, TopItem, Track } from "@scrobbler/client";
export type { Favourite, Listen, Mbids, TopItem, Track };
export type Entity = "artists" | "recordings" | "releases";

export interface SiteHeaderProps {
  userName?: string;
  avatarUrl?: string;
  brand?: string;
  homeHref?: string;
  links?: { label: string; href: string }[];
  onSearch?: () => void;
}
export interface ProfileHeaderProps {
  userName: string;
  createdAt?: number;
  avatarUrl?: string;
  imageUrl?: string;
  tabs?: (string | { label: string; href: string })[];
  activeTab?: string;
  onTab?: (tab: string) => void;
  topTrack?: { track: string; artist: string; album?: string | null };
  topTrackCoverUrl?: string;
}
export interface StatInlineProps {
  stats: { label: string; value: number | string }[];
}
export interface ButtonProps {
  variant?: "primary" | "dark" | "light" | "band" | "secondary" | "danger";
  size?: "md" | "sm";
  icon?: "play" | "heart" | "trash" | "arrow" | "search";
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  "aria-label"?: string;
  children?: React.ReactNode;
}
export interface PlayButtonProps {
  label?: string;
  onClick?: () => void;
}
export interface LoveButtonProps {
  loved?: boolean;
  onToggle?: (next: boolean) => void;
}
export interface LibraryTabsProps {
  tabs?: { value: string; label: string; icon?: string; href?: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}
export interface SectionHeaderProps {
  title: string;
  periods?: { value: string; label: string }[];
  period?: string;
  defaultPeriod?: string;
  onPeriodChange?: (value: string) => void;
  showPeriod?: boolean;
  actions?: React.ReactNode;
}
export interface MoreLinkProps {
  href?: string;
  children: React.ReactNode;
}
export interface TrackRowProps {
  listen: Listen | Track;
  nowPlaying?: boolean;
  coverUrl?: string;
  loved?: boolean;
  onToggleLove?: (next: boolean) => void;
  onPlay?: () => void;
  /** Unix seconds, for stable relative times */ now?: number;
}
export interface TrackListProps {
  listens: Listen[];
  nowPlaying?: Track | null;
  nowPlayingCoverUrl?: string;
  groupByDay?: boolean;
  now?: number;
  isLoved?: (l: Listen) => boolean;
  coverFor?: (l: Listen) => string | undefined;
  onToggleLove?: (l: Listen, next: boolean) => void;
}
export interface TopChartProps {
  items: TopItem[];
  entity?: Entity;
  offset?: number;
  unit?: string;
  isLoved?: (i: TopItem) => boolean;
  coverFor?: (i: TopItem) => string | undefined;
}
export interface ArtworkGridProps {
  entity?: "artists" | "releases";
  items: { name: string; sub?: string; listenCount?: number; imageUrl?: string; href?: string }[];
}
export interface ActionCardProps {
  title: string;
  hint?: string;
  art?: "obsession" | "discover" | "report";
  onClick?: () => void;
}
export interface ObsessionCardProps {
  obsession: Favourite | null;
  userName?: string;
  coverUrl?: string;
  onSet?: () => void;
  onClear?: () => void;
}
export interface ReportCardProps {
  title: string;
  subtitle?: string;
  bars?: number[];
  href?: string;
}
/** heatmap: 7 rows (Monday first) × 24 hourly counts, from stats/clock */
export interface ClockHeatmapProps {
  heatmap: number[][];
}
export interface TrendBadgeProps {
  direction?: "up" | "down" | "flat" | "new";
  delta?: number;
  label?: string;
}

export declare const SiteHeader: (p: SiteHeaderProps & Extra) => React.JSX.Element;
export declare const ProfileHeader: (p: ProfileHeaderProps & Extra) => React.JSX.Element;
export declare const StatInline: (p: StatInlineProps & Extra) => React.JSX.Element;
export declare const Button: (p: ButtonProps & Extra) => React.JSX.Element;
export declare const PlayButton: (p: PlayButtonProps & Extra) => React.JSX.Element;
export declare const LoveButton: (p: LoveButtonProps & Extra) => React.JSX.Element;
export declare const LibraryTabs: (p: LibraryTabsProps & Extra) => React.JSX.Element;
export declare const SectionHeader: (p: SectionHeaderProps & Extra) => React.JSX.Element;
export declare const MoreLink: (p: MoreLinkProps & Extra) => React.JSX.Element;
export declare const TrackRow: (p: TrackRowProps & Extra) => React.JSX.Element;
export declare const TrackList: (p: TrackListProps & Extra) => React.JSX.Element;
export declare const TopChart: (p: TopChartProps & Extra) => React.JSX.Element;
export declare const ArtworkGrid: (p: ArtworkGridProps & Extra) => React.JSX.Element;
export declare const ActionCard: (p: ActionCardProps & Extra) => React.JSX.Element;
export declare const ObsessionCard: (p: ObsessionCardProps & Extra) => React.JSX.Element;
export declare const ReportCard: (p: ReportCardProps & Extra) => React.JSX.Element;
export declare const ClockHeatmap: (p: ClockHeatmapProps & Extra) => React.JSX.Element;
export declare const TrendBadge: (p: TrendBadgeProps & Extra) => React.JSX.Element;

// ---- Layout ----
export interface PageProps {
  children: React.ReactNode;
}
/** Two columns (2fr / 1fr). underCover: the sidebar starts below an EntityHero cover. */
export interface ColumnsProps {
  main: React.ReactNode[];
  side: React.ReactNode[];
  underCover?: boolean;
}
export interface IconButtonProps {
  icon: "heart" | "target" | "dots" | "play" | "trash" | "plus" | "close";
  label: string;
  pressed?: boolean;
  onClick?: () => void;
}
export interface MenuProps {
  items: ({ label: string; icon?: string; danger?: boolean; onClick?: () => void } | "-")[];
}

// ---- Detail pages ----
export interface EntityHeroProps {
  kind: "artist" | "album" | "track";
  title: string;
  artist?: string;
  artistHref?: string;
  imageUrl?: string;
  /** album/track: shows the hanging cover (null = placeholder) */ coverUrl?: string | null;
  rank?: number;
  stats?: { label: string; value: number | string }[];
  actions?: React.ReactNode;
  loved?: boolean;
  isObsession?: boolean;
  onPlay?: () => void;
  onToggleLove?: () => void;
  onObsession?: () => void;
  onMore?: () => void;
}
export interface FactListProps {
  facts: { label: string; value: React.ReactNode }[];
}
export interface TagListProps {
  tags: string[];
  selected?: string[];
  onToggle?: (tag: string) => void;
  onAdd?: () => void;
}
export interface AlbumGridProps {
  items: { title: string; artist?: string; meta?: string; coverUrl?: string; href?: string }[];
  columns?: number;
}
export interface MediaRowProps {
  title: string;
  sub?: string;
  meta?: string;
  coverUrl?: string;
  rank?: number;
  trailing?: React.ReactNode;
}
export interface TrendChartProps {
  points: { label: string; value: number; tick?: string }[];
  variant?: "line" | "bars";
  caption?: string;
  height?: number;
  tickEvery?: number;
  highlightLast?: boolean;
}
export interface LinkListProps {
  links: { label: string; href?: string; icon?: "web" | "search" | "external" | "play" }[];
}

// ---- Insights ----
export interface InsightCardProps {
  label: string;
  value?: number | string;
  unit?: string;
  caption?: string;
  children?: React.ReactNode;
}
/** stats/streaks + the last days of stats/activity */
export interface StreakCardProps {
  current: { days: number; since?: string };
  longest: { days: number; from?: string; to?: string };
  days?: { date: string; listenCount: number }[];
}
/** stats/milestones */
export interface MilestoneListProps {
  items: { n: number; listenedAt: number; artist: string; track: string }[];
  next?: number;
  listenCount?: number;
}
/** stats/on-this-day */
export interface OnThisDayProps {
  years: { year: number; listens: { artist: string; track: string; listenCount?: number }[] }[];
  dateLabel?: string;
}
/** stats/wrapped */
export interface WrappedHeroProps {
  data: {
    year: number;
    listenCount: number;
    artistCount: number;
    activeDays: number;
    longestStreakDays: number;
    listeningTimeMs?: number;
    favouriteHour?: { hour: number };
    busiestDay?: { date: string; listenCount: number };
    topArtists?: { artist: string; listenCount: number }[];
  };
  userName?: string;
}
export interface RankedListProps {
  items: { title: string; sub?: string; listenCount: number }[];
}

// ---- Forms & feedback ----
export interface TextFieldProps {
  label?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: any) => void;
  hint?: string;
  error?: string;
  icon?: string;
  size?: "md" | "lg";
  autoComplete?: string;
}
export interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: any) => void;
  hint?: string;
}
export interface ToggleProps {
  label: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: any) => void;
}
export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
}
export interface ToastProps {
  kind?: "success" | "error" | "info";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}
export interface EmptyStateProps {
  title: string;
  text?: string;
  icon?: string;
  actionLabel?: string;
  actionVariant?: string;
  onAction?: () => void;
}
export interface SkeletonProps {
  variant?: "row" | "tile" | "text";
  count?: number;
}

export declare const Page: (p: PageProps & Extra) => React.JSX.Element;
export declare const Columns: (p: ColumnsProps & Extra) => React.JSX.Element;
export declare const IconButton: (p: IconButtonProps & Extra) => React.JSX.Element;
export declare const Menu: (p: MenuProps & Extra) => React.JSX.Element;
export declare const EntityHero: (p: EntityHeroProps & Extra) => React.JSX.Element;
export declare const FactList: (p: FactListProps & Extra) => React.JSX.Element;
export declare const TagList: (p: TagListProps & Extra) => React.JSX.Element;
export declare const AlbumGrid: (p: AlbumGridProps & Extra) => React.JSX.Element;
export declare const MediaRow: (p: MediaRowProps & Extra) => React.JSX.Element;
export declare const TrendChart: (p: TrendChartProps & Extra) => React.JSX.Element;
export declare const LinkList: (p: LinkListProps & Extra) => React.JSX.Element;
export declare const InsightCard: (p: InsightCardProps & Extra) => React.JSX.Element;
export declare const StreakCard: (p: StreakCardProps & Extra) => React.JSX.Element;
export declare const MilestoneList: (p: MilestoneListProps & Extra) => React.JSX.Element;
export declare const OnThisDay: (p: OnThisDayProps & Extra) => React.JSX.Element;
export declare const WrappedHero: (p: WrappedHeroProps & Extra) => React.JSX.Element;
export declare const RankedList: (p: RankedListProps & Extra) => React.JSX.Element;
export declare const TextField: (p: TextFieldProps & Extra) => React.JSX.Element;
export declare const SearchField: (p: TextFieldProps & Extra) => React.JSX.Element;
export declare const Select: (p: SelectProps & Extra) => React.JSX.Element;
export declare const Toggle: (p: ToggleProps & Extra) => React.JSX.Element;
export declare const Pagination: (p: PaginationProps & Extra) => React.JSX.Element;
export declare const Toast: (p: ToastProps & Extra) => React.JSX.Element;
export declare const EmptyState: (p: EmptyStateProps & Extra) => React.JSX.Element;
export declare const Skeleton: (p: SkeletonProps & Extra) => React.JSX.Element;

// ---- Reports (always dark) ----
export type Category = "artists" | "albums" | "tracks";
export interface ReportNavProps {
  rangeLabel: string;
  periods?: { value: string; label: string }[];
  period?: string;
  defaultPeriod?: string;
  onPeriod?: (v: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}
export interface ReportHeroProps {
  count: number;
  unit?: string;
  deltaPercent?: number;
  deltaLabel?: string;
  days: { label: string; current: number; previous: number }[];
  currentLabel?: string;
  previousLabel?: string;
}
export interface CategoryTileProps {
  kind: Category;
  value: number;
  deltaPercent?: number;
  spark?: number[];
  label?: string;
}
export interface TopFeatureProps {
  kind: Category;
  items: { title: string; sub?: string; listenCount: number; imageUrl?: string }[];
  chip?: string;
}
export interface ReportStatProps {
  label: string;
  value: number | string;
  unit?: string;
  deltaPercent?: number;
  caption?: string;
}
export interface ReportMiniProps {
  title: string;
  sub?: string;
  coverUrl?: string;
}
export interface CompareBarsProps {
  rows: { kind: Category; current: number; previous: number; label?: string }[];
  previousLabel?: string;
}
export interface FingerprintRadarProps {
  axes: { label: string; value: number; previous?: number; display?: string }[];
  currentLabel?: string;
  previousLabel?: string;
}
export interface HourClockProps {
  hours: number[];
}
export declare const ReportPage: (p: { children: React.ReactNode } & Extra) => React.JSX.Element;
export declare const ReportNav: (p: ReportNavProps & Extra) => React.JSX.Element;
export declare const ReportHero: (p: ReportHeroProps & Extra) => React.JSX.Element;
export declare const CategoryTile: (p: CategoryTileProps & Extra) => React.JSX.Element;
export declare const TopFeature: (p: TopFeatureProps & Extra) => React.JSX.Element;
export declare const ReportStat: (p: ReportStatProps & Extra) => React.JSX.Element;
export declare const ReportMini: (p: ReportMiniProps & Extra) => React.JSX.Element;
export declare const ReportSection: (
  p: { title?: string; children: React.ReactNode } & Extra,
) => React.JSX.Element;
export declare const ReportPanel: (
  p: { title: string; children: React.ReactNode } & Extra,
) => React.JSX.Element;
export declare const CompareBars: (p: CompareBarsProps & Extra) => React.JSX.Element;
export declare const FingerprintRadar: (p: FingerprintRadarProps & Extra) => React.JSX.Element;
export declare const HourClock: (p: HourClockProps & Extra) => React.JSX.Element;

// ---- Profile sub-pages ----
// ProfileHeader also takes: topLabel?: string ("Obsession du moment"), onTopPlay?: () => void
export interface PageTitleProps {
  title: string;
  count?: number;
  onPlayAll?: () => void;
  playLabel?: string;
  actions?: React.ReactNode;
}
export interface ObsessionTileProps {
  obsession: Favourite;
  coverUrl?: string;
  current?: boolean;
  href?: string;
}
export interface SiteFooterProps {
  columns?: { title: string; links: (string | { label: string; href: string })[] }[];
  timeZone?: string;
  version?: string;
}
export declare const PageTitle: (p: PageTitleProps & Extra) => React.JSX.Element;
export declare const ObsessionTile: (p: ObsessionTileProps & Extra) => React.JSX.Element;
export declare const SiteFooter: (p: SiteFooterProps & Extra) => React.JSX.Element;

// ---- Brand, visitors & auth ----
export interface LogoProps {
  tone?: "default" | "on-dark" | "gold";
  size?: number;
}
// SiteHeader also takes: visitor?: boolean, signupOpen?: boolean, loginHref?: string, signupHref?: string
// TrackList, TrackRow, TopChart also take: readOnly?: boolean (hearts shown, not clickable)
export interface NoticeBarProps {
  message: string;
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
}
export interface AuthLayoutProps {
  title: string;
  lead?: string;
  quote?: string;
  children: React.ReactNode;
}
export interface LandingHeroProps {
  title?: string;
  lead?: string;
  actions?: React.ReactNode;
}
export interface FeatureListProps {
  items?: { icon?: string; title: string; text: string }[];
}
export declare const Logo: (p: LogoProps & Extra) => React.JSX.Element;
export declare const NoticeBar: (p: NoticeBarProps & Extra) => React.JSX.Element;
export declare const AuthLayout: (p: AuthLayoutProps & Extra) => React.JSX.Element;
export declare const LandingHero: (p: LandingHeroProps & Extra) => React.JSX.Element;
export declare const FeatureList: (p: FeatureListProps & Extra) => React.JSX.Element;

// ---- Toasts & API keys ----
export interface ApiKey {
  id: string;
  name: string;
  start?: string;
  createdAt: number;
  lastUsedAt?: number | null;
}
export interface ApiKeyListProps {
  keys: ApiKey[];
  revealed?: { name: string; key: string };
  onCreate?: () => void;
  onRevoke?: (k: ApiKey) => void;
  onCopy?: () => void;
  hint?: string;
  now?: number;
}
export declare const ApiKeyList: (p: ApiKeyListProps & Extra) => React.JSX.Element;
/** Fixed bottom-centre container for every Toast. */
export declare const ToastRegion: (p: { children: React.ReactNode } & Extra) => React.JSX.Element;

// ---- Generative art, laurels, appearance ----
// Every cover-showing component falls back to GenArt when no image URL is given.
// ProfileHeader also takes: hours?: number[] (24 counts from stats/clock) → ListeningBanner behind the banner.
// EntityHero: coverUrl === false hides the hanging cover; without imageUrl a GenArt pattern fills the right side.
export interface GenArtProps {
  seed: string;
  kind?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  style?: object;
}
export interface ListeningBannerProps {
  hours: number[];
}
export interface Laurel {
  title: string;
  description?: string;
  value: string;
  tier?: "laurel" | "gold";
  earnedAt?: number | null;
  progress?: { current: number; target: number };
}
export interface LaurelBadgeProps {
  laurel: Laurel;
  compact?: boolean;
}
export interface LaurelGridProps {
  items: Laurel[];
}
export interface LaurelStripProps {
  items: Laurel[];
  total?: number;
  max?: number;
  href?: string;
}
export interface AppearancePickerProps {
  theme?: "light" | "dark" | "marble" | "system";
  defaultTheme?: string;
  accent?: string;
  defaultAccent?: string;
  onTheme?: (t: string) => void;
  onAccent?: (a: string) => void;
}
export declare const GenArt: (p: GenArtProps & Extra) => React.JSX.Element;
export declare const ListeningBanner: (p: ListeningBannerProps & Extra) => React.JSX.Element;
export declare const LaurelBadge: (p: LaurelBadgeProps & Extra) => React.JSX.Element;
export declare const LaurelGrid: (p: LaurelGridProps & Extra) => React.JSX.Element;
export declare const LaurelStrip: (p: LaurelStripProps & Extra) => React.JSX.Element;
export declare const AppearancePicker: (p: AppearancePickerProps & Extra) => React.JSX.Element;

// ---- Search, obsession history, custom accent ----
export interface SearchData {
  query: string;
  artists: { artist: string; listenCount: number }[];
  albums: { artist: string; album: string; mbids?: Mbids; listenCount: number }[];
  tracks: {
    artist: string;
    track: string;
    album?: string | null;
    mbids?: Mbids;
    listenCount: number;
  }[];
}
export interface SearchResultsProps {
  data: SearchData;
  only?: "artists" | "albums" | "tracks";
  coverFor?: (item: any, kind: any) => string | undefined;
  hrefFor?: (item: any, kind: any) => string | undefined;
}
// ObsessionTile also takes: longest?: boolean, now?: number; obsession.until (null while current) comes from GET /users/{u}/obsessions
export interface AccentPickerProps {
  value?: string;
  defaultValue?: string;
  theme?: "light" | "dark" | "marble";
  onChange?: (hex: string) => void;
  preview?: boolean;
}
export declare const SearchResults: (p: SearchResultsProps & Extra) => React.JSX.Element;
export declare const AccentPicker: (p: AccentPickerProps & Extra) => React.JSX.Element;
/** CSS variables that turn any #rrggbb (PATCH /me accent) into the accent, contrast-checked for the theme. */
export declare function accentVars(
  hex: string | null,
  theme?: "light" | "dark" | "marble",
): Record<string, string>;

// ---- Mobile (≤ 720px) ----
// SiteHeader also takes: onMenu?: () => void (burger, phones only). All components adapt below 720px via bundle.css.
export interface MobileTabBarProps {
  active?: string;
  items?: { value: string; label: string; icon: string; href?: string }[];
}
export interface MiniNowPlayingProps {
  track: Track | null;
  coverUrl?: string;
  loved?: boolean;
  onToggleLove?: (next: boolean) => void;
}
export interface MobileMenuProps {
  userName?: string;
  subtitle?: string;
  avatarUrl?: string;
  links?: (string | { label: string; href?: string })[];
  active?: string;
  visitor?: boolean;
  onClose?: () => void;
}
export declare const MobileTabBar: (p: MobileTabBarProps & Extra) => React.JSX.Element;
export declare const MiniNowPlaying: (p: MiniNowPlayingProps & Extra) => React.JSX.Element;
export declare const MobileMenu: (p: MobileMenuProps & Extra) => React.JSX.Element;

// ---- Language ----
// SiteFooter also takes: lang?: "fr" | "en" | false, onLang?: (l: string) => void (select in the bottom bar). MobileMenu takes lang / onLang too.
export interface LangSelectProps {
  value?: "fr" | "en";
  defaultValue?: "fr" | "en";
  tone?: "dark" | "light";
  onChange?: (l: "fr" | "en") => void;
}
export declare const LangSelect: (p: LangSelectProps & Extra) => React.JSX.Element;

export declare const Avatar: (p: Extra) => React.JSX.Element;
export declare const Cover: (p: Extra) => React.JSX.Element;
export declare const Tag: (p: Extra) => React.JSX.Element;
export declare const Delta: (p: Extra) => React.JSX.Element;
export declare const format: {
  number(n: number | null | undefined): string;
  ago(unixSeconds: number, now?: number): string;
  day(unixSeconds: number, now?: number): string;
  date(unixSeconds: number): string;
  plural(n: number, one: string, many: string): string;
};

type IconFn = (filled?: boolean) => React.JSX.Element;
export declare const icons: {
  dots: IconFn;
  heart: IconFn;
  play: IconFn;
  search: IconFn;
  [name: string]: IconFn | undefined;
};
