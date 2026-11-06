const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Whole calendar days between two dates (0 on the same day). */
export const daysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

export const formatDays = (days: number): string => (days === 1 ? '1 day' : `${days} days`);

const sameYear = (a: Date, b: Date) => a.getFullYear() === b.getFullYear();

/** "Nov 5", or "Nov 5, 2025" outside the current year. */
export const formatShortDate = (date: Date, now = new Date()): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear(date, now) ? {} : { year: 'numeric' }),
  });

/** "Nov 5, 2026" */
export const formatLongDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "2:14 pm" */
export const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

/** "Today", "Yesterday", or a short date. */
export const formatDay = (date: Date, now = new Date()): string => {
  const diff = daysBetween(date, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatShortDate(date, now);
};

/** yyyy-mm-dd in local time, for <input type="date">. */
export const toDateInputValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Parses yyyy-mm-dd as a local date. */
export const fromDateInputValue = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};
