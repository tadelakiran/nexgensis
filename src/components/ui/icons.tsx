import type { ReactNode } from "react";

/**
 * A tiny inline icon set.
 *
 * Inline SVG instead of an icon package keeps the bundle small and means icons
 * inherit `currentColor`, so they pick up the surrounding text colour (and the
 * brand palette) with no extra wiring.
 */

interface IconProps {
  className?: string;
}

function Svg({
  children,
  className,
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-5"}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const PencilIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 20h4l10-10a2.83 2.83 0 1 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 6h18" />
    <path d="M9 6V4h6v2" />
    <path d="M6 6l1 15h10l1-15" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const StarIcon = ({ className }: IconProps) => (
  <Svg className={className} filled>
    <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.11-6.47L2.6 9.45l6.5-.95z" />
  </Svg>
);

export const RefreshIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20.5 11A8.5 8.5 0 1 0 12 20.5a8.5 8.5 0 0 0 6.7-3.2" />
    <path d="M20.5 4.5v6h-6" />
  </Svg>
);

export const PackageIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 8.5 12 3.5l9 5v7l-9 5-9-5z" />
    <path d="m3 8.5 9 5 9-5" />
    <path d="M12 13.5v7.5" />
  </Svg>
);

export const LogOutIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Svg>
);

export const ArrowUpIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);

export const ArrowDownIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Svg>
);

export const WarningIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const InfoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </Svg>
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Svg>
);

export const SlidersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const ImageOffIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 3l18 18" />
    <path d="M21 15V5a2 2 0 0 0-2-2H8" />
    <path d="M3 7v12a2 2 0 0 0 2 2h12" />
    <path d="m5 17 4-4 3 3" />
  </Svg>
);

export const InboxIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" />
  </Svg>
);

export const UserIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const FilterIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 6h18M7 12h10M10 18h4" />
  </Svg>
);

export const SparklesIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m12 3-1.8 5.4a2 2 0 0 1-1.3 1.3L3.5 11.5l5.4 1.8a2 2 0 0 1 1.3 1.3L12 20l1.8-5.4a2 2 0 0 1 1.3-1.3l5.4-1.8-5.4-1.8a2 2 0 0 1-1.3-1.3Z" />
  </Svg>
);

/** Spinner arc — pair with `animate-spin`. */
export const SpinnerIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </Svg>
);
