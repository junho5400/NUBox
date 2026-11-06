import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Activity, ActivityType } from '../types/item';
import type { Unsubscribe } from './items';

const MAX_ENTRIES = 300;

export const subscribeActivity = (
  onChange: (entries: Activity[]) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'activity'), orderBy('at', 'desc'), limit(MAX_ENTRIES)),
    (snap) =>
      onChange(
        snap.docs.map((d) => {
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
        }),
      ),
    onError,
  );
