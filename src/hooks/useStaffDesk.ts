import { createContext, useContext } from 'react';

export const ALL_DESKS = 'all';

export interface StaffDeskValue {
  /** Desk id the staff member is working at, or ALL_DESKS. */
  deskId: string;
  setDeskId: (id: string) => void;
}

export const StaffDeskContext = createContext<StaffDeskValue | null>(null);

export const useStaffDesk = (): StaffDeskValue => {
  const value = useContext(StaffDeskContext);
  if (!value) throw new Error('useStaffDesk must be used inside StaffDeskProvider');
  return value;
};
