import { useState, type PropsWithChildren } from 'react';
import { ALL_DESKS, StaffDeskContext } from '../hooks/useStaffDesk';

const STORAGE_KEY = 'nubox.desk';

const readStored = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ALL_DESKS;
  } catch {
    return ALL_DESKS;
  }
};

/** Remembers which desk a staff member is working at, per browser. */
export const StaffDeskProvider = ({ children }: PropsWithChildren) => {
  const [deskId, setDeskIdState] = useState(readStored);

  const setDeskId = (id: string) => {
    setDeskIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can be unavailable (private mode); the choice still holds for this session.
    }
  };

  return <StaffDeskContext value={{ deskId, setDeskId }}>{children}</StaffDeskContext>;
};
