import type { ReactNode } from 'react';

export type IconName = 'search' | 'close' | 'chevron-down' | 'arrow-left' | 'plus' | 'check';

const PATHS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="7" cy="7" r="4.75" />
      <path d="M13.5 13.5l-3-3" />
    </>
  ),
  close: <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
  'chevron-down': <path d="M4 6l4 4 4-4" />,
  'arrow-left': <path d="M13 8H3M7 4L3 8l4 4" />,
  plus: <path d="M8 3v10M3 8h10" />,
  check: <path d="M3.5 8.5l3 3 6-7" />,
};

export const Icon = ({ name, className = '' }: { name: IconName; className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`size-4 shrink-0 ${className}`}
  >
    {PATHS[name]}
  </svg>
);
