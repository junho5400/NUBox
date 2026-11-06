import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { User } from 'firebase/auth';
import App from './App';
import { AuthProvider } from './components/AuthProvider';
import type { AuthEvent } from './services/auth';
import type { Desk, Item } from './types/item';

const { authMocks, roleMocks, itemMocks, deskMocks, activityMocks } = vi.hoisted(() => {
  const noop = () => () => {};
  return {
    authMocks: { signInWithGoogle: vi.fn(), signOutUser: vi.fn(), subscribeToAuth: vi.fn() },
    roleMocks: { getRole: vi.fn(), subscribeRoles: vi.fn(noop), grantRole: vi.fn(), revokeRole: vi.fn() },
    itemMocks: {
      subscribePublicItems: vi.fn(),
      subscribeAllItems: vi.fn(),
      subscribeItem: vi.fn(noop),
      subscribeItemPrivate: vi.fn(noop),
      getPhotoUrl: vi.fn(() => new Promise(() => {})),
    },
    deskMocks: { subscribeDesks: vi.fn(), saveDesk: vi.fn(), addEvanstonDesks: vi.fn() },
    activityMocks: { subscribeActivity: vi.fn(noop) },
  };
});

vi.mock('./services/auth', () => authMocks);
vi.mock('./services/roles', () => roleMocks);
vi.mock('./services/items', () => itemMocks);
vi.mock('./services/desks', () => deskMocks);
vi.mock('./services/activity', () => activityMocks);

const today = new Date();
const daysAgo = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

const desks: Desk[] = [
  { id: 'norris', name: 'Norris Center', place: 'Norris University Center', hours: '', bring: 'Your Wildcard', holdingDays: 30 },
];

const item = (overrides: Partial<Item>): Item => ({
  id: 'a',
  number: 'NB-0001',
  name: 'Blue Hydro Flask',
  description: '',
  category: 'Water bottles',
  foundOn: daysAgo(1),
  foundAt: '',
  deskId: 'norris',
  status: 'available',
  statusChangedAt: daysAgo(1),
  sensitive: false,
  photoPath: null,
  createdAt: daysAgo(1),
  ...overrides,
});

const items = [
  item({ id: 'a', number: 'NB-0001', name: 'Blue Hydro Flask' }),
  item({ id: 'b', number: 'NB-0002', name: 'Black backpack', category: 'Bags', foundOn: daysAgo(45) }),
  item({ id: 'c', number: 'NB-0003', name: 'Old umbrella', status: 'claimed', statusChangedAt: daysAgo(30) }),
];

const emitAuthEvent = (event: AuthEvent) =>
  authMocks.subscribeToAuth.mockImplementation((onEvent: (e: AuthEvent) => void) => {
    onEvent(event);
    return () => {};
  });

const signInAs = (role: 'user' | 'admin') => {
  roleMocks.getRole.mockResolvedValue(role);
  emitAuthEvent({
    kind: 'signedIn',
    user: { uid: '1', email: 'wildcat@u.northwestern.edu', displayName: 'Willie Wildcat', photoURL: null } as unknown as User,
  });
};

const renderApp = () =>
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    itemMocks.subscribePublicItems.mockImplementation((onChange: (i: Item[]) => void) => {
      onChange(items);
      return () => {};
    });
    itemMocks.subscribeAllItems.mockImplementation((onChange: (i: Item[]) => void) => {
      onChange(items);
      return () => {};
    });
    deskMocks.subscribeDesks.mockImplementation((onChange: (d: Desk[]) => void) => {
      onChange(desks);
      return () => {};
    });
  });

  it('starts sign-in from the sign-in page', async () => {
    emitAuthEvent({ kind: 'signedOut' });
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: /sign in/i }));
    expect(authMocks.signInWithGoogle).toHaveBeenCalled();
  });

  it('explains when a non-Northwestern account is rejected', async () => {
    emitAuthEvent({ kind: 'rejected', email: 'someone@gmail.com' });
    renderApp();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign in with a Northwestern account.');
  });

  it('shows students held items and hides old pickups', async () => {
    signInAs('user');
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Found items' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Blue Hydro Flask/ })).toBeInTheDocument();
    expect(screen.queryByText('Old umbrella')).not.toBeInTheDocument();
  });

  it('filters the catalog by search text', async () => {
    signInAs('user');
    renderApp();
    fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'backpack' } });
    expect(await screen.findByRole('link', { name: /Black backpack/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Blue Hydro Flask/ })).not.toBeInTheDocument();
  });

  it('sends staff to the inventory and flags items past holding', async () => {
    signInAs('admin');
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    const row = (await screen.findByRole('link', { name: 'Black backpack' })).closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText(/Past holding/)).toBeInTheDocument();
  });
});
