import { collection, limit, onSnapshot, orderBy, query, Timestamp, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { Activity, ActivityType } from '../types/item';
import type { Unsubscribe } from './items';

const MAX_ENTRIES = 300;

const activity = collection(db, 'activity');

const toActivity = (d: QueryDocumentSnapshot): Activity => {
  const data = d.data({ serverTimestamps: 'estimate' });
  return {
    id: d.id,
    type: data.type as ActivityType,
    itemId: String(data.itemId ?? ''),
    itemName: String(data.itemName ?? ''),
    detail: String(data.detail ?? ''),
    at: data.at instanceof Timestamp ? data.at.toDate() : new Date(),
    by: String(data.by ?? ''),
  };
};

export const subscribeActivity = (
  onChange: (entries: Activity[]) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(activity, orderBy('at', 'desc'), limit(MAX_ENTRIES)),
    (snap) => onChange(snap.docs.map(toActivity)),
    onError,
  );

/** One item's history, oldest first. Sorted here so the query needs no composite index. */
export const subscribeItemActivity = (
  itemId: string,
  onChange: (entries: Activity[]) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(activity, where('itemId', '==', itemId)),
    (snap) => onChange(snap.docs.map(toActivity).sort((a, b) => a.at.getTime() - b.at.getTime())),
    onError,
  );
