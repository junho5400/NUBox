import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Role } from '../types/user';
import type { Unsubscribe } from './items';

const ROLES: readonly Role[] = ['user', 'admin', 'superadmin'];

const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

export type StaffRole = Exclude<Role, 'user'>;

export interface RoleGrant {
  email: string;
  role: StaffRole;
}

const roles = collection(db, 'roles');

// Roles are keyed by lowercase email so they can be granted before first sign-in.
export const getRole = async (email: string): Promise<Role> => {
  const snapshot = await getDoc(doc(roles, email.toLowerCase()));
  const role: unknown = snapshot.data()?.role;
  return isRole(role) ? role : 'user';
};

export const subscribeRoles = (onChange: (grants: RoleGrant[]) => void, onError: (error: Error) => void): Unsubscribe =>
  onSnapshot(
    roles,
    (snap) =>
      onChange(
        snap.docs
          .map((d) => ({ email: d.id, role: d.data().role as StaffRole }))
          .filter((g) => g.role === 'admin' || g.role === 'superadmin')
          .sort((a, b) => a.email.localeCompare(b.email)),
      ),
    onError,
  );

export const grantRole = async (email: string, role: StaffRole, grantedBy: string): Promise<void> => {
  await setDoc(doc(roles, email.trim().toLowerCase()), { role, grantedBy, grantedAt: serverTimestamp() });
};

export const revokeRole = async (email: string): Promise<void> => {
  await deleteDoc(doc(roles, email));
};
