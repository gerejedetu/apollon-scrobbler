/** Stroke icons drawn like the design (24×24 grid, round caps). Decorative: hidden from assistive tech. */
import type { ReactNode } from "react";

function Icon({
  size = 14,
  width = 2.2,
  children,
}: {
  size?: number;
  width?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { size?: number };

export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const ClockIcon = (p: P) => (
  <Icon size={18} width={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const ChevronRight = (p: P) => (
  <Icon width={2} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const ChevronDown = (p: P) => (
  <Icon size={12} width={2.4} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);
export const ArrowUpRight = (p: P) => (
  <Icon size={12} width={2.6} {...p}>
    <path d="M7 17L17 7M9 7h8v8" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon size={13} width={2.6} {...p}>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);
export const CopyIcon = (p: P) => (
  <Icon {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Icon>
);
export const WarningIcon = (p: P) => (
  <Icon size={20} {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Icon>
);
export const SignOutIcon = (p: P) => (
  <Icon {...p}>
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </Icon>
);
export const PencilIcon = (p: P) => (
  <Icon size={13} width={2} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </Icon>
);
export const TrashIcon = (p: P) => (
  <Icon size={16} width={2} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </Icon>
);
export const HeartIcon = ({
  size = 16,
  filled,
  color,
}: P & { filled?: boolean; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? (color ?? "currentColor") : "none"}
    stroke={color ?? "currentColor"}
    strokeWidth={2}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
export const FlameIcon = ({ size = 16, color }: P & { color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color ?? "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.6.2 1.8 1 2.8 2 3.2C11 9 11 6 12 3z" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <Icon size={12} width={2.6} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const UserIcon = (p: P) => (
  <Icon size={16} width={2} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Icon>
);
export const KeyIcon = (p: P) => (
  <Icon size={16} width={2} {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
  </Icon>
);
export const DownloadIcon = (p: P) => (
  <Icon size={16} width={2} {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
  </Icon>
);
export const HomeIcon = (p: P) => (
  <Icon size={24} width={1.8} {...p}>
    <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />
  </Icon>
);
export const PulseIcon = (p: P) => (
  <Icon size={24} width={1.8} {...p}>
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  </Icon>
);
export const BarsIcon = (p: P) => (
  <Icon size={24} width={1.8} {...p}>
    <path d="M5 20V10M12 20V4M19 20v-7" />
  </Icon>
);
export const CalendarIcon = (p: P) => (
  <Icon size={14} width={2} {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </Icon>
);
export const ChevronLeft = (p: P) => (
  <Icon width={2} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);
export const GlobeIcon = (p: P) => (
  <Icon size={16} width={1.8} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Icon>
);
/** The GitHub mark (filled, unlike the stroke icons). */
export const GitHubIcon = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
);
