import type { User } from 'firebase/auth';
import { mockRole } from '../store';

export type AuthEvent =
  | { kind: 'signedIn'; user: User; staff: boolean }
  | { kind: 'signedOut' }
  | { kind: 'rejected'; email: string | null };

let onEvent: ((e: AuthEvent) => void) | null = null;
const user = { uid: 'mock', email: 'willie.wildcat@u.northwestern.edu', displayName: 'Willie Wildcat', photoURL: null } as unknown as User;

export const signInWithGoogle = async (staff: boolean) => {
  sessionStorage.setItem('nubox-mock-as', staff ? 'staff' : 'student');
  // Otherwise ?as=out would keep overriding the account picked here.
  const url = new URL(location.href);
  url.searchParams.delete('as');
  history.replaceState(history.state, '', url);
  onEvent?.({ kind: 'signedIn', user, staff });
};
export const signOutUser = async () => {
  sessionStorage.setItem('nubox-mock-as', 'out');
  onEvent?.({ kind: 'signedOut' });
};
export const subscribeToAuth = (fn: (e: AuthEvent) => void) => {
  onEvent = fn;
  const as = new URLSearchParams(location.search).get('as');
  const role = mockRole();
  if (as === 'rejected') fn({ kind: 'rejected', email: 'someone@gmail.com' });
  else fn(role === 'out' ? { kind: 'signedOut' } : { kind: 'signedIn', user, staff: role !== 'user' });
  return () => {
    onEvent = null;
  };
};
