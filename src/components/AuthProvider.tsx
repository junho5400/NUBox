import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { FirebaseError } from 'firebase/app';
import { AuthContext, type AuthState } from '../hooks/useAuth';
import { signInWithGoogle, signOutUser, subscribeToAuth } from '../services/auth';
import { getRole } from '../services/roles';

const REJECTED_MESSAGE = 'Sign in with a Northwestern account.';

const notStaffMessage = (email: string) => `${email} isn’t on the staff list. Ask a super-admin to add you.`;

const IGNORED_SIGN_IN_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const staffIntent = useRef(false);

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
        const asStaff = staffIntent.current;
        staffIntent.current = false;
        if (event.kind === 'rejected') {
          setState({ status: 'signedOut', error: REJECTED_MESSAGE });
          return;
        }
        const { user } = event;
        const email = user.email ?? '';
        try {
          const role = await getRole(email);
          if (asStaff && role === 'user') {
            await signOutUser();
            setState({ status: 'signedOut', error: notStaffMessage(email) });
            return;
          }
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

  const startSignIn = async (asStaff: boolean) => {
    staffIntent.current = asStaff;
    try {
      await signInWithGoogle();
    } catch (error) {
      staffIntent.current = false;
      if (error instanceof FirebaseError && IGNORED_SIGN_IN_ERRORS.includes(error.code)) return;
      console.error('Sign-in failed', error);
      setState({ status: 'signedOut', error: 'Couldn’t sign in. Try again.' });
    }
  };

  return (
    <AuthContext
      value={{ state, signIn: () => startSignIn(false), signInAsStaff: () => startSignIn(true), signOut: signOutUser }}
    >
      {children}
    </AuthContext>
  );
};
