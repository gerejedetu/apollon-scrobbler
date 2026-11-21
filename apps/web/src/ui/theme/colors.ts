/**
 * Needle palette: white, black, square covers, one violet for everything clickable, yellow for charts.
 * Every colour has a light and a dark value (boards "Fondations" and "Profil · thème sombre"); components
 * only use these names, so the theme switch is a single attribute on <html> (see lib/theme.ts).
 */
const c = (light: string, dark: string) => ({ value: { base: light, _dark: dark } });

export const semanticColors = {
  page: c("#FFFFFF", "#101010"),
  /** Floating surfaces: menus, tab bar. */
  raised: c("#FFFFFF", "#1C1C1C"),
  field: c("#F4F4F4", "#1E1E1E"),
  panel: c("#F7F7F7", "#191919"),
  chip: c("#F0F0F0", "#232323"),
  rule: c("#EBEBEB", "#262626"),
  ruleSoft: c("#F0F0F0", "#1E1E1E"),
  dashed: c("#DADADA", "#3A3A3A"),
  muted: c("#6F6F6F", "#9C9C9C"),
  placeholder: c("#8A8A8A", "#7A7A7A"),
  ink: c("#111111", "#F2F2F2"),
  /** Text on an ink background (black buttons). */
  onInk: c("#FFFFFF", "#101010"),
  inkHover: c("#2A2A2A", "#D9D9D9"),
  violet: c("#6E44FF", "#A58BFF"),
  violetHover: c("#5730E0", "#BBA6FF"),
  violetSoft: c("#F6F3FF", "#1E1830"),
  violetTint: c("#EFEAFF", "#2A2145"),
  violetLine: c("#DCD3FF", "#3B3160"),
  violetInk: c("#4A3A80", "#C9BBFF"),
  yellow: c("#F7B52C", "#F7B52C"),
  successBg: c("#E3F9E1", "#14301A"),
  successInk: c("#1D4D1A", "#9BE39A"),
  dangerBg: c("#FDECEC", "#3A1517"),
  dangerInk: c("#8A1C22", "#FF9EA2"),
  dangerLine: c("#D9474F", "#FF6B70"),
  danger: c("#B4232A", "#FF6B70"),
  up: c("#1F7A3A", "#5BD07D"),
  avatar: c("#8D5B4C", "#8D5B4C"),
  avatarInk: c("#F5DFBB", "#F5DFBB"),
  dropzone: c("#FAFAFA", "#151515"),
  dropzoneLine: c("#CFCFCF", "#3A3A3A"),
  shadow: c("rgba(0,0,0,0.12)", "rgba(0,0,0,0.5)"),
  // On the black bands (clock, discoveries): the same in both themes.
  night: c("#111111", "#1A1A1A"),
  nightMuted: c("#BDBDBD", "#BDBDBD"),
  nightFaint: c("#8C8C8C", "#8C8C8C"),
  nightTrack: c("#262626", "#2E2E2E"),
  nightBar: c("#4A4A4A", "#4A4A4A"),
  nightRule: c("#2A2A2A", "#2A2A2A"),
};
