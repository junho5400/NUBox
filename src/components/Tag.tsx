import type { PropsWithChildren } from 'react';

/** Status in plain words. Solid is reserved for states staff need to act on. */
export const Tag = ({ tone = 'outline', children }: PropsWithChildren<{ tone?: 'outline' | 'solid' }>) => (
  <span
    className={`inline-flex h-[22px] items-center whitespace-nowrap px-2 text-caption ${
      tone === 'solid' ? 'bg-inverse text-white' : 'border border-line-strong text-ink-2'
    }`}
  >
    {children}
  </span>
);
