import { useEffect, useState, type PropsWithChildren } from 'react';
import { FirebaseError } from 'firebase/app';
import { AuthContext, type AuthState } from '../hooks/useAuth';
import { signInWithGoogle, signOutUser, subscribeToAuth } from '../services/auth';
import { getRole } from '../services/roles';

const REJECTED_MESSAGE = 'Sign in with a Northwestern account.';

const IGNORED_SIGN_IN_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(
    () =>
      subscribeToAuth(async (event) => {
        if (event.kind === 'signedOut') {
          setState((prev) => ({
            status: 'signedOut',
            error: prev.status === 'signedOut' ? prev.error : null,
          }));
          return;
        }
        if (event.kind === 'rejected') {
          setState({ status: 'signedOut', error: REJECTED_MESSAGE });
          return;
        }
        const { user } = event;
        const email = user.email ?? '';
        try {
          const role = await getRole(email);
          setState({
            status: 'signedIn',
            user: {
              uid: user.uid,
              email,
              displayName: user.displayName ?? email,
              photoURL: user.photoURL,
              role,
            },
          });
        } catch (error) {
          console.error('Failed to load role', error);
          await signOutUser();
          setState({ status: 'signedOut', error: 'Couldn’t load your account. Try again.' });
        }
      }),
    [],
  );

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof FirebaseError && IGNORED_SIGN_IN_ERRORS.includes(error.code)) return;
      console.error('Sign-in failed', error);
      setState({ status: 'signedOut', error: 'Couldn’t sign in. Try again.' });
    }
  };

  return (
    <AuthContext value={{ state, signIn, signOut: signOutUser }}>{children}</AuthContext>
  );
};
