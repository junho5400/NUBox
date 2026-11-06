import { createContext, useContext } from 'react';
import type { AppUser } from '../types/user';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; error: string | null }
  | { status: 'signedIn'; user: AppUser };

export interface AuthContextValue {
  state: AuthState;
  /** Opens the student screens, whatever the account's role. */
  signIn: () => Promise<void>;
  /** Opens the staff screens; an account without a staff role is signed out with a message. */
  signInAsStaff: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
