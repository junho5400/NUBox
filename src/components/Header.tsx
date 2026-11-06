import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { isStaff, useUser } from '../hooks/useActor';
import { useDesks } from '../hooks/useData';
import { ALL_DESKS, useStaffDesk } from '../hooks/useStaffDesk';
import { pickableDesks } from '../utilities/items';
import { Button } from './Button';
import { Select } from './Select';
import { Tabs } from './Tabs';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Wordmark = () => <span className="text-[1.0625rem] font-medium tracking-[-0.02em] text-accent">NUBox</span>;

const DeskPicker = () => {
  const desks = useDesks();
  const { deskId, setDeskId } = useStaffDesk();
  const options = [
    { value: ALL_DESKS, label: 'All desks' },
    ...(desks.status === 'ready' ? pickableDesks(desks.data, deskId).map((d) => ({ value: d.id, label: d.name })) : []),
  ];
  return (
    <Select
      variant="bare"
      align="right"
      aria-label="Desk"
      value={deskId}
      onChange={setDeskId}
      options={options}
      active={deskId !== ALL_DESKS}
      className="hidden sm:block"
    />
  );
};

const AccountMenu = () => {
  const { signOut } = useAuth();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-8 items-center justify-center bg-canvas text-caption font-medium text-ink-2 hover:bg-hover aria-expanded:bg-hover"
      >
        {initials(user.displayName)}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 flex w-64 flex-col gap-3 border border-line-strong bg-surface p-4 shadow-[0_8px_24px_rgba(23,24,26,0.10)]">
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="truncate text-small text-ink-2">{user.email}</p>
          </div>
          <Button size="sm" onClick={signOut} className="self-start">
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
};

export const Header = () => {
  const user = useUser();
  const staff = isStaff(user);
  const sections = [
    { to: '/inventory', label: 'Inventory' },
    { to: '/activity', label: 'Activity' },
    ...(user.role === 'superadmin' ? [{ to: '/settings', label: 'Settings' }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-8 border-b border-line bg-surface px-4 md:px-8">
      <Link to="/">
        <Wordmark />
      </Link>
      {staff && <Tabs nav label="Main" items={sections} className="h-full!" />}
      <div className="ml-auto flex items-center gap-3">
        {staff && <DeskPicker />}
        <AccountMenu />
      </div>
    </header>
  );
};
