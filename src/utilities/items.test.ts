import { describe, expect, it } from 'vitest';
import type { Desk, Item } from '../types/item';
import { formatItemNumber, isPastHolding, isVisibleToStudents, matchesSearch, pickableDesks } from './items';

const now = new Date(2026, 10, 6);
const daysAgo = (n: number) => new Date(2026, 10, 6 - n);

const item = (overrides: Partial<Item> = {}): Item => ({
  id: 'a',
  number: 'NB-0151',
  name: 'Blue Hydro Flask',
  description: '32 oz water bottle, navy',
  category: 'Water bottles',
  foundOn: daysAgo(1),
  foundAt: '',
  deskId: 'spac',
  status: 'available',
  statusChangedAt: daysAgo(1),
  sensitive: false,
  photoPath: null,
  createdAt: daysAgo(1),
  ...overrides,
});

const desk: Desk = { id: 'spac', name: 'SPAC', place: '', hours: '', contact: '', bring: '', holdingDays: 30, active: true };

describe('isPastHolding', () => {
  it('flags available items held longer than the desk allows', () => {
    expect(isPastHolding(item({ foundOn: daysAgo(31) }), desk, now)).toBe(true);
    expect(isPastHolding(item({ foundOn: daysAgo(30) }), desk, now)).toBe(false);
  });

  it('ignores items that already left the desk', () => {
    expect(isPastHolding(item({ foundOn: daysAgo(60), status: 'claimed' }), desk, now)).toBe(false);
  });
});

describe('isVisibleToStudents', () => {
  it('shows held items and pickups within the visible window only', () => {
    expect(isVisibleToStudents(item(), 14, now)).toBe(true);
    expect(isVisibleToStudents(item({ status: 'claimed', statusChangedAt: daysAgo(14) }), 14, now)).toBe(true);
    expect(isVisibleToStudents(item({ status: 'claimed', statusChangedAt: daysAgo(15) }), 14, now)).toBe(false);
    expect(isVisibleToStudents(item({ status: 'donated' }), 14, now)).toBe(false);
  });

  it('follows the configured window', () => {
    const pickedUp = item({ status: 'claimed', statusChangedAt: daysAgo(5) });
    expect(isVisibleToStudents(pickedUp, 7, now)).toBe(true);
    expect(isVisibleToStudents(pickedUp, 3, now)).toBe(false);
  });
});

describe('pickableDesks', () => {
  const closed: Desk = { ...desk, id: 'old', name: 'Old desk', active: false };

  it('offers active desks only', () => {
    expect(pickableDesks([desk, closed])).toEqual([desk]);
  });

  it('keeps an inactive desk that is already chosen', () => {
    expect(pickableDesks([desk, closed], 'old')).toEqual([desk, closed]);
  });
});

describe('matchesSearch', () => {
  it('matches every word against name, description, and number', () => {
    expect(matchesSearch(item(), 'navy bottle')).toBe(true);
    expect(matchesSearch(item(), 'nb-0151')).toBe(true);
    expect(matchesSearch(item(), 'navy wallet')).toBe(false);
  });
});

describe('formatItemNumber', () => {
  it('pads to four digits', () => {
    expect(formatItemNumber(7)).toBe('NB-0007');
    expect(formatItemNumber(12345)).toBe('NB-12345');
  });
});
