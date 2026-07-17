/**
 * Inline icon set. Stroke-based, 24x24 grid, currentColor.
 * Deliberately local: no icon-library dependency, no CDN request.
 */

import type { ReactElement } from "react";

export type IconName =
  | "command"
  | "map-pin"
  | "network"
  | "alert"
  | "file-text"
  | "user"
  | "lock"
  | "eye"
  | "eye-off"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "shield-check"
  | "shield"
  | "hierarchy"
  | "chart-up"
  | "file-check"
  | "bell"
  | "chevron-down"
  | "chevron-right"
  | "calendar"
  | "filter"
  | "external"
  | "plus"
  | "minus"
  | "layers"
  | "clock"
  | "tag"
  | "check";

const PATHS: Record<IconName, ReactElement> = {
  command: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M20 10.5c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10.5" r="2.8" />
    </>
  ),
  network: (
    <>
      <circle cx="8" cy="7" r="3" />
      <circle cx="17.5" cy="9.5" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M15 20a4 4 0 0 1 6.5-3.1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 9.5v4.2" />
      <path d="M12 16.8h.01" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V7L14 2.5Z" />
      <path d="M14 2.5V7h4.5" />
      <path d="M9 12.5h6M9 16.5h6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M10.7 6.1A9.9 9.9 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a17 17 0 0 1-3.2 3.9M6.4 7.9A16.6 16.6 0 0 0 2 12s3.8 6.5 10 6.5a9.7 9.7 0 0 0 3.6-.7" />
      <path d="m9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  "arrow-up": <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  "arrow-down": <path d="M12 5v14m0 0 6-6m-6 6-6-6" />,
  "shield-check": (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 5 3.2 9.2 7.5 10.5 4.3-1.3 7.5-5.5 7.5-10.5v-6L12 2.5Z" />
      <path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
    </>
  ),
  shield: (
    <path d="M12 2.5 4.5 5.5v6c0 5 3.2 9.2 7.5 10.5 4.3-1.3 7.5-5.5 7.5-10.5v-6L12 2.5Z" />
  ),
  hierarchy: (
    <>
      <rect x="9" y="2.5" width="6" height="4.5" rx="1" />
      <rect x="2.5" y="17" width="6" height="4.5" rx="1" />
      <rect x="15.5" y="17" width="6" height="4.5" rx="1" />
      <path d="M12 7v4.5M5.5 17v-3a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v3" />
    </>
  ),
  "chart-up": (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5v-6M11 20.5v-9.5M15.5 20.5v-5M20 20.5V7" />
    </>
  ),
  "file-check": (
    <>
      <path d="M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V7L14 2.5Z" />
      <path d="M14 2.5V7h4.5" />
      <path d="m9 14.5 2 2 4-4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
      <path d="M13.7 19.5a2 2 0 0 1-3.4 0" />
    </>
  ),
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />,
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  layers: (
    <>
      <path d="m12 2.8 9 4.7-9 4.7-9-4.7 9-4.7Z" />
      <path d="m3 12.5 9 4.7 9-4.7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  tag: (
    <>
      <path d="M11 2.5H3.5v7.5l10 10 7.5-7.5-10-10Z" />
      <circle cx="7.5" cy="6.5" r="1.4" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
};

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  className,
  filled = false,
}: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
