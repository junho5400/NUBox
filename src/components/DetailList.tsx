import type { PropsWithChildren, ReactNode } from 'react';

/** Label / value rows on hairlines. */
export const DetailList = ({ children, inverse = false }: PropsWithChildren<{ inverse?: boolean }>) => (
  <dl className={`border-b ${inverse ? 'border-white/20' : 'border-line'}`}>{children}</dl>
);

export const Detail = ({ label, children, inverse = false }: { label: string; children: ReactNode; inverse?: boolean }) => (
  <div className={`flex gap-4 border-t py-3 ${inverse ? 'border-white/20' : 'border-line'}`}>
    <dt className={`w-28 shrink-0 text-small ${inverse ? 'text-white/70' : 'text-ink-2'}`}>{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);
