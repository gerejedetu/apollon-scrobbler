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
