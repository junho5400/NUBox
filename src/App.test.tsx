import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { User } from 'firebase/auth';
import App from './App';
import { AuthProvider } from './components/AuthProvider';
import type { AuthEvent } from './services/auth';
import type { Activity, Desk, Item } from './types/item';
import type { AppSettings } from './types/settings';

const { authMocks, roleMocks, itemMocks, deskMocks, activityMocks, settingsMocks } = vi.hoisted(() => {
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
      releaseItem: vi.fn(),
      reopenItem: vi.fn(),
    },
    deskMocks: { subscribeDesks: vi.fn(), saveDesk: vi.fn(), addEvanstonDesks: vi.fn() },
    activityMocks: { subscribeActivity: vi.fn(noop), subscribeItemActivity: vi.fn() },
    settingsMocks: { subscribeSettings: vi.fn(), saveSettings: vi.fn() },
  };
});

vi.mock('./services/auth', () => authMocks);
vi.mock('./services/roles', () => roleMocks);
vi.mock('./services/items', () => itemMocks);
vi.mock('./services/desks', () => deskMocks);
vi.mock('./services/activity', () => activityMocks);
vi.mock('./services/settings', () => settingsMocks);

const today = new Date();
const daysAgo = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

const desks: Desk[] = [
  { id: 'norris', name: 'Norris Center', place: 'Norris University Center', hours: '', contact: '', bring: 'Your Wildcard', holdingDays: 30, active: true },
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

const wildcat = { uid: '1', email: 'wildcat@u.northwestern.edu', displayName: 'Willie Wildcat', photoURL: null } as unknown as User;

/** Staff come in through Staff sign in unless a test says otherwise. */
const signInAs = (role: 'user' | 'admin', staff = role !== 'user') => {
  roleMocks.getRole.mockResolvedValue(role);
  emitAuthEvent({ kind: 'signedIn', user: wildcat, staff });
};

/** Starts signed out and returns a way to deliver the next auth event, as Firebase would after the popup. */
const startSignedOut = () => {
  let send: (event: AuthEvent) => void = () => {};
  authMocks.subscribeToAuth.mockImplementation((onEvent: (e: AuthEvent) => void) => {
    send = onEvent;
    onEvent({ kind: 'signedOut' });
    return () => {};
  });
  return (event: AuthEvent) => act(async () => send(event));
};

const showPickupsFor = (claimedVisibleDays: number) =>
  settingsMocks.subscribeSettings.mockImplementation((onChange: (s: AppSettings) => void) => {
    onChange({ claimedVisibleDays });
    return () => {};
  });

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
    showPickupsFor(14);
  });

  it('starts sign-in from the sign-in page', async () => {
    emitAuthEvent({ kind: 'signedOut' });
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in with Google' }));
    expect(authMocks.signInWithGoogle).toHaveBeenCalledWith(false);
  });

  it('turns away a staff sign-in from an account without a staff role', async () => {
    const send = startSignedOut();
    roleMocks.getRole.mockResolvedValue('user');
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Staff sign in' }));
    expect(authMocks.signInWithGoogle).toHaveBeenCalledWith(true);
    await send({ kind: 'signedIn', user: wildcat, staff: true });
    expect(await screen.findByRole('alert')).toHaveTextContent('wildcat@u.northwestern.edu isn’t on the staff list.');
    expect(authMocks.signOutUser).toHaveBeenCalled();
  });

  it('sends a staff sign-in from a staff account to the inventory', async () => {
    const send = startSignedOut();
    roleMocks.getRole.mockResolvedValue('admin');
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Staff sign in' }));
    await send({ kind: 'signedIn', user: wildcat, staff: true });
    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
  });

  it('shows a staff account the student catalog after the regular sign-in, even from a staff page', async () => {
    window.history.pushState({}, '', '/inventory');
    signInAs('admin', false);
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Found items' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inventory' })).not.toBeInTheDocument();
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

  it('keeps pickups listed for as long as settings say', async () => {
    showPickupsFor(30);
    signInAs('user');
    renderApp();
    expect(await screen.findByRole('link', { name: /Old umbrella/ })).toHaveTextContent('Picked up');
  });

  it('filters the catalog to picked-up items', async () => {
    showPickupsFor(30);
    signInAs('user');
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Picked up' }));
    expect(await screen.findByRole('link', { name: /Old umbrella/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Blue Hydro Flask/ })).not.toBeInTheDocument();
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

  it('shows staff who logged an item and what happened to it since', async () => {
    const entry = (id: string, type: Activity['type'], detail: string, by: string, ago: number): Activity => ({
      id,
      type,
      itemId: 'b',
      itemName: 'Black backpack',
      detail,
      at: daysAgo(ago),
      by,
    });
    activityMocks.subscribeItemActivity.mockImplementation((_id: string, onChange: (a: Activity[]) => void) => {
      onChange([entry('1', 'logged', 'at Norris Center', 'Maya Patel', 45), entry('2', 'edited', '', 'Sam Okafor', 44)]);
      return () => {};
    });
    window.history.pushState({}, '', '/inventory/b');
    signInAs('admin');
    renderApp();
    const history = within(await screen.findByRole('region', { name: 'History' }));
    expect(history.getByText(/Logged at Norris Center/)).toHaveTextContent('by Maya Patel');
    expect(history.getByText(/Edited/)).toHaveTextContent('by Sam Okafor');
    expect(activityMocks.subscribeItemActivity).toHaveBeenCalledWith('b', expect.any(Function), expect.any(Function));
  });

  it('releases to a visitor, who leaves a phone or email instead of a NetID', async () => {
    itemMocks.releaseItem.mockResolvedValue(undefined);
    window.history.pushState({}, '', '/inventory/a');
    signInAs('admin');
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Release to owner' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Visitor' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    expect(screen.getByText('Enter a phone number or email.')).toBeInTheDocument();
    expect(itemMocks.releaseItem).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Phone or email'), { target: { value: '847-555-0100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    expect(itemMocks.releaseItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
      { netid: '', name: 'Pat Doe', contact: '847-555-0100', note: '' },
      expect.anything(),
    );
  });

  it('lets staff undo a release, with an optional reason', async () => {
    itemMocks.reopenItem.mockResolvedValue(undefined);
    window.history.pushState({}, '', '/inventory/c');
    signInAs('admin');
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Undo release' }));
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Released the wrong umbrella' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(itemMocks.reopenItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }), 'Released the wrong umbrella', expect.anything());
  });

  it('offers no undo for items still in custody', async () => {
    window.history.pushState({}, '', '/inventory/a');
    signInAs('admin');
    renderApp();
    expect(await screen.findByRole('button', { name: 'Release to owner' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
  });
});
