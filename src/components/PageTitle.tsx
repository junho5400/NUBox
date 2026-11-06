import type { PropsWithChildren, ReactNode } from 'react';

/** Page title with an optional action on its right. */
export const PageTitle = ({ action, children }: PropsWithChildren<{ action?: ReactNode }>) => (
  <div className="flex items-center justify-between gap-4 pt-10 pb-6">
    <h1 className="text-display">{children}</h1>
    {action}
  </div>
);
