import type { Actor } from '../types/item';
import type { AppUser } from '../types/user';
import { useAuth } from './useAuth';

/** The signed-in user, for screens that are only rendered when signed in. */
export const useUser = (): AppUser => {
  const { state } = useAuth();
  if (state.status !== 'signedIn') throw new Error('useUser requires a signed-in user');
  return state.user;
};

export const useActor = (): Actor => {
  const user = useUser();
  return { email: user.email, name: user.displayName };
};

export const isStaff = (user: AppUser): boolean => user.role === 'admin' || user.role === 'superadmin';
