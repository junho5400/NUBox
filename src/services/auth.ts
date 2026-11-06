import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { isNorthwesternEmail } from '../utilities/email';

/** `staff` says the session came through Staff sign in. It picks the screens only; Firestore rules go by account. */
export type AuthEvent =
  | { kind: 'signedIn'; user: User; staff: boolean }
  | { kind: 'signedOut' }
  | { kind: 'rejected'; email: string | null };

// Kept next to Firebase's own session (localStorage) so a reload keeps the same screens.
const STAFF_KEY = 'nubox-staff-sign-in';

export const signInWithGoogle = async (staff: boolean): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (staff) localStorage.setItem(STAFF_KEY, '1');
  else localStorage.removeItem(STAFF_KEY);
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    localStorage.removeItem(STAFF_KEY);
    throw error;
  }
};

export const signOutUser = (): Promise<void> => {
  localStorage.removeItem(STAFF_KEY);
  return signOut(auth);
};

// Non-Northwestern accounts are signed out immediately and reported as rejected.
export const subscribeToAuth = (onEvent: (event: AuthEvent) => void): (() => void) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onEvent({ kind: 'signedOut' });
    } else if (user.emailVerified && isNorthwesternEmail(user.email)) {
      onEvent({ kind: 'signedIn', user, staff: localStorage.getItem(STAFF_KEY) === '1' });
    } else {
      await signOutUser();
      onEvent({ kind: 'rejected', email: user.email });
    }
  });
