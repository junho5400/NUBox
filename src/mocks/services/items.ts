import type { Activity, Actor, Claim, Desk, Disposal, Item, ItemInput, ItemPrivate } from '../../types/item';
import { activity, emit, items, privateDetails, subscribe } from '../store';

export type Unsubscribe = () => void;

const watch = <T,>(read: () => T, onChange: (v: T) => void): Unsubscribe => {
  const push = () => onChange(read());
  push();
  return subscribe(push);
};
const log = (type: Activity['type'], item: { id: string; name: string }, detail: string, actor: Actor) =>
  activity.push({ id: `a${activity.length + 1}`, type, itemId: item.id, itemName: item.name, detail, at: new Date(), by: actor.name });

export const subscribePublicItems = (onChange: (i: Item[]) => void) =>
  watch(() => items.filter((i) => i.status === 'available' || i.status === 'claimed'), onChange);
export const subscribeAllItems = (onChange: (i: Item[]) => void) => watch(() => [...items], onChange);
export const subscribeItem = (id: string, onChange: (i: Item | null) => void) =>
  watch(() => items.find((i) => i.id === id) ?? null, onChange);
export const subscribeItemPrivate = (id: string, onChange: (v: ItemPrivate) => void) =>
  watch(() => privateDetails[id] ?? { details: '', claim: null, disposal: null }, onChange);

/** Mock photos are "p:#hex:w:h" — a flat swatch in that aspect ratio, with a centered mark to show cropping. */
export const getPhotoUrl = async (path: string) => {
  const [, color = '#999', w = 4, h = 3] = path.split(':').map((part, i) => (i > 1 ? Number(part) : part)) as [string, string, number, number];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 100}" height="${h * 100}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${color}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.3}" fill="#fff" fill-opacity=".2"/><rect x=".04" y=".04" width="${w - 0.08}" height="${h - 0.08}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".02"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const createItem = async (input: ItemInput, photo: Blob | null, desk: Desk, actor: Actor) => {
  const id = `item-${items.length + 1}`;
  const number = `NB-${String(152 + items.length).padStart(4, '0')}`;
  const now = new Date();
  items.unshift({ id, number, ...input, status: 'available', statusChangedAt: now, photoPath: photo ? 'p:#777' : null, createdAt: now });
  privateDetails[id] = { details: input.privateDetails, claim: null, disposal: null };
  log('logged', { id, name: input.name }, `at ${desk.name}`, actor);
  emit();
  return { id, number };
};
export const updateItem = async (item: Item, input: ItemInput, _photo: Blob | null, actor: Actor) => {
  Object.assign(item, input);
  log('edited', item, '', actor);
  emit();
};
export const releaseItem = async (item: Item, claim: Pick<Claim, 'netid' | 'name' | 'contact' | 'note'>, actor: Actor) => {
  Object.assign(item, { status: 'claimed', statusChangedAt: new Date() });
  privateDetails[item.id] = { ...(privateDetails[item.id] ?? { details: '', disposal: null }), claim: { ...claim, at: new Date(), by: actor.name } };
  log('released', item, claim.netid ? `to ${claim.netid}` : `to ${claim.name} (visitor)`, actor);
  emit();
};
export const transferItem = async (item: Item, from: Desk | undefined, to: Desk, actor: Actor) => {
  item.deskId = to.id;
  log('transferred', item, `${from ? `from ${from.name} ` : ''}to ${to.name}`, actor);
  emit();
};
export const closeItem = async (item: Item, method: Disposal['method'], note: string, actor: Actor) => {
  Object.assign(item, { status: method, statusChangedAt: new Date() });
  privateDetails[item.id] = { ...(privateDetails[item.id] ?? { details: '', claim: null }), disposal: { method, note, at: new Date(), by: actor.name } };
  log(method, item, note, actor);
  emit();
};
export const reopenItem = async (item: Item, note: string, actor: Actor) => {
  Object.assign(item, { status: 'available', statusChangedAt: new Date() });
  privateDetails[item.id] = { ...(privateDetails[item.id] ?? { details: '' }), claim: null, disposal: null };
  log('reopened', item, note, actor);
  emit();
};
