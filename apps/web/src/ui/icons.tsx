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
