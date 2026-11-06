export type Role = 'user' | 'admin' | 'superadmin';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
}
