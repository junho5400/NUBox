import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { isNorthwesternEmail } from '../utilities/email';

export type AuthEvent =
  | { kind: 'signedIn'; user: User }
  | { kind: 'signedOut' }
  | { kind: 'rejected'; email: string | null };

export const signInWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
};

export const signOutUser = (): Promise<void> => signOut(auth);

// Non-Northwestern accounts are signed out immediately and reported as rejected.
export const subscribeToAuth = (onEvent: (event: AuthEvent) => void): (() => void) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onEvent({ kind: 'signedOut' });
    } else if (user.emailVerified && isNorthwesternEmail(user.email)) {
      onEvent({ kind: 'signedIn', user });
    } else {
      await signOut(auth);
      onEvent({ kind: 'rejected', email: user.email });
    }
  });
