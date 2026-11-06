import { createContext, useContext } from 'react';
import type { AppUser } from '../types/user';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; error: string | null }
  | { status: 'signedIn'; user: AppUser };

export interface AuthContextValue {
  state: AuthState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
