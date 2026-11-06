import { Link, useSearchParams } from 'react-router';
import { useActivity } from '../hooks/useData';
import type { Activity, ActivityType } from '../types/item';
import { ACTIVITY_VERBS, isNote } from '../utilities/activity';
import { formatDay, formatTime } from '../utilities/dates';
import { PageTitle } from './PageTitle';
import { Tabs } from './Tabs';

type Filter = 'all' | 'logged' | 'released' | 'transferred' | 'closed';

const FILTERS: { id: Filter; label: string; types: ActivityType[] }[] = [
  { id: 'all', label: 'All', types: ['logged', 'edited', 'released', 'transferred', 'donated', 'discarded', 'reopened'] },
  { id: 'logged', label: 'Logged', types: ['logged'] },
  { id: 'released', label: 'Released', types: ['released'] },
  { id: 'transferred', label: 'Transferred', types: ['transferred'] },
  { id: 'closed', label: 'Closed', types: ['donated', 'discarded'] },
];

const groupByDay = (entries: Activity[]) => {
  const groups: { day: string; entries: Activity[] }[] = [];
  for (const entry of entries) {
    const day = formatDay(entry.at);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
};

export const ActivityPage = () => {
  const [params] = useSearchParams();
  const activity = useActivity();
  const filter = FILTERS.find((f) => f.id === params.get('type')) ?? FILTERS[0];
  const entries = activity.status === 'ready' ? activity.data.filter((e) => filter.types.includes(e.type)) : [];

  return (
    <div className="px-4 pb-16 md:px-8">
      <PageTitle>Activity</PageTitle>
      <div className="border-b border-line">
        <Tabs
          label="Filter activity"
          items={FILTERS.map((f) => ({ to: f.id === 'all' ? '/activity' : `/activity?type=${f.id}`, label: f.label, current: f.id === filter.id }))}
        />
      </div>
      <div className="flex flex-col gap-10 pt-8">
        {activity.status === 'loading' && <p className="text-ink-3">Loading</p>}
        {activity.status === 'error' && <p className="text-danger">Couldn’t load activity. Refresh to try again.</p>}
        {activity.status === 'ready' && entries.length === 0 && <p className="text-heading">No activity yet.</p>}
        {groupByDay(entries).map(({ day, entries: dayEntries }) => (
          <section key={day} aria-label={day}>
            <h2 className="pb-3 text-heading font-medium">{day}</h2>
            <ul>
              {dayEntries.map((e) => (
                <li key={e.id} className="flex items-baseline gap-4 border-t border-line py-3.5 md:gap-6">
                  <span className="w-16 shrink-0 text-small text-ink-3">{formatTime(e.at)}</span>
                  <p className="min-w-0 flex-1 text-ink-2">
                    {ACTIVITY_VERBS[e.type]}{' '}
                    <Link to={`/inventory/${e.itemId}`} className="font-medium text-ink hover:text-accent">
                      {e.itemName}
                    </Link>
                    {!isNote(e.type) && e.detail && ` ${e.detail}`}
                    {isNote(e.type) && e.detail && <span className="block text-small text-ink-3">{e.detail}</span>}
                  </p>
                  <span className="hidden shrink-0 text-small text-ink-2 sm:block">{e.by}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
