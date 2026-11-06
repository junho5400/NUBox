import type { ActivityType, ItemStatus } from '../types/item';

export const ACTIVITY_VERBS: Record<ActivityType, string> = {
  logged: 'Logged',
  edited: 'Edited',
  released: 'Released',
  transferred: 'Transferred',
  donated: 'Donated',
  discarded: 'Discarded',
  reopened: 'Reopened',
};

/** Notes on donations and undos are free text, so they go on their own line. */
export const isNote = (type: ActivityType) => type === 'donated' || type === 'discarded' || type === 'reopened';

const UNDONE: Record<Exclude<ItemStatus, 'available'>, string> = {
  claimed: 'release',
  donated: 'donation',
  discarded: 'discard',
};

/** "Undo release" and the like, or null for items still in custody. */
export const undoLabel = (status: ItemStatus): string | null => (status === 'available' ? null : `Undo ${UNDONE[status]}`);
