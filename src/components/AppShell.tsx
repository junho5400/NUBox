import type { PropsWithChildren } from 'react';
import { Header } from './Header';

export const AppShell = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-screen flex-col bg-surface">
    <Header />
    <main className="flex flex-1 flex-col">{children}</main>
  </div>
);
