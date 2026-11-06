import type { ActivityType } from '../types/item';

export const ACTIVITY_VERBS: Record<ActivityType, string> = {
  logged: 'Logged',
  edited: 'Edited',
  released: 'Released',
  transferred: 'Transferred',
  donated: 'Donated',
  discarded: 'Discarded',
};

/** Notes on donations are free text, so they go on their own line. */
export const isNote = (type: ActivityType) => type === 'donated' || type === 'discarded';
