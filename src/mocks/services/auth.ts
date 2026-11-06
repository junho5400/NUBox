import type { User } from 'firebase/auth';
import { mockRole } from '../store';

export type AuthEvent =
  | { kind: 'signedIn'; user: User }
  | { kind: 'signedOut' }
  | { kind: 'rejected'; email: string | null };

let onEvent: ((e: AuthEvent) => void) | null = null;
const user = { uid: 'mock', email: 'willie.wildcat@u.northwestern.edu', displayName: 'Willie Wildcat', photoURL: null } as unknown as User;

export const signInWithGoogle = async () => {
  sessionStorage.setItem('nubox-mock-as', 'staff');
  onEvent?.({ kind: 'signedIn', user });
};
export const signOutUser = async () => {
  sessionStorage.setItem('nubox-mock-as', 'out');
  onEvent?.({ kind: 'signedOut' });
};
export const subscribeToAuth = (fn: (e: AuthEvent) => void) => {
  onEvent = fn;
  const as = new URLSearchParams(location.search).get('as');
  if (as === 'rejected') fn({ kind: 'rejected', email: 'someone@gmail.com' });
  else fn(mockRole() === 'out' ? { kind: 'signedOut' } : { kind: 'signedIn', user });
  return () => {
    onEvent = null;
  };
};
