import type { Role } from '../../types/user';
import { emit, mockRole, roles, subscribe } from '../store';

export type StaffRole = Exclude<Role, 'user'>;
export interface RoleGrant {
  email: string;
  role: StaffRole;
}
export const getRole = async (): Promise<Role> => {
  const r = mockRole();
  return r === 'out' ? 'user' : r;
};
export const subscribeRoles = (onChange: (g: RoleGrant[]) => void) => {
  const push = () => onChange([...roles]);
  push();
  return subscribe(push);
};
export const grantRole = async (email: string, role: StaffRole) => {
  roles.push({ email, role });
  emit();
};
export const revokeRole = async (email: string) => {
  roles.splice(roles.findIndex((r) => r.email === email), 1);
  emit();
};
