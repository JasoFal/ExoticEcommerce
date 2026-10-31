import type { ReactNode } from "react";

// Inline SVG icons (docs/design-plan.md §6.3): 24×24 strokes in
// currentColor, 1.25em by default. No icon package and no emoji.
const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </>
  ),
  cart: (
    <>
      <path d="M2.5 3.5h2.2l2.4 11.3a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8l1.6-7.3H6" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  book: (
    <>
      <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
      <path d="M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />
    </>
  ),
  // Top-level Animal Type silhouettes (design-plan §6.6).
  lizard: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v8.5c0 2.2-1.2 3.8-3.5 4.8" />
      <path d="M8 8.5 10 10.5h4l2-2M8 16.5l2-2h4l2 2" />
    </>
  ),
  snake: (
    <>
      <path d="M15.5 6.5C14 4.5 8.5 4.3 8.5 8c0 3.6 7.5 3.4 7.5 7.6 0 3-2.6 4.4-5.6 4.4-2.4 0-3.9-1-4.4-2.3" />
      <path d="m14 4.2 1.8 2.4-2.8.8" />
    </>
  ),
  amphibian: (
    <>
      <circle cx="9" cy="6" r="1.8" />
      <circle cx="15" cy="6" r="1.8" />
      <path d="M7.5 11.5c0-2.4 2-4 4.5-4s4.5 1.6 4.5 4-2 4.5-4.5 4.5-4.5-2.1-4.5-4.5z" />
      <path d="M7.5 12 4.5 14.5V17M16.5 12l3 2.5V17M9 15.5 7 19.5M15 15.5l2 4" />
    </>
  ),
  invertebrate: (
    <>
      <circle cx="12" cy="7.5" r="2" />
      <ellipse cx="12" cy="14" rx="3" ry="4" />
      <path d="M9.2 12 5 9 3 10M9 14H4l-1.5 2M9.4 16.2 5.5 19v1.5M14.8 12 19 9l2 1M15 14h5l1.5 2M14.6 16.2l3.9 2.8v1.5" />
    </>
  ),
  // Department and Supply silhouettes.
  feeder: (
    <>
      <path d="M4 11h16a8 7 0 0 1-16 0z" />
      <path d="M8.5 7.5a4.5 4.5 0 0 1 7 0" />
    </>
  ),
  enclosure: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 20v-4a4 4 0 0 1 8 0v4" />
    </>
  ),
  lamp: (
    <>
      <path d="M12 3v2M7.5 5h9l2.5 6h-14z" />
      <path d="M12 14v3M8 13.5 6.5 16M16 13.5l1.5 2.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 11 11 5 20 5c0 9-6 15-14 15" />
      <path d="m5 19 7-7" />
    </>
  ),
  supply: (
    <>
      <path d="M4 8 12 4l8 4v8l-8 4-8-4z" />
      <path d="m4 8 8 4 8-4M12 12v8" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

type IconProps = {
  name: IconName;
  /** Only when the icon is the sole label for its control. */
  label?: string;
  className?: string;
};

export function Icon({ name, label, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true, focusable: false })}
    >
      {PATHS[name]}
    </svg>
  );
}
