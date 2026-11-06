import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppSettings } from '../types/settings';
import { CLAIMED_VISIBLE_DAYS } from '../utilities/items';
import type { Unsubscribe } from './items';

const settings = doc(db, 'settings', 'app');

/** Falls back to defaults until a super-admin saves settings for the first time. */
export const subscribeSettings = (onChange: (settings: AppSettings) => void, onError: (error: Error) => void): Unsubscribe =>
  onSnapshot(
    settings,
    (snap) => {
      const days: unknown = snap.data()?.claimedVisibleDays;
      onChange({ claimedVisibleDays: typeof days === 'number' ? days : CLAIMED_VISIBLE_DAYS });
    },
    onError,
  );

export const saveSettings = async (value: AppSettings): Promise<void> => {
  await setDoc(settings, value);
};
