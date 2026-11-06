import type { Desk, Item } from '../types/item';
import { daysBetween } from './dates';

/** Claimed items stay visible to students for this many days. */
export const CLAIMED_VISIBLE_DAYS = 14;

const DEFAULT_HOLDING_DAYS = 30;

export const daysHeld = (item: Item, now = new Date()): number => daysBetween(item.foundOn, now);

/** Desks to offer as choices: active ones, plus the current choice so a deactivated desk still shows as selected. */
export const pickableDesks = (desks: Desk[], current = ''): Desk[] => desks.filter((d) => d.active || d.id === current);

export const isPastHolding = (item: Item, desk: Desk | undefined, now = new Date()): boolean =>
  item.status === 'available' && daysHeld(item, now) > (desk?.holdingDays ?? DEFAULT_HOLDING_DAYS);

/** Items a student should see: everything held, plus recent pickups. */
export const isVisibleToStudents = (item: Item, now = new Date()): boolean =>
  item.status === 'available' ||
  (item.status === 'claimed' && daysBetween(item.statusChangedAt, now) <= CLAIMED_VISIBLE_DAYS);

export const matchesSearch = (item: Item, query: string): boolean => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${item.name} ${item.description} ${item.number}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

/** Newest found first; ties broken by when they were logged. */
export const byNewest = (a: Item, b: Item): number =>
  b.foundOn.getTime() - a.foundOn.getTime() || b.createdAt.getTime() - a.createdAt.getTime();

export const formatItemNumber = (n: number): string => `NB-${String(n).padStart(4, '0')}`;
