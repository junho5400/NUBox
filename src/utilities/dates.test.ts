import { describe, expect, it } from 'vitest';
import { daysBetween, formatDay, formatDays, formatShortDate, fromDateInputValue, toDateInputValue } from './dates';

describe('dates', () => {
  it('counts calendar days, not 24-hour periods', () => {
    expect(daysBetween(new Date(2026, 10, 5, 23, 0), new Date(2026, 10, 6, 1, 0))).toBe(1);
    expect(daysBetween(new Date(2026, 10, 6, 8), new Date(2026, 10, 6, 20))).toBe(0);
  });

  it('labels recent days in words', () => {
    const now = new Date(2026, 10, 6, 12);
    expect(formatDay(new Date(2026, 10, 6, 9), now)).toBe('Today');
    expect(formatDay(new Date(2026, 10, 5, 9), now)).toBe('Yesterday');
    expect(formatDay(new Date(2026, 10, 3), now)).toBe('Nov 3');
  });

  it('adds the year only outside the current year', () => {
    const now = new Date(2026, 10, 6);
    expect(formatShortDate(new Date(2026, 9, 30), now)).toBe('Oct 30');
    expect(formatShortDate(new Date(2025, 9, 30), now)).toBe('Oct 30, 2025');
  });

  it('pluralizes days', () => {
    expect(formatDays(1)).toBe('1 day');
    expect(formatDays(3)).toBe('3 days');
  });

  it('round-trips date input values in local time', () => {
    const date = fromDateInputValue('2026-11-06');
    expect(date && toDateInputValue(date)).toBe('2026-11-06');
    expect(fromDateInputValue('11/06/2026')).toBeNull();
  });
});
