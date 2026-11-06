import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Desk } from '../types/item';
import type { Unsubscribe } from './items';

const desks = collection(db, 'desks');

/** The Evanston desks confirmed to run a lost and found (docs/lost-and-found-research.md). */
const EVANSTON_DESKS: Desk[] = [
  { id: 'norris', name: 'Norris Center', place: 'Norris University Center, Center Desk', hours: 'While the building is open', bring: 'Your Wildcard', holdingDays: 30 },
  { id: 'spac', name: 'SPAC', place: 'Henry Crown Sports Pavilion, front desk', hours: 'While the building is open', bring: 'Your Wildcard', holdingDays: 30 },
  { id: 'main-library', name: 'Main Library', place: 'University Library, Circulation Desk', hours: 'While the library is open', bring: 'Your Wildcard', holdingDays: 30 },
  { id: 'mudd-library', name: 'Mudd Library', place: 'Mudd Library, Service Desk', hours: 'While the library is open', bring: 'Your Wildcard', holdingDays: 30 },
];

export const subscribeDesks = (onChange: (desks: Desk[]) => void, onError: (error: Error) => void): Unsubscribe =>
  onSnapshot(
    desks,
    (snap) =>
      onChange(
        snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name ?? ''),
              place: String(data.place ?? ''),
              hours: String(data.hours ?? ''),
              bring: String(data.bring ?? ''),
              holdingDays: Number(data.holdingDays ?? 30),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      ),
    onError,
  );

export const saveDesk = async ({ id, ...fields }: Desk): Promise<void> => {
  await setDoc(id ? doc(desks, id) : doc(desks), fields);
};

export const addEvanstonDesks = async (): Promise<void> => {
  const batch = writeBatch(db);
  for (const { id, ...fields } of EVANSTON_DESKS) batch.set(doc(desks, id), fields);
  await batch.commit();
};
