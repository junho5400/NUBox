import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { CATEGORIES, type Actor, type ActivityType, type Category, type Claim, type Desk, type Disposal, type Item, type ItemInput, type ItemPrivate, type ItemStatus } from '../types/item';
import { formatItemNumber } from '../utilities/items';

export type Unsubscribe = () => void;
type OnError = (error: Error) => void;

const items = collection(db, 'items');
const activity = collection(db, 'activity');
const counter = doc(db, 'counters', 'items');

const toDate = (value: unknown): Date => (value instanceof Timestamp ? value.toDate() : new Date());

const toCategory = (value: unknown): Category =>
  CATEGORIES.includes(value as Category) ? (value as Category) : 'Other';

const toItem = (snap: DocumentSnapshot<DocumentData>): Item => {
  const d = snap.data({ serverTimestamps: 'estimate' }) ?? {};
  return {
    id: snap.id,
    number: String(d.number ?? ''),
    name: String(d.name ?? ''),
    description: String(d.description ?? ''),
    category: toCategory(d.category),
    foundOn: toDate(d.foundOn),
    foundAt: String(d.foundAt ?? ''),
    deskId: String(d.deskId ?? ''),
    status: (d.status as ItemStatus) ?? 'available',
    statusChangedAt: toDate(d.statusChangedAt),
    sensitive: Boolean(d.sensitive),
    photoPath: typeof d.photoPath === 'string' ? d.photoPath : null,
    createdAt: toDate(d.createdAt),
  };
};

/** Items students may see. The status filter is required by the security rules. */
export const subscribePublicItems = (onChange: (items: Item[]) => void, onError: OnError): Unsubscribe =>
  onSnapshot(
    query(items, where('status', 'in', ['available', 'claimed'])),
    (snap) => onChange(snap.docs.map(toItem)),
    onError,
  );

/** Every item, for staff. */
export const subscribeAllItems = (onChange: (items: Item[]) => void, onError: OnError): Unsubscribe =>
  onSnapshot(items, (snap) => onChange(snap.docs.map(toItem)), onError);

export const subscribeItem = (id: string, onChange: (item: Item | null) => void, onError: OnError): Unsubscribe =>
  onSnapshot(doc(items, id), (snap) => onChange(snap.exists() ? toItem(snap) : null), onError);

export const subscribeItemPrivate = (
  id: string,
  onChange: (value: ItemPrivate) => void,
  onError: OnError,
): Unsubscribe =>
  onSnapshot(
    collection(items, id, 'private'),
    (snap) => {
      const byId = Object.fromEntries(snap.docs.map((d) => [d.id, d.data({ serverTimestamps: 'estimate' })]));
      const claim = byId.claim;
      const disposal = byId.disposal;
      onChange({
        details: String(byId.details?.text ?? ''),
        claim: claim
          ? { netid: claim.netid, name: claim.name, note: claim.note ?? '', at: toDate(claim.at), by: claim.by }
          : null,
        disposal: disposal
          ? { method: disposal.method, note: disposal.note ?? '', at: toDate(disposal.at), by: disposal.by }
          : null,
      });
    },
    onError,
  );

export const getPhotoUrl = (path: string): Promise<string> => getDownloadURL(ref(storage, path));

const uploadPhoto = async (itemId: string, photo: Blob): Promise<string> => {
  const path = `photos/${itemId}/photo.jpg`;
  await uploadBytes(ref(storage, path), photo, { contentType: 'image/jpeg' });
  return path;
};

const activityEntry = (type: ActivityType, item: { id: string; name: string }, detail: string, actor: Actor) => ({
  type,
  itemId: item.id,
  itemName: item.name,
  detail,
  by: actor.name,
  byEmail: actor.email,
  at: serverTimestamp(),
});

const itemFields = (input: ItemInput) => ({
  name: input.name.trim(),
  description: input.description.trim(),
  category: input.category,
  foundOn: Timestamp.fromDate(input.foundOn),
  foundAt: input.foundAt.trim(),
  deskId: input.deskId,
  sensitive: input.sensitive,
});

/** Logs a new item and returns its id and number. */
export const createItem = async (
  input: ItemInput,
  photo: Blob | null,
  desk: Desk,
  actor: Actor,
): Promise<{ id: string; number: string }> => {
  const itemRef = doc(items);
  const photoPath = photo ? await uploadPhoto(itemRef.id, photo) : null;
  const number = await runTransaction(db, async (tx) => {
    const next = Number((await tx.get(counter)).data()?.next ?? 1);
    const itemNumber = formatItemNumber(next);
    tx.set(counter, { next: next + 1 });
    tx.set(itemRef, {
      ...itemFields(input),
      number: itemNumber,
      status: 'available',
      statusChangedAt: serverTimestamp(),
      photoPath,
      createdAt: serverTimestamp(),
      createdBy: actor.email,
    });
    tx.set(doc(itemRef, 'private', 'details'), { text: input.privateDetails.trim() });
    tx.set(doc(activity), activityEntry('logged', { id: itemRef.id, name: input.name.trim() }, `at ${desk.name}`, actor));
    return itemNumber;
  });
  return { id: itemRef.id, number };
};

export const updateItem = async (item: Item, input: ItemInput, photo: Blob | null, actor: Actor): Promise<void> => {
  const photoPath = photo ? await uploadPhoto(item.id, photo) : item.photoPath;
  const batch = writeBatch(db);
  batch.update(doc(items, item.id), { ...itemFields(input), photoPath });
  batch.set(doc(items, item.id, 'private', 'details'), { text: input.privateDetails.trim() });
  batch.set(doc(activity), activityEntry('edited', { id: item.id, name: input.name.trim() }, '', actor));
  await batch.commit();
};

export const releaseItem = async (
  item: Item,
  claim: Pick<Claim, 'netid' | 'name' | 'note'>,
  actor: Actor,
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(items, item.id), { status: 'claimed', statusChangedAt: serverTimestamp() });
  batch.set(doc(items, item.id, 'private', 'claim'), {
    netid: claim.netid.trim().toLowerCase(),
    name: claim.name.trim(),
    note: claim.note.trim(),
    at: serverTimestamp(),
    by: actor.name,
  });
  batch.set(doc(activity), activityEntry('released', item, `to ${claim.netid.trim().toLowerCase()}`, actor));
  await batch.commit();
};

export const transferItem = async (item: Item, from: Desk | undefined, to: Desk, actor: Actor): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(items, item.id), { deskId: to.id });
  batch.set(doc(activity), activityEntry('transferred', item, `${from ? `from ${from.name} ` : ''}to ${to.name}`, actor));
  await batch.commit();
};

export const closeItem = async (
  item: Item,
  method: Disposal['method'],
  note: string,
  actor: Actor,
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(items, item.id), { status: method, statusChangedAt: serverTimestamp() });
  batch.set(doc(items, item.id, 'private', 'disposal'), { method, note: note.trim(), at: serverTimestamp(), by: actor.name });
  batch.set(doc(activity), activityEntry(method, item, note.trim(), actor));
  await batch.commit();
};
